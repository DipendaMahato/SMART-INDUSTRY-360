import datetime
import logging
from sqlalchemy.orm import Session
from backend.models import Notification, Incident, User, AuditLog, utcnow
from backend.websocket_manager import ws_manager

logger = logging.getLogger("smart_industry.notifications")

class NotificationEngine:
    async def dispatch_incident_alerts(self, db: Session, incident: Incident) -> list[Notification]:
        """
        Dispatches multi-channel alerts for a new or escalated incident.
        """
        created_alerts = []
        alert_level = "CRITICAL" if incident.severity == "CRITICAL" else ("WARNING" if incident.severity == "HIGH" else "INFO")

        # Channels and recipients based on incident severity
        targets = [
            ("DASHBOARD", "CONTROL_ROOM", "Main Industrial Command Console"),
            ("IN_APP", "SAFETY_OFFICERS", "Safety Officer Fleet Dispatch"),
        ]
        if incident.severity in ["HIGH", "CRITICAL"]:
            targets.append(("SMS", "EMERGENCY_COORDINATORS", "Automated SMS Gateway Relay"))
            targets.append(("BROWSER", "ALL_WORKERS", "Plant-wide Evacuation & Safety Broadcast"))

        for channel, recipient_group, title_suffix in targets:
            # Title: clean — no severity prefix embedded (alert_level field handles severity)
            notif = Notification(
                incident_id=incident.id,
                alert_level=alert_level,
                channel=channel,
                recipient_group=recipient_group,
                title=f"{incident.title} — {title_suffix}",
                message=f"Incident #{incident.incident_number} in Zone {incident.zone_id}: {incident.description}",
                delivery_status="DELIVERED",
                escalation_level=1,
                retry_count=0,
                last_attempt_at=utcnow(),
                created_at=utcnow()
            )
            db.add(notif)
            created_alerts.append(notif)

        db.commit()
        for notif in created_alerts:
            db.refresh(notif)
            await ws_manager.broadcast("ALERT_DISPATCHED", {
                "id": notif.id,
                "incident_id": notif.incident_id,
                "alert_level": notif.alert_level,
                "channel": notif.channel,
                "recipient_group": notif.recipient_group,
                "title": notif.title,
                "message": notif.message,
                "delivery_status": notif.delivery_status,
                "escalation_level": notif.escalation_level,
                "created_at": str(notif.created_at)
            })

        logger.info(f"Dispatched {len(created_alerts)} notifications for Incident #{incident.incident_number}")
        return created_alerts

    async def acknowledge_alert(self, db: Session, notification_id: int, user: User, notes: str = None) -> Notification:
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notif:
            return None

        notif.delivery_status = "ACKNOWLEDGED"
        notif.acknowledged_at = utcnow()

        audit = AuditLog(
            user_id=user.id,
            username=user.username,
            action="ACKNOWLEDGE_ALERT",
            entity_type="NOTIFICATION",
            entity_id=str(notif.id),
            details=f"Alert acknowledged by {user.full_name} ({user.role}). Notes: {notes or 'None'}",
            timestamp=utcnow()
        )
        db.add(audit)
        db.commit()
        db.refresh(notif)

        await ws_manager.broadcast("ALERT_ACKNOWLEDGED", {
            "notification_id": notif.id,
            "incident_id": notif.incident_id,
            "acknowledged_by": user.username,
            "acknowledged_at": str(notif.acknowledged_at),
            "status": "ACKNOWLEDGED"
        })
        return notif

    async def check_and_escalate_unacknowledged(self, db: Session, timeout_seconds: int = 45):
        """
        Escalation policy: If a CRITICAL/WARNING alert remains unacknowledged past timeout,
        escalate from Level 1 → Level 2 → Level 3.
        Title is rebuilt cleanly each time — no repeated prefix accumulation.
        """
        cutoff = utcnow() - datetime.timedelta(seconds=timeout_seconds)
        unacked = db.query(Notification).filter(
            Notification.delivery_status.in_(["SENT", "DELIVERED"]),
            Notification.alert_level.in_(["CRITICAL", "WARNING"]),
            Notification.created_at <= cutoff,
            Notification.escalation_level < 3
        ).all()

        for notif in unacked:
            notif.escalation_level += 1
            notif.retry_count += 1
            notif.last_attempt_at = utcnow()

            # Strip any prior escalation prefix(es) cleanly before adding current tier
            clean_title = notif.title
            while clean_title.startswith("[ESCALATED"):
                clean_title = clean_title.split("] ", 1)[-1]
            notif.title = f"[ESCALATED L{notif.escalation_level}] {clean_title}"

            audit = AuditLog(
                user_id=None,
                username="SYSTEM_ESCALATION_ENGINE",
                action="ESCALATE_ALERT",
                entity_type="NOTIFICATION",
                entity_id=str(notif.id),
                details=f"Alert #{notif.id} unacknowledged after {timeout_seconds}s. Escalated to Tier {notif.escalation_level}",
                timestamp=utcnow()
            )
            db.add(audit)
            db.commit()

            await ws_manager.broadcast("ALERT_ESCALATED", {
                "notification_id": notif.id,
                "incident_id": notif.incident_id,
                "new_escalation_level": notif.escalation_level,
                "title": notif.title
            })
            logger.warning(f"Notification #{notif.id} escalated to Level {notif.escalation_level}")

notification_engine = NotificationEngine()
