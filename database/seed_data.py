import datetime
from sqlalchemy.orm import Session
from backend.models import (
    User, Plant, Zone, Device, Equipment, WorkOrder,
    AIModelMetadata, CameraSecurityEvent, EvacuationPlan,
    GatewayHealth, AuditLog, SystemSetting, Incident, Notification, utcnow
)
from backend.auth import get_password_hash

def seed_database(db: Session):
    # Only seed if users table is empty
    if db.query(User).count() > 0:
        return

    print("Seeding initial Smart Industry 360 database records...")

    # 1. Plants
    plant1 = Plant(
        name="Detroit Advanced Powertrain Mega-Factory",
        code="DET-01",
        location="1200 Industrial Parkway, Detroit, MI, USA",
        timezone="America/Detroit",
        latitude=42.3314,
        longitude=-83.0458
    )
    plant2 = Plant(
        name="Houston Petrochemical & Polymer Facility",
        code="HOU-02",
        location="4500 Refinery Row, Houston, TX, USA",
        timezone="America/Chicago",
        latitude=29.7604,
        longitude=-95.3698
    )
    db.add_all([plant1, plant2])
    db.commit()
    db.refresh(plant1)
    db.refresh(plant2)

    # 2. Users (All 8 Roles)
    users_data = [
        ("superadmin", "superadmin@smartindustry360.com", "Admin@123", "Dr. Marcus Vance", "SUPER_ADMIN", plant1.id, "Executive Command"),
        ("plantadmin", "plantadmin@smartindustry360.com", "Plant@123", "Sarah Jenkins", "PLANT_ADMIN", plant1.id, "Plant Operations"),
        ("operator", "operator@smartindustry360.com", "Operator@123", "Elena Rostova", "CONTROL_ROOM_OPERATOR", plant1.id, "Control Room Ops"),
        ("safety", "safety@smartindustry360.com", "Safety@123", "Captain David Chen", "SAFETY_OFFICER", plant1.id, "EHS & Industrial Safety"),
        ("security", "security@smartindustry360.com", "Security@123", "Robert Miller", "SECURITY_PERSONNEL", plant1.id, "Plant Physical Security"),
        ("maintenance", "maintenance@smartindustry360.com", "Maint@123", "Carlos Rodriguez", "MAINTENANCE_ENGINEER", plant1.id, "Reliability & Maintenance"),
        ("worker", "worker@smartindustry360.com", "Worker@123", "Alex Morgan", "WORKER", plant1.id, "Production Line Operations"),
        ("auditor", "auditor@smartindustry360.com", "Auditor@123", "Patricia Hayes", "READ_ONLY_AUDITOR", plant1.id, "External Compliance"),
    ]

    users = []
    for uname, email, pwd, fname, role, pid, dept in users_data:
        u = User(
            username=uname,
            email=email,
            hashed_password=get_password_hash(pwd),
            full_name=fname,
            role=role,
            plant_id=pid,
            department=dept,
            is_active=True
        )
        db.add(u)
        users.append(u)
    db.commit()

    # 3. Zones for Plant 1
    zones_data = [
        ("Machining & Milling Hall A", "BAY-A", "Floor 1", "PRODUCTION", 45, "CLEAR"),
        ("Chemical Reactor & Solvent Bay", "BAY-CHEM", "Floor 1", "CHEMICAL_STORAGE", 20, "CLEAR"),
        ("High-Voltage Transformer Yard", "YARD-HV", "Ground Exterior", "HIGH_VOLTAGE", 10, "CLEAR"),
        ("Automated Robotic Assembly Bay", "BAY-ROBOT", "Floor 1", "ASSEMBLY", 35, "CLEAR"),
        ("Finished Goods Logistics Hub", "WH-LOGISTICS", "Floor 1", "WAREHOUSE", 30, "CLEAR"),
        ("Central Industrial Control Room", "CCR-01", "Mezzanine Level", "CONTROL_ROOM", 15, "CLEAR"),
    ]

    zones = []
    for zname, zcode, floor, ztype, max_occ, hstatus in zones_data:
        z = Zone(
            plant_id=plant1.id,
            name=zname,
            code=zcode,
            floor_level=floor,
            zone_type=ztype,
            max_occupancy=max_occ,
            current_occupancy=random_occ(max_occ),
            hazard_status=hstatus,
            is_evacuation_route=True
        )
        db.add(z)
        zones.append(z)
    db.commit()

    # 4. Devices & Sensors (Clean empty slate - real sensors registered via portal)
    # No placeholder/simulated devices seeded. Add real plant sensors via /devices API.

    # 5. Equipment Inventory (Clean empty slate - real equipment added via portal)
    # 6. Work Orders (Clean empty slate)

    # 7. AI Models Metadata
    m1 = AIModelMetadata(
        model_name="Multi-Sensor Spatial Anomaly Detector",
        model_type="ISOLATION_FOREST",
        version="v1.2.4-rf-iso",
        status="ACTIVE",
        precision=0.965,
        recall=0.942,
        f1_score=0.953,
        false_positive_rate=0.028,
        latency_ms=11.4,
        trained_sample_count=185000
    )
    m2 = AIModelMetadata(
        model_name="Rotating Machinery Remaining Useful Life Regressor",
        model_type="RUL_REGRESSOR",
        version="v2.1.0-gbm",
        status="ACTIVE",
        precision=0.938,
        recall=0.915,
        f1_score=0.926,
        false_positive_rate=0.045,
        latency_ms=18.6,
        trained_sample_count=94000
    )
    db.add_all([m1, m2])
    db.commit()

    # 8. CCTV Security Events
    cam_event1 = CameraSecurityEvent(
        camera_id="DEV-CAM-02",
        camera_name="Restricted Yard Perimeter Camera Cam-02",
        zone_id=zones[2].id,
        event_type="RESTRICTED_ZONE_ENTRY",
        confidence=0.94,
        frame_snapshot_url="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop",
        human_verification_status="PENDING"
    )
    cam_event2 = CameraSecurityEvent(
        camera_id="DEV-CAM-01",
        camera_name="Explosion-Proof Dome Camera Cam-01",
        zone_id=zones[1].id,
        event_type="MISSING_PPE",
        confidence=0.88,
        frame_snapshot_url="https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop",
        human_verification_status="VERIFIED",
        reviewed_by_user_id=users[3].id, # Safety Officer
        review_notes="Worker entered without mandatory Level 2 chemical respirator goggles. Verbal warning issued."
    )
    db.add_all([cam_event1, cam_event2])
    db.commit()

    # 9. Evacuation Plans
    for idx, z in enumerate(zones):
        plan = EvacuationPlan(
            plant_id=plant1.id,
            zone_id=z.id,
            primary_route_name=f"Primary Route Corridor E-{idx+1} to North Lawn",
            secondary_route_name=f"Secondary Fire Stairwell S-{idx+1} to South Gate",
            assembly_point_name="Muster Point Alpha (North Parking)",
            exit_door_id=f"EXIT-DOOR-{idx+1:02d}",
            is_blocked=False
        )
        db.add(plan)
    db.commit()

    # 10. Gateway Health
    gw = GatewayHealth(
        gateway_id="DEV-GW-01",
        plant_id=plant1.id,
        name="Primary Edge LoRaWAN & MQTT Industrial Gateway",
        ip_address="10.0.1.15",
        status="HEALTHY",
        broker_connected=True,
        ping_latency_ms=3.8,
        packet_loss_percent=0.0,
        buffered_events_count=0
    )
    db.add(gw)
    db.commit()

    # 11. Incidents & Notifications (Clean initial state - zero fake incidents)

    # 12. Audit Logs
    audit1 = AuditLog(
        user_id=users[0].id,
        username="superadmin",
        action="SYSTEM_INITIALIZE",
        entity_type="SYSTEM",
        entity_id="ROOT",
        details="Smart Industry 360 platform initialized with ISO 45001 safety baseline.",
        ip_address="127.0.0.1"
    )
    db.add(audit1)
    db.commit()

    print("Seed data completed successfully!")

def random_occ(max_occ):
    import random
    return random.randint(max(1, int(max_occ * 0.3)), int(max_occ * 0.85))
