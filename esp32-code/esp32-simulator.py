"""
ESP32 DevKit V1 Simulator
Simulates ESP32 behavior for testing Drone Arena backend
"""

import requests
import json
import time
import random
import math
from datetime import datetime

# ========================================
# Configuration
# ========================================
SERVER_URL = "http://localhost:5000"  # Change to your backend URL
# For deployed backend, use: "https://dronearena-backend.onrender.com"

# Simulated ESP32 MAC Address (Change this to test different devices)
MAC_ADDRESS = "AA:BB:CC:DD:EE:09"

# ========================================
# Simulation Settings
# ========================================
TELEMETRY_INTERVAL = 0.05  # Send telemetry every 50ms (20 Hz)
HEARTBEAT_INTERVAL = 10    # Send heartbeat every 10 seconds
SIMULATION_MODE = "moving"  # "static", "moving", "spinning"

# ========================================
# Global State
# ========================================
drone_id = None
drone_role = None
is_registered = False
simulation_time = 0

# ========================================
# Color Codes for Terminal
# ========================================
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header():
    print("\n" + "=" * 60)
    print(f"{Colors.CYAN}{Colors.BOLD}ESP32 DevKit V1 Simulator - Drone Arena{Colors.ENDC}")
    print("=" * 60)

def print_info(emoji, message):
    print(f"{Colors.CYAN}[INFO] {message}{Colors.ENDC}")

def print_success(emoji, message):
    print(f"{Colors.GREEN}[SUCCESS] {message}{Colors.ENDC}")

def print_warning(emoji, message):
    print(f"{Colors.YELLOW}[WARNING] {message}{Colors.ENDC}")

def print_error(emoji, message):
    print(f"{Colors.RED}[ERROR] {message}{Colors.ENDC}")

# ========================================
# Announce to Backend
# ========================================
def announce_to_backend():
    global drone_id, drone_role, is_registered

    try:
        url = f"{SERVER_URL}/api/esp/announce?mac={MAC_ADDRESS}"
        print_info("📢", "Announcing to backend...")
        print_info("🌐", f"URL: {url}")

        response = requests.get(url, timeout=5)
        data = response.json()

        print_info("📥", f"Response: {json.dumps(data, indent=2)}")

        if data.get("success") and data.get("registered"):
            drone_id = data["data"]["droneId"]
            drone_role = data["data"]["role"]
            is_registered = True

            print_success("✅", "Registration Successful!")
            print_success("🆔", f"Drone ID: {drone_id}")
            print_success("⚡", f"Role: {drone_role}")
        else:
            print_warning("⚠️", "ESP not registered yet!")
            print_warning("👉", "Please register this MAC via Admin Panel")
            print_warning("📋", f"MAC Address: {MAC_ADDRESS}")
            is_registered = False

    except requests.exceptions.ConnectionError:
        print_error("❌", "Cannot connect to backend!")
        print_error("🔧", "Make sure backend server is running")
        print_error("🌐", f"Server URL: {SERVER_URL}")
    except Exception as e:
        print_error("❌", f"Announcement failed: {str(e)}")

# ========================================
# Send Heartbeat
# ========================================
def send_heartbeat():
    try:
        url = f"{SERVER_URL}/api/esp/heartbeat"
        payload = {
            "mac": MAC_ADDRESS,
            "ipAddress": "192.168.1.100"  # Simulated IP
        }

        response = requests.post(url, json=payload, timeout=5)

        if response.status_code == 200:
            print_success("💓", "Heartbeat sent")
        else:
            print_error("❌", f"Heartbeat failed: {response.status_code}")

    except Exception as e:
        print_error("❌", f"Heartbeat error: {str(e)}")

# ========================================
# Generate Simulated Sensor Data
# ========================================
def generate_sensor_data(mode="static"):
    global simulation_time
    simulation_time += TELEMETRY_INTERVAL

    if mode == "static":
        # Stationary drone with slight noise
        x = 0.0 + random.uniform(-0.1, 0.1)
        y = 0.0 + random.uniform(-0.1, 0.1)
        z = 9.81 + random.uniform(-0.2, 0.2)  # Gravity
        pitch = 0.0 + random.uniform(-2, 2)
        roll = 0.0 + random.uniform(-2, 2)
        yaw = 0.0 + random.uniform(-0.1, 0.1)

    elif mode == "moving":
        # Moving drone in circular pattern
        radius = 2.0
        angular_velocity = 0.5  # rad/s
        angle = angular_velocity * simulation_time

        x = radius * math.cos(angle) + random.uniform(-0.2, 0.2)
        y = radius * math.sin(angle) + random.uniform(-0.2, 0.2)
        z = 9.81 + math.sin(simulation_time * 0.3) + random.uniform(-0.3, 0.3)

        pitch = math.sin(simulation_time * 0.5) * 10 + random.uniform(-3, 3)
        roll = math.cos(simulation_time * 0.5) * 10 + random.uniform(-3, 3)
        yaw = angular_velocity + random.uniform(-0.2, 0.2)

    elif mode == "spinning":
        # Spinning/tumbling drone (crash scenario)
        x = random.uniform(-5, 5)
        y = random.uniform(-5, 5)
        z = 9.81 + random.uniform(-3, 3)
        pitch = random.uniform(-180, 180)
        roll = random.uniform(-180, 180)
        yaw = random.uniform(-10, 10)

    return {
        "x": round(x, 2),
        "y": round(y, 2),
        "z": round(z, 2),
        "pitch": round(pitch, 2),
        "roll": round(roll, 2),
        "yaw": round(yaw, 2)
    }

# ========================================
# Send Telemetry Data
# ========================================
telemetry_counter = 0

def send_telemetry():
    global telemetry_counter

    if not is_registered:
        return

    try:
        url = f"{SERVER_URL}/api/telemetry"

        sensor_data = generate_sensor_data(SIMULATION_MODE)

        payload = {
            "macAddress": MAC_ADDRESS,
            "droneId": drone_id,
            "sensorData": sensor_data
        }

        response = requests.post(url, json=payload, timeout=5)

        if response.status_code == 200:
            # Print telemetry every 10th transmission to avoid spam
            if telemetry_counter % 10 == 0:
                print("\n" + Colors.CYAN + "📊 Telemetry Data:" + Colors.ENDC)
                print(f"   X: {sensor_data['x']:6.2f} | Y: {sensor_data['y']:6.2f} | Z: {sensor_data['z']:6.2f}")
                print(f"   Pitch: {sensor_data['pitch']:6.2f}° | Roll: {sensor_data['roll']:6.2f}° | Yaw: {sensor_data['yaw']:6.2f}°/s")
            telemetry_counter += 1
        else:
            print_error("❌", f"Telemetry failed: {response.status_code}")

    except Exception as e:
        if telemetry_counter % 20 == 0:  # Print error less frequently
            print_error("❌", f"Telemetry error: {str(e)}")

# ========================================
# Main Simulation Loop
# ========================================
def main():
    print_header()
    print_info("📡", f"MAC Address: {MAC_ADDRESS}")
    print_info("🌐", f"Server: {SERVER_URL}")
    print_info("🎮", f"Simulation Mode: {SIMULATION_MODE}")
    print("=" * 60 + "\n")

    # Initial announcement
    announce_to_backend()

    if not is_registered:
        print("\n" + "=" * 60)
        print_warning("⏸️", "Waiting for registration...")
        print_warning("📋", "Register this ESP in Admin Panel:")
        print(f"{Colors.YELLOW}   MAC Address: {MAC_ADDRESS}{Colors.ENDC}")
        print(f"{Colors.YELLOW}   Drone ID: R1 (or any R1-R8, B1-B8){Colors.ENDC}")
        print(f"{Colors.YELLOW}   Role: Forward/Striker/Defender/Keeper{Colors.ENDC}")
        print(f"{Colors.YELLOW}   Device Type: ESP32-Dev{Colors.ENDC}")
        print_warning("🔄", "Will retry announcement every 5 seconds...")
        print("=" * 60 + "\n")

    last_heartbeat_time = time.time()
    last_announce_retry = time.time()

    print_success("✅", "Starting simulation loop...\n")

    try:
        while True:
            current_time = time.time()

            # Retry announcement if not registered
            if not is_registered and (current_time - last_announce_retry) >= 5:
                announce_to_backend()
                last_announce_retry = current_time

            # Send heartbeat
            if (current_time - last_heartbeat_time) >= HEARTBEAT_INTERVAL:
                send_heartbeat()
                last_heartbeat_time = current_time

            # Send telemetry
            send_telemetry()

            # Wait for next telemetry interval
            time.sleep(TELEMETRY_INTERVAL)

    except KeyboardInterrupt:
        print("\n\n" + "=" * 60)
        print_warning("", "Simulation stopped by user")
        print("=" * 60 + "\n")

# ========================================
# Configuration Menu
# ========================================
def show_menu():
    print_header()
    print("\nConfiguration:")
    print(f"   1. MAC Address: {Colors.YELLOW}{MAC_ADDRESS}{Colors.ENDC}")
    print(f"   2. Server URL: {Colors.YELLOW}{SERVER_URL}{Colors.ENDC}")
    print(f"   3. Simulation Mode: {Colors.YELLOW}{SIMULATION_MODE}{Colors.ENDC}")
    print("\n" + "=" * 60)
    print(f"{Colors.GREEN}Press ENTER to start simulation...{Colors.ENDC}")
    print(f"{Colors.YELLOW}Or edit MAC_ADDRESS/SERVER_URL in the script{Colors.ENDC}")
    print("=" * 60 + "\n")

    input()

# ========================================
# Entry Point
# ========================================
if __name__ == "__main__":
    print("\n")
    print(Colors.CYAN + Colors.BOLD)
    print("=" * 60)
    print("     ESP32 SIMULATOR - DRONE ARENA TELEMETRY SYSTEM")
    print("=" * 60)
    print(Colors.ENDC)

    show_menu()
    main()
