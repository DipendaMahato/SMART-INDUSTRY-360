from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Plant, Zone, Device, Incident
from backend.schemas import PlantOut, ZoneOut

router = APIRouter(prefix="/digital-twin", tags=["Factory Digital Twin"])

@router.get("/plants", response_model=list[PlantOut])
def get_plants(db: Session = Depends(get_db)):
    return db.query(Plant).filter(Plant.is_active == True).all()

@router.get("/zones", response_model=list[ZoneOut])
def get_zones(plant_id: int = Query(default=1), db: Session = Depends(get_db)):
    return db.query(Zone).filter(Zone.plant_id == plant_id).all()

@router.get("/plant/{plant_id}/layout")
def get_plant_layout(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    zones = db.query(Zone).filter(Zone.plant_id == plant_id).all()
    devices = db.query(Device).filter(Device.plant_id == plant_id).all()
    active_incidents = db.query(Incident).filter(
        Incident.plant_id == plant_id,
        Incident.status.in_(["NEW", "ACKNOWLEDGED", "RESPONDING"])
    ).all()

    # Pre-defined layout grid coordinates for crisp 2D digital twin floor plan
    layout_meta = {
        "BAY-A": {"x": 50, "y": 60, "width": 380, "height": 220, "label": "Machining & Milling Hall A"},
        "BAY-CHEM": {"x": 470, "y": 60, "width": 360, "height": 220, "label": "Chemical Reactor & Solvent Bay"},
        "YARD-HV": {"x": 870, "y": 60, "width": 260, "height": 480, "label": "High-Voltage Transformer Yard"},
        "BAY-ROBOT": {"x": 50, "y": 320, "width": 380, "height": 220, "label": "Automated Robotic Assembly Bay"},
        "WH-LOGISTICS": {"x": 470, "y": 320, "width": 360, "height": 220, "label": "Finished Goods Logistics Hub"},
        "CCR-01": {"x": 470, "y": 570, "width": 360, "height": 140, "label": "Central Industrial Control Room"},
    }

    zone_details = []
    for z in zones:
        meta = layout_meta.get(z.code, {"x": 50, "y": 50, "width": 200, "height": 150, "label": z.name})
        z_devs = [
            {
                "id": d.id,
                "device_id": d.device_id,
                "name": d.name,
                "type": d.device_type,
                "status": d.connection_status,
                "battery": d.battery_percentage
            } for d in devices if d.zone_id == z.id
        ]
        z_incs = [
            {
                "id": inc.id,
                "incident_number": inc.incident_number,
                "category": inc.category,
                "severity": inc.severity,
                "title": inc.title,
                "status": inc.status
            } for inc in active_incidents if inc.zone_id == z.id
        ]
        zone_details.append({
            "id": z.id,
            "name": z.name,
            "code": z.code,
            "zone_type": z.zone_type,
            "max_occupancy": z.max_occupancy,
            "current_occupancy": z.current_occupancy,
            "hazard_status": z.hazard_status,
            "svg_layout": meta,
            "devices": z_devs,
            "active_incidents": z_incs
        })

    return {
        "plant_id": plant.id,
        "plant_name": plant.name,
        "floor_plan_dimensions": {"width": 1200, "height": 760},
        "zones": zone_details
    }
