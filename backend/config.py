import os

class Settings:
    PROJECT_NAME: str = "Smart Industry 360"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smart-industry-360-enterprise-sec-token-998877665544")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smart_industry.db")
    MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST", "localhost")
    MQTT_BROKER_PORT: int = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    MQTT_USERNAME: str = os.getenv("MQTT_USERNAME", "industrial_edge_01")
    MQTT_PASSWORD: str = os.getenv("MQTT_PASSWORD", "edge_sec_key_2026")
    SIMULATION_ENABLED: bool = os.getenv("SIMULATION_ENABLED", "true").lower() == "true"
    ALERT_ESCALATION_TIMEOUT_SECONDS: int = int(os.getenv("ALERT_ESCALATION_TIMEOUT_SECONDS", "45"))
    TELEMETRY_INTERVAL_SECONDS: float = float(os.getenv("TELEMETRY_INTERVAL_SECONDS", "3.0"))
    AI_ANOMALY_THRESHOLD: float = float(os.getenv("AI_ANOMALY_THRESHOLD", "0.65"))

settings = Settings()
