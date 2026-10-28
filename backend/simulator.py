import asyncio
import random
import logging
import datetime
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import Device, Telemetry, Incident, Zone, GatewayHealth, Worker, utcnow
from backend.ai_engine import ai_engine
from backend.notifications_engine import notification_engine
from backend.websocket_manager import ws_manager
from backend.firebase_admin import writeData

logger = logging.getLogger("smart_industry.simulator")

class IndustrialSimulator:
    def __init__(self):
        self.is_running = False
        self.active_scenarios = {} # key: zone_id or device_id, value: scenario data

    async def run_simulation_loop(self):
        self.is_running = True
        logger.info("Starting industrial background telemetry simulator...")
        while self.is_running:
            try:
                db = SessionLocal()
                await self.generate_telemetry_tick(db)
                # Also check escalation
                await notification_engine.check_and_escalate_unacknowledged(db, timeout_seconds=40)
                db.close()
            except Exception as e:
                logger.error(f"Error in telemetry simulation tick: {e}")
            await asyncio.sleep(3.5)

    async def generate_telemetry_tick(self, db: Session):
        devices = db.query(Device).filter(Device.is_simulated == True, Device.connection_status != "OFFLINE").all()
        if not devices:
            return

        sampled_devices = random.sample(devices, min(len(devices), 8))
        for device in sampled_devices:
            # Check if this zone has an active emergency scenario
            scenario = self.active_scenarios.get(device.zone_id)
            
            # Determine metric and base value according to device_type
            if device.device_type == "GAS_DETECTOR":
                metric_name = "combustible_gas"
                unit = "ppm"
                min_th, max_th = 0.0, 50.0
                if scenario and scenario["type"] == "GAS_LEAK":
                    value = random.uniform(180.0, 320.0) # Dangerous spike
                else:
                    value = max(0.0, random.gauss(12.0, 3.5))

            elif device.device_type == "ENVIRONMENTAL_STATION":
                metric_name = "temperature"
                unit = "°C"
                min_th, max_th = 15.0, 42.0
                if scenario and scenario["type"] == "THERMAL_RUNAWAY":
                    value = random.uniform(75.0, 98.0) # Extreme heat
                else:
                    value = random.gauss(24.5, 1.8)

            elif device.device_type == "VIBRATION_SENSOR":
                metric_name = "vibration_rms"
                unit = "mm/s"
                min_th, max_th = 0.2, 4.5
                if scenario and scenario["type"] == "VIBRATION_SPIKE":
                    value = random.uniform(7.8, 12.4) # Severe imbalance
                else:
                    value = max(0.1, random.gauss(1.6, 0.4))

            else:
                metric_name = "smoke_ppm"
                unit = "ppm"
                min_th, max_th = 0.0, 20.0
                if scenario and scenario["type"] == "GAS_LEAK":
                    value = random.uniform(45.0, 85.0)
                else:
                    value = max(0.0, random.gauss(3.5, 1.2))

            # Quality score & status
            status = "NORMAL"
            if value > max_th:
                status = "CRITICAL" if value > max_th * 1.5 else "WARNING"
            elif min_th is not None and value < min_th:
                status = "WARNING"

            # Fresh timestamp
            now = utcnow()
            telemetry = Telemetry(
                device_id=device.device_id,
                zone_id=device.zone_id,
                timestamp=now,
                metric_name=metric_name,
                metric_value=round(value, 2),
                unit=unit,
                min_threshold=min_th,
                max_threshold=max_th,
                status=status,
                quality_score=0.99,
                is_simulated=True
            )
            db.add(telemetry)
            
            # Update device last_seen_at
            device.last_seen_at = now
            if status == "CRITICAL":
                device.connection_status = "CRITICAL"
            elif status == "WARNING" and device.connection_status == "ONLINE":
                device.connection_status = "WARNING"

            # Sync latest reading to Firebase Realtime Database
            try:
                writeData(f"live_telemetry/{device.device_id}", {
                    "device_id": device.device_id,
                    "zone_id": device.zone_id,
                    "plant_id": device.plant_id,
                    "metric_name": metric_name,
                    "metric_value": round(value, 2),
                    "unit": unit,
                    "min_threshold": min_th,
                    "max_threshold": max_th,
                    "status": status,
                    "quality_score": 0.99,
                    "is_simulated": True,
                    "timestamp": now.isoformat(),
                })
                writeData(f"devices/{device.device_id}/connection_status", device.connection_status)
                writeData(f"devices/{device.device_id}/last_seen_at", now.isoformat())
            except Exception:
                pass  # Best-effort sync

            # Check if this reading should trigger AI Anomaly or Incident
            if status == "CRITICAL" and not self.has_open_incident_for_device(db, device.device_id):
                incident = await self.create_automatic_incident(db, device, metric_name, value, unit)
                if incident:
                    await notification_engine.dispatch_incident_alerts(db, incident)

        db.commit()

        # Broadcast live telemetry update over WebSocket
        await ws_manager.broadcast("TELEMETRY_UPDATE", {
            "sampled_count": len(sampled_devices),
            "timestamp": str(utcnow())
        })

    def has_open_incident_for_device(self, db: Session, device_id: str) -> bool:
        existing = db.query(Incident).filter(
            Incident.device_id == device_id,
            Incident.status.in_(["NEW", "ACKNOWLEDGED", "RESPONDING"])
        ).first()
        return existing is not None

    async def create_automatic_incident(self, db: Session, device: Device, metric: str, val: float, unit: str) -> Incident:
        inc_count = db.query(Incident).count() + 1
        inc_number = f"INC-{utcnow().strftime('%Y%m%d')}-{inc_count:04d}"
        
        category_map = {
            "combustible_gas": ("HAZARDOUS_GAS", "Critical Combustible Gas Leak Detected"),
            "temperature": ("ABNORMAL_TEMPERATURE", "Thermal Runaway Exceedance"),
            "vibration_rms": ("EQUIPMENT_ELECTRICAL_FAULT", "Catastrophic Mechanical Vibration Breach"),
            "smoke_ppm": ("FIRE_SMOKE", "High Smoke Particulate Density Trigger")
        }
        category, title = category_map.get(metric, ("MANUAL_REPORT", f"Threshold Breach on {metric}"))
        
        incident = Incident(
            incident_number=inc_number,
            plant_id=device.plant_id,
            zone_id=device.zone_id,
            device_id=device.device_id,
            category=category,
            severity="CRITICAL",
            detection_method="AUTOMATED_RULE",
            title=f"{title} ({device.name})",
            description=f"Sensor {device.device_id} in Zone {device.zone_id} reported {val:.2f} {unit}, exceeding critical threshold.",
            status="NEW",
            assigned_team="Rapid Emergency Response Team Alpha",
            created_at=utcnow(),
            is_simulated=True
        )
        db.add(incident)
        
        # Mark zone as hazard
        zone = db.query(Zone).filter(Zone.id == device.zone_id).first()
        if zone:
            zone.hazard_status = "EVACUATE"

        db.commit()
        db.refresh(incident)

        # Sync incident to Firebase
        try:
            writeData(f"incidents/{incident.incident_number}", {
                "id": incident.id,
                "incident_number": incident.incident_number,
                "plant_id": incident.plant_id,
                "zone_id": incident.zone_id,
                "device_id": incident.device_id,
                "category": incident.category,
                "severity": incident.severity,
                "detection_method": incident.detection_method,
                "title": incident.title,
                "description": incident.description,
                "status": incident.status,
                "assigned_team": incident.assigned_team,
                "created_at": incident.created_at.isoformat(),
                "is_simulated": True,
            })
            writeData(f"zones/{incident.zone_id}/hazard_status", "EVACUATE")
        except Exception:
            pass

        await ws_manager.broadcast("INCIDENT_CREATED", {
            "id": incident.id,
            "incident_number": incident.incident_number,
            "title": incident.title,
            "severity": incident.severity,
            "zone_id": incident.zone_id,
            "category": incident.category,
            "status": incident.status,
            "is_simulated": True,
            "created_at": str(incident.created_at)
        })
        return incident

    def inject_scenario(self, scenario_type: str, zone_id: int):
        self.active_scenarios[zone_id] = {
            "type": scenario_type,
            "started_at": utcnow()
        }
        logger.info(f"Injected emergency scenario '{scenario_type}' into Zone {zone_id}")

    def clear_scenarios(self):
        self.active_scenarios.clear()
        logger.info("Cleared all active simulation scenarios.")

simulator = IndustrialSimulator()
