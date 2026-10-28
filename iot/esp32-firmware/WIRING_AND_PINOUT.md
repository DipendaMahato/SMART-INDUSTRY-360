# ESP32 Edge Sensor Node - Wiring and Pinout Specification

## 1. Overview
This hardware module serves as an industrial prototype edge sensor node for the **Smart Industry 360** platform. It provides real-time environmental telemetry, vibration monitoring, physical emergency SOS input, and local autonomous fail-safe alarm indicators.

> [!CAUTION]
> **Industrial Safety Notice**: The sensors specified below (MQ-2, DHT22, SW-420) are intended for educational prototyping, algorithmic validation, and testing. Production deployments in hazardous industrial zones (Class I, Division 1/2 or ATEX Zones 0/1) require certified intrinsically safe, explosion-proof instrumentation.

---

## 2. Pin Mapping Table

| Component | ESP32 GPIO | Pin Type | Operating Voltage | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **DHT22 / Temp Sensor** | `GPIO 4` | Digital I/O | 3.3V | Connect 10kΩ pull-up resistor between VCC and Data pin |
| **MQ-2 Gas Sensor (A0)** | `GPIO 34` | Analog ADC1 (Input Only) | 5.0V (VCC), 3.3V (ADC) | Use a voltage divider (2kΩ / 1kΩ) to protect 3.3V ADC pin |
| **SW-420 Vibration Sensor** | `GPIO 35` | Digital Input | 3.3V | Digital threshold output from comparator |
| **Physical SOS / E-Stop** | `GPIO 18` | Digital Input (Interrupt) | 3.3V | Normally Open push button tied to GND, software pull-up |
| **Piezo Siren / Buzzer** | `GPIO 19` | Digital Output / PWM | 3.3V / 5.0V | Driven via 2N2222 NPN transistor for high decibel output |
| **Status LED - Green (Normal)** | `GPIO 21` | Digital Output | 3.3V | In series with 220Ω current-limiting resistor |
| **Status LED - Amber (Warning)** | `GPIO 22` | Digital Output | 3.3V | In series with 220Ω current-limiting resistor |
| **Status LED - Red (Critical)** | `GPIO 23` | Digital Output | 3.3V | In series with 220Ω current-limiting resistor |

---

## 3. Voltage Divider Calculation for Analog Gas Sensor (MQ-2)
The MQ-2 sensor analog output operates up to **5.0V**, whereas ESP32 ADC inputs are rated for a maximum of **3.3V** (3.6V absolute maximum).
- **R1 (Top resistor)**: 2.0 kΩ
- **R2 (Bottom resistor to GND)**: 3.3 kΩ
- **V_out to GPIO 34**: `5.0V * (3.3k / (2.0k + 3.3k)) = 3.11V` (Safe for ESP32 ADC).

---

## 4. Autonomous Edge Safety Principle
When either:
1. Gas sensor ADC reading exceeds the critical safety threshold (`> 2400`), or
2. Temperature exceeds `55.0°C`, or
3. The physical emergency SOS button on `GPIO 18` is depressed,

the firmware triggers the local piezo buzzer siren (`GPIO 19`) and red hazard LED (`GPIO 23`) **immediately in microcontroller hardware loops without waiting for Wi-Fi, MQTT, or backend server roundtrip acknowledgement**.
