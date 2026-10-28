# SMART INDUSTRY 360
### Intelligent IoT- and AI-Enabled Industrial Safety, Emergency Response, and Real-Time Monitoring System

---

## 1. Executive Overview

**Smart Industry 360** is a full-stack industrial safety and intelligence command platform that unifies physical microcontrollers, edge computing gateways, predictive artificial intelligence, frontline worker mobile portals, and a centralized control-room dashboard into a single real-time operational ecosystem.

### Core Problems Solved:
1. **Delayed or Missed Emergency Notifications**: Multi-channel outbox notification service (Dashboard, Mobile App, SMS, Sirens) with a 45-second automated escalation timer.
2. **Disconnected Sensors & Silent Failures**: LWT heartbeat tracking, signal strength (dBm) logging, and data freshness metrics. Disconnected devices are never falsely shown as healthy.
3. **Incomplete Incident Traceability**: Formal documented lifecycle (`NEW` → `ACKNOWLEDGED` → `RESPONDING` → `CONTAINED` → `RESOLVED`) with append-only tamper-evident audit trails.
4. **Cloud-Dependent Safety Vulnerabilities**: Autonomous edge fail-safe logic triggers local hardware alarms in `<250ms` without waiting for cloud roundtrips.
5. **Network Severing & Packet Loss**: Edge gateway store-and-forward architecture with SQLite buffering (`edge_buffer.db`) and loss-free cloud reconnection synchronization.
6. **Unexplained Anomaly Detections**: Scikit-learn Isolation Forest model paired with transparent sensor fusion rules and explainability reason codes (e.g. `THERMAL_AEROSOL_CONCOMITANT_SIGNATURE`).

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, React Router v7.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn, WebSockets.
- **Database**: SQLite (default zero-friction standalone execution) / PostgreSQL with TimescaleDB compatibility.
- **Messaging & Edge**: MQTT (Mosquitto Port 1883), Python Edge Gateway daemon, SQLite local buffer.
- **Microcontroller**: ESP32 C++ firmware (`smart_industry_esp32.ino`) with hardware interrupts, ADC voltage divider calculations, and SPIFFS ring-buffering.
- **Machine Learning**: Scikit-Learn Isolation Forest, statistical rolling z-score vector evaluation, predictive RUL estimation.
- **Containerization**: Docker, Docker Compose, Nginx reverse proxy.

---

## 3. Pre-Configured Evaluation Credentials

The system seeds eight authenticated roles representing least-privilege industrial access:

| Role | Username | Password | Operational Scope |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `superadmin` | `Admin@123` | Root configuration, user access, security overrides |
| **Plant Administrator** | `plantadmin` | `Plant@123` | Plant facility settings, zones, work orders |
| **Control-Room Operator**| `operator` | `Operator@123` | Live monitoring, incident lifecycle, device commands |
| **Safety Officer** | `safety` | `Safety@123` | Incident escalation, evacuation drill trigger, muster points |
| **Security Personnel** | `security` | `Security@123` | CCTV camera inspection, human verification of AI flags |
| **Maintenance Engineer** | `maintenance` | `Maint@123` | Equipment health, vibration curves, work orders |
| **Worker** | `worker` | `Worker@123` | Mobile portal, 1-tap SOS distress, hazard reports |
| **Read-Only Auditor** | `auditor` | `Auditor@123` | Read-only compliance inspection, tamper-evident audit logs |

> **Evaluation Shortcut**: The login page (`/login`) includes 1-click quick-login buttons for every role.

---

## 4. Local Quick Start Guide

### Prerequisites
- Python 3.12+
- Node.js 20+ & npm

### Step 1: Backend Startup
```powershell
# Navigate to workspace
cd "d:\Smart Industry 360"

# Run FastAPI backend with Uvicorn (uses .venv)
.\.venv\Scripts\uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*The database (`smart_industry.db`) and seed records are automatically initialized on startup, and the background industrial telemetry simulator starts automatically.*

### Step 2: Frontend Startup
In a separate terminal:
```powershell
cd "d:\Smart Industry 360\frontend"
npm run dev
```
*Open [http://localhost:5173](http://localhost:5173) in your browser.*

---

## 5. System Navigation & Architecture

### Public Website
- `/` — Interactive landing page, value proposition, and architecture preview.
- `/features` — Detailed capability specifications.
- `/architecture` — End-to-end 5-tier architecture & standardized MQTT topic schema.
- `/about` — Mission, methodology, team roster, and regulatory boundaries.
- `/docs` — REST API OpenAPI reference and hardware integration guide.
- `/contact` — Facility coordinates and 24/7 safety hotline.
- `/login` — Secure authentication portal with quick role selectors.

### Frontline Worker Mobile Portal
- `/worker` — Mobile-first interface with 1-tap Emergency SOS distress, safety countdown cancel, hazard reporting, and personal broadcast acknowledgements.

### Control-Room Industrial Command Center (`/app/*`)
1. **Overview Dashboard** (`/app/overview`) — Live KPIs, time series trend charts, recent events.
2. **Live Monitoring** (`/app/monitoring`) — Sensor node grid with engineering limits, signal (dBm), battery, and calibration state.
3. **Factory Digital Twin** (`/app/digital-twin`) — Interactive 2D vector floor plan with zone hazard fills (CLEAR, WARNING, EVACUATE) and click-to-inspect sensor placement.
4. **Emergency Center** (`/app/emergency`) — Documented incident lifecycle (`NEW` → `ACKNOWLEDGED` → `RESPONDING` → `CONTAINED` → `RESOLVED`).
5. **Alerts & Notifications** (`/app/alerts`) — Multi-channel outbox tracking, delivery states, and escalation levels.
6. **Workers & Teams** (`/app/workers`) — On-site roster, check-in status, vital telemetry, and emergency contacts.
7. **Equipment & Machines** (`/app/equipment`) — Rotating machinery inventory, vibration health, and work orders.
8. **Sensors & IoT Devices** (`/app/devices`) — Device registry and remote command execution (`RECALIBRATE`, `SELF_TEST`, `SIREN_ON`, `SIREN_OFF`).
9. **AI Intelligence** (`/app/ai-intelligence`) — Isolation Forest anomaly scoring and interactive sensor fusion test harness.
10. **CCTV & Security** (`/app/cctv`) — RTSP camera stream feeds, AI computer vision flags, and mandatory human review workflow.
11. **Evacuation Management** (`/app/evacuation`) — Egress routes, muster points, route blockage simulation, and drill execution.
12. **Predictive Maintenance** (`/app/maintenance`) — RUL degradation estimations, MTBF, and MTTR metrics.
13. **Reports & Analytics** (`/app/reports`) — Response latency metrics (MTTA/MTTR), compliance summaries, and certified CSV export.
14. **Incident History** (`/app/incident-history`) — Chronological root-cause ledger.
15. **Gateway & Comms Health** (`/app/gateways`) — MQTT broker health, ping latency, packet loss, and offline edge sync.
16. **User & Access Management** (`/app/users`) — RBAC user administration.
17. **Audit Logs** (`/app/audit`) — Append-only tamper-evident audit trail.
18. **System Settings** (`/app/settings`) — Operational thresholds and escalation timer policies.

---

## 6. Interactive Simulator & Edge Testing

The platform includes a built-in **Simulator Drawer** accessible from any dashboard page:
- **Combustible Gas & Smoke Leak**: Injects critical hydrocarbon levels into Zone 2.
- **Thermal Runaway**: Pushes reactor temperatures past critical limits.
- **Vibration Spike**: Triggers severe mechanical imbalance on CNC spindles.
- **Worker SOS**: Simulates emergency distress call.
- **Edge Gateway Drop**: Simulates network severing to demonstrate local autonomous sirens and edge store-and-forward buffering.
- **Gateway Reconnect & Buffer Sync**: Re-establishes connection and synchronizes buffered events without data loss.
- **Reset Baseline**: Restores normal operating conditions across all production zones.

---

## 7. Running Automated Tests

```powershell
cd "d:\Smart Industry 360"
.\.venv\Scripts\pytest -v
```

All 7 test suites validate:
- REST API health check
- JWT authentication and bad credential rejection
- Dashboard summary KPI queries
- Sensor telemetry ingestion and limit evaluation
- Full incident lifecycle state machine transitions
- Scikit-learn AI Isolation Forest anomaly detection and sensor fusion risk index

---

## 8. Safety & Regulatory Compliance Notice

> [!CAUTION]
> **Prototype Instrumentation Notice**: The ESP32 firmware sketch and educational sensor modules (MQ-2, DHT22, SW-420) provided in this repository are designed for engineering demonstration, algorithmic testing, and educational validation. Certified production deployments in hazardous or classified locations (Class I, Div 1/2 or ATEX Zones 0/1/2) must integrate certified intrinsically safe, SIL-rated Safety Instrumented Systems (SIS).
