#!/usr/bin/env python3
"""
ESP32 Multi-Drone Simulator
Simulates 16 drones (R1-R8 for Red team, B1-B8 for Blue team)
Sends telemetry to backend server at 200ms intervals
Only sends data for drones registered in the current active round
"""

import paho.mqtt.client as mqtt
import json
import time
import random
import math
import requests
import sys

# Configuration
MQTT_BROKER = "192.168.0.64"  # Change to your MQTT broker IP
MQTT_PORT = 1883
SERVER_URL = "http://192.168.0.64:5000"  # Change to your backend server URL

# Drone IDs
RED_DRONES = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"]
BLUE_DRONES = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"]
ALL_DRONES = RED_DRONES + BLUE_DRONES

# Simulation parameters
ARENA_SIZE = 50  # meters (50x50 arena)
TELEMETRY_INTERVAL = 0.2  # 200ms
MAX_SPEED = 5.0  # m/s
BATTERY_DRAIN_RATE = 0.05  # % per second


class DroneSimulator:
    """Simulates a single drone's behavior"""

    def __init__(self, drone_id):
        self.drone_id = drone_id
        self.x = random.uniform(0, ARENA_SIZE)
        self.y = random.uniform(0, ARENA_SIZE)
        self.z = random.uniform(1, 5)
        self.battery = 100.0
        self.active = False
        self.match_id = None
        self.round_number = None

        # Movement parameters
        self.velocity_x = 0
        self.velocity_y = 0
        self.target_x = self.x
        self.target_y = self.y

    def set_active(self, match_id, round_number):
        """Mark drone as active for a specific match/round"""
        self.active = True
        self.match_id = match_id
        self.round_number = round_number
        self.battery = 100.0
        print(f"[{self.drone_id}] Activated for Match {match_id}, Round {round_number}")

    def set_inactive(self):
        """Deactivate drone"""
        self.active = False
        self.match_id = None
        self.round_number = None
        print(f"[{self.drone_id}] Deactivated")

    def update_position(self, dt):
        """Update drone position based on movement pattern"""
        if not self.active:
            return

        # Check if reached target, set new random target
        dist_to_target = math.sqrt((self.target_x - self.x)**2 + (self.target_y - self.y)**2)
        if dist_to_target < 1.0:
            self.target_x = random.uniform(5, ARENA_SIZE - 5)
            self.target_y = random.uniform(5, ARENA_SIZE - 5)

        # Move towards target
        if dist_to_target > 0:
            direction_x = (self.target_x - self.x) / dist_to_target
            direction_y = (self.target_y - self.y) / dist_to_target

            speed = random.uniform(2, MAX_SPEED)
            self.velocity_x = direction_x * speed
            self.velocity_y = direction_y * speed

            self.x += self.velocity_x * dt
            self.y += self.velocity_y * dt

            # Keep within arena bounds
            self.x = max(0, min(ARENA_SIZE, self.x))
            self.y = max(0, min(ARENA_SIZE, self.y))

        # Vary altitude slightly
        self.z += random.uniform(-0.2, 0.2) * dt
        self.z = max(1, min(10, self.z))

        # Drain battery
        self.battery -= BATTERY_DRAIN_RATE * dt
        self.battery = max(0, self.battery)

    def get_telemetry(self):
        """Get current telemetry data"""
        if not self.active:
            return None

        return {
            "droneId": self.drone_id,
            "matchId": self.match_id,
            "roundNumber": self.round_number,
            "timestamp": int(time.time() * 1000),
            "x": round(self.x, 2),
            "y": round(self.y, 2),
            "z": round(self.z, 2),
            "battery": round(self.battery, 1),
            "speed": round(math.sqrt(self.velocity_x**2 + self.velocity_y**2), 2),
            "status": "active" if self.battery > 0 else "low_battery"
        }


class MultiDroneSimulator:
    """Manages all 16 drones"""

    def __init__(self):
        self.drones = {drone_id: DroneSimulator(drone_id) for drone_id in ALL_DRONES}
        self.mqtt_client = None
        self.running = False
        self.current_match_id = None
        self.current_round_number = None

    def on_mqtt_connect(self, client, userdata, flags, rc):
        """MQTT connection callback"""
        if rc == 0:
            print(f"✅ Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
            # Subscribe to config topics for all drones
            for drone_id in ALL_DRONES:
                topic = f"drone/{drone_id}/config"
                client.subscribe(topic)
                print(f"   Subscribed to {topic}")
        else:
            print(f"❌ Failed to connect to MQTT broker, rc={rc}")

    def on_mqtt_message(self, client, userdata, msg):
        """Handle incoming MQTT messages (START/STOP commands)"""
        try:
            topic = msg.topic
            drone_id = topic.split('/')[1]
            payload = json.loads(msg.payload.decode())

            command = payload.get('command')

            if command == 'START':
                match_id = payload.get('matchId')
                round_number = payload.get('roundNumber')
                self.drones[drone_id].set_active(match_id, round_number)
                self.current_match_id = match_id
                self.current_round_number = round_number

            elif command == 'STOP':
                self.drones[drone_id].set_inactive()

        except Exception as e:
            print(f"❌ Error handling MQTT message: {e}")

    def connect_mqtt(self):
        """Connect to MQTT broker"""
        self.mqtt_client = mqtt.Client(client_id=f"MultiDroneSimulator_{int(time.time())}")
        self.mqtt_client.on_connect = self.on_mqtt_connect
        self.mqtt_client.on_message = self.on_mqtt_message

        try:
            self.mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
            self.mqtt_client.loop_start()
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MQTT broker: {e}")
            return False

    def send_telemetry(self, drone_id):
        """Send telemetry for a single drone"""
        drone = self.drones[drone_id]
        telemetry = drone.get_telemetry()

        if telemetry and self.mqtt_client:
            try:
                # Send via MQTT
                topic = f"drone/{drone_id}/telemetry"
                self.mqtt_client.publish(topic, json.dumps(telemetry))

                # Also send to HTTP endpoint
                requests.post(
                    f"{SERVER_URL}/api/telemetry",
                    json=telemetry,
                    timeout=1
                )

            except Exception as e:
                print(f"⚠️  [{drone_id}] Error sending telemetry: {e}")

    def run(self):
        """Main simulation loop"""
        print("\n" + "="*60)
        print("ESP32 Multi-Drone Simulator Started")
        print("="*60)
        print(f"Simulating 16 drones: {', '.join(ALL_DRONES)}")
        print(f"MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
        print(f"Server URL: {SERVER_URL}")
        print(f"Telemetry Interval: {TELEMETRY_INTERVAL * 1000}ms")
        print("="*60 + "\n")

        if not self.connect_mqtt():
            print("❌ Failed to connect to MQTT. Exiting.")
            return

        self.running = True
        last_time = time.time()

        print("✅ Waiting for START commands from server...")
        print("   (Drones will only send telemetry when registered in an active round)\n")

        try:
            while self.running:
                current_time = time.time()
                dt = current_time - last_time

                if dt >= TELEMETRY_INTERVAL:
                    # Update all active drones
                    active_count = 0
                    for drone_id in ALL_DRONES:
                        drone = self.drones[drone_id]
                        if drone.active:
                            drone.update_position(dt)
                            self.send_telemetry(drone_id)
                            active_count += 1

                    if active_count > 0:
                        print(f"📡 Sent telemetry for {active_count} active drone(s) " +
                              f"(Match: {self.current_match_id}, Round: {self.current_round_number})")

                    last_time = current_time

                time.sleep(0.01)  # Small sleep to prevent CPU overuse

        except KeyboardInterrupt:
            print("\n\n⏹️  Stopping simulator...")
        finally:
            self.cleanup()

    def cleanup(self):
        """Clean up resources"""
        self.running = False
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
        print("✅ Simulator stopped\n")


def main():
    """Entry point"""
    print("\n" + "="*60)
    print("ESP32 Multi-Drone Simulator Configuration")
    print("="*60)

    # Allow command-line arguments for MQTT broker and server
    global MQTT_BROKER, SERVER_URL

    if len(sys.argv) > 1:
        MQTT_BROKER = sys.argv[1]
    if len(sys.argv) > 2:
        SERVER_URL = sys.argv[2]

    print(f"MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Server URL: {SERVER_URL}")
    print("\nTo change these, run:")
    print(f"  python {sys.argv[0]} <MQTT_BROKER_IP> <SERVER_URL>")
    print("="*60 + "\n")

    simulator = MultiDroneSimulator()
    simulator.run()


if __name__ == "__main__":
    main()
