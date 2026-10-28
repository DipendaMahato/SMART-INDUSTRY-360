"""
firebase_admin.py
Firebase Admin SDK initialization for the Smart Industry 360 FastAPI backend.

Setup:
  1. Download your Firebase service account JSON from:
     Firebase Console → Project Settings → Service Accounts → Generate new private key
  2. Save it somewhere secure, e.g.  backend/serviceAccountKey.json
  3. Set the environment variable:
       GOOGLE_APPLICATION_CREDENTIALS=<absolute path to serviceAccountKey.json>

If GOOGLE_APPLICATION_CREDENTIALS is not set the module will start in
NO-OP mode — all writes are silently skipped and the rest of the API works
normally without Firebase.
"""

import os
import logging

logger = logging.getLogger("smart_industry.firebase")

_firebase_enabled = False
_firebase_db = None

service_account_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

if service_account_path and os.path.isfile(service_account_path):
    try:
        import firebase_admin
        from firebase_admin import credentials, db as rtdb

        if not firebase_admin._apps:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(
                cred,
                {
                    "databaseURL": (
                        "https://smart-industry-90b78-default-rtdb"
                        ".asia-southeast1.firebasedatabase.app"
                    ),
                },
            )
            logger.info("Firebase Admin SDK initialized successfully.")
        else:
            logger.info("Firebase Admin SDK already initialized — reusing existing app.")

        _firebase_db = rtdb.reference("/")
        _firebase_enabled = True

    except Exception as exc:
        logger.warning(
            f"Firebase Admin SDK failed to initialize ({exc}). "
            "Running in NO-OP mode — Firebase writes will be skipped."
        )
else:
    logger.warning(
        "GOOGLE_APPLICATION_CREDENTIALS is not set or file not found. "
        "Firebase integration is DISABLED (NO-OP mode). "
        "Set the env var to enable real-time sync to Firebase Realtime Database."
    )


# ─── Public helpers ──────────────────────────────────────────────────────────

def _safe_serialize(value: dict) -> dict:
    """Convert datetime objects to ISO strings so Firebase can accept them."""
    import datetime
    result = {}
    for k, v in value.items():
        if isinstance(v, datetime.datetime):
            result[k] = v.isoformat()
        elif v is None:
            result[k] = None
        else:
            result[k] = v
    return result


def writeData(path: str, value: dict) -> None:
    """
    Write (set/overwrite) a JSON-serialisable dict to the given Realtime DB path.
    Example: writeData("workers/W-001", {"name": "Alex", "zone_id": 1})
    No-ops silently if Firebase is disabled.
    """
    if not _firebase_enabled or _firebase_db is None:
        return
    try:
        _firebase_db.child(path).set(_safe_serialize(value))
    except Exception as exc:
        logger.error(f"Firebase writeData({path}) failed: {exc}")


def pushData(path: str, value: dict) -> str | None:
    """
    Push a new child under a list path; returns the generated key.
    Example: pushData("incidents", {...})
    Returns None and no-ops silently if Firebase is disabled.
    """
    if not _firebase_enabled or _firebase_db is None:
        return None
    try:
        new_ref = _firebase_db.child(path).push(_safe_serialize(value))
        return new_ref.key
    except Exception as exc:
        logger.error(f"Firebase pushData({path}) failed: {exc}")
        return None


def deleteData(path: str) -> None:
    """
    Delete the node at the given path.
    No-ops silently if Firebase is disabled.
    """
    if not _firebase_enabled or _firebase_db is None:
        return
    try:
        _firebase_db.child(path).delete()
    except Exception as exc:
        logger.error(f"Firebase deleteData({path}) failed: {exc}")
