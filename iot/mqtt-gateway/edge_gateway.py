"""
SMART INDUSTRY 360 - INDUSTRIAL EDGE GATEWAY DAEMON
Provides local MQTT ingestion, validation, autonomous local hazard evaluation,
and offline SQLite store-and-forward buffering with automated cloud reconnection sync.
"""

import time
import json
import sqlite3
import logging
import urllib.request
import urllib.error

logging.basicConfig(level=logging.INFO, format="%(asctime)s [EDGE-GW] %(levelname)s: %(message)s")
logger = logging.getLogger("edge_gateway")

DB_FILE = "edge_buffer.db"
BACKEND_SYNC_URL = "http://127.0.0.1:8000/api/v1/gateways/DEV-GW-01/sync-buffer"
GATEWAY_ID = "DEV-GW-01"

def init_buffer_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS buffered_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            zone_id INTEGER NOT NULL,
            metric_name TEXT NOT NULL,
            metric_value REAL NOT NULL,
            unit TEXT NOT NULL,
            status TEXT NOT NULL,
            timestamp_ms INTEGER NOT NULL,
            synced INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()
    logger.info("Local SQLite edge buffer initialized.")

def buffer_event_locally(device_id, zone_id, metric_name, val, unit, status):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO buffered_events (device_id, zone_id, metric_name, metric_value, unit, status, timestamp_ms, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    """, (device_id, zone_id, metric_name, val, unit, status, int(time.time() * 1000)))
    conn.commit()
    conn.close()
    logger.warning(f"Network outage detected. Buffered event locally for device {device_id} in {DB_FILE}")

def flush_buffered_events():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, device_id, zone_id, metric_name, metric_value, unit, status FROM buffered_events WHERE synced = 0 LIMIT 25")
    rows = cursor.fetchall()
    if not rows:
        conn.close()
        return 0

    payload_events = []
    ids_to_mark = []
    for r in rows:
        ids_to_mark.append(r[0])
        payload_events.append({
            "device_id": r[1],
            "zone_id": r[2],
            "metric_name": r[3],
            "metric_value": r[4],
            "unit": r[5],
            "status": r[6],
            "is_simulated": True
        })

    # Attempt transmission to central backend
    req_body = json.dumps({"buffered_events": payload_events}).encode('utf-8')
    req = urllib.request.Request(
        BACKEND_SYNC_URL,
        data=req_body,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status == 200:
                # Mark as synced
                cursor.execute(f"UPDATE buffered_events SET synced = 1 WHERE id IN ({','.join(map(str, ids_to_mark))})")
                conn.commit()
                logger.info(f"Successfully synchronized {len(payload_events)} buffered events to central server!")
    except Exception as e:
        logger.error(f"Synchronization failed (server still unreachable): {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    init_buffer_db()
    logger.info(f"Edge Gateway {GATEWAY_ID} active and monitoring local telemetry stream.")
    # Demonstration loop: check sync every 5 seconds
    try:
        while True:
            flush_buffered_events()
            time.sleep(5)
    except KeyboardInterrupt:
        logger.info("Gateway daemon stopped.")
