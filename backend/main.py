import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.models import utcnow
from database.seed_data import seed_database
from backend.simulator import simulator
from backend.websocket_manager import ws_manager

# Import all routers
from backend.routers.auth_routes import router as auth_router
from backend.routers.dashboard_routes import router as dashboard_router
from backend.routers.telemetry_routes import router as telemetry_router
from backend.routers.incidents_routes import router as incidents_router
from backend.routers.alerts_routes import router as alerts_router
from backend.routers.digital_twin_routes import router as digital_twin_router
from backend.routers.devices_routes import router as devices_router
from backend.routers.workers_routes import router as workers_router
from backend.routers.equipment_routes import router as equipment_router
from backend.routers.ai_routes import router as ai_router
from backend.routers.cctv_routes import router as cctv_router
from backend.routers.evacuation_routes import router as evacuation_router
from backend.routers.gateways_routes import router as gateways_router
from backend.routers.reports_routes import router as reports_router
from backend.routers.audit_routes import router as audit_router
from backend.routers.settings_routes import router as settings_router
from backend.routers.simulator_routes import router as simulator_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("smart_industry.app")

simulation_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Smart Industry 360 database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Run seed data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Start background industrial simulator if enabled
    global simulation_task
    if settings.SIMULATION_ENABLED:
        logger.info("Launching background industrial telemetry simulator loop...")
        simulation_task = asyncio.create_task(simulator.run_simulation_loop())

    yield

    # Teardown
    if simulation_task:
        simulator.is_running = False
        simulation_task.cancel()
        logger.info("Background industrial telemetry simulator stopped.")

app = FastAPI(
    title="Smart Industry 360 API",
    description="Intelligent IoT- and AI-Enabled Industrial Safety, Emergency Response, and Real-Time Monitoring System",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Endpoint
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open; receive client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
        ws_manager.disconnect(websocket)

# Health Check
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Smart Industry 360 Enterprise API Gateway",
        "version": settings.VERSION,
        "timestamp": str(utcnow()),
        "simulation_enabled": settings.SIMULATION_ENABLED
    }

# Register Routers
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(dashboard_router, prefix=api_v1)
app.include_router(telemetry_router, prefix=api_v1)
app.include_router(incidents_router, prefix=api_v1)
app.include_router(alerts_router, prefix=api_v1)
app.include_router(digital_twin_router, prefix=api_v1)
app.include_router(devices_router, prefix=api_v1)
app.include_router(workers_router, prefix=api_v1)
app.include_router(equipment_router, prefix=api_v1)
app.include_router(ai_router, prefix=api_v1)
app.include_router(cctv_router, prefix=api_v1)
app.include_router(evacuation_router, prefix=api_v1)
app.include_router(gateways_router, prefix=api_v1)
app.include_router(reports_router, prefix=api_v1)
app.include_router(audit_router, prefix=api_v1)
app.include_router(settings_router, prefix=api_v1)
app.include_router(simulator_router, prefix=api_v1)
