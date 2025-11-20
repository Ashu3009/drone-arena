#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FAST MULTI-DRONE SIMULATOR - 50ms updates (20 Hz)
Runs 8 drones (R1-R4, B1-B4) with smooth real-time telemetry
"""

import requests
import time
import random
import threading

# ==================== CONFIGURATION ====================
BACKEND_URL = "http://localhost:5000/api/telemetry"
MATCH_ID = "690f2d8cb9070cec601d059d"
TEAM_A_ID = "690b445223fe5f7ff3108dcf"  # Red team
TEAM_B_ID = "690b442323fe5f7ff3108dc0"  # Blue team

# Drone starting positions
DRONES = [
    {"id": "R1", "team": TEAM_A_ID, "x": 1.5, "y": 0.8, "z": 2.0},
    {"id": "R2", "team": TEAM_A_ID, "x": 1.5, "y": 2.2, "z": 2.0},
    {"id": "R3", "team": TEAM_A_ID, "x": 2.5, "y": 0.8, "z": 2.5},
    {"id": "R4", "team": TEAM_A_ID, "x": 2.5, "y": 2.2, "z": 2.5},
    {"id": "B1", "team": TEAM_B_ID, "x": 4.6, "y": 0.8, "z": 2.0},
    {"id": "B2", "team": TEAM_B_ID, "x": 4.6, "y": 2.2, "z": 2.0},
    {"id": "B3", "team": TEAM_B_ID, "x": 3.6, "y": 0.8, "z": 2.5},
    {"id": "B4", "team": TEAM_B_ID, "x": 3.6, "y": 2.2, "z": 2.5},
]

running = True
update_counts = {d["id"]: 0 for d in DRONES}

def simulate_drone(drone_config):
    """Simulate a single drone with fast updates"""
    drone_id = drone_config["id"]
    team_id = drone_config["team"]
    
    state = {
        "x": drone_config["x"],
        "y": drone_config["y"],
        "z": drone_config["z"],
        "pitch": 0.0,
        "roll": 0.0,
        "yaw": 0.0,
        "battery": 100
    }
    
    while running:
        # Faster movement
        state["x"] += random.uniform(-0.1, 0.1)
        state["y"] += random.uniform(-0.1, 0.1)
        state["z"] += random.uniform(-0.06, 0.06)
        
        # Keep within bounds
        state["x"] = max(0, min(6.1, state["x"]))
        state["y"] = max(0, min(3.05, state["y"]))
        state["z"] = max(0.5, min(5, state["z"]))
        
        # Orientation changes
        state["pitch"] += random.uniform(-0.05, 0.05)
        state["roll"] += random.uniform(-0.05, 0.05)
        state["yaw"] += random.uniform(-0.1, 0.1)
        
        # Battery drain
        state["battery"] = max(0, state["battery"] - 0.001)
        
        # Send telemetry
        telemetry = {
            "droneId": drone_id,
            "matchId": MATCH_ID,
            "teamId": team_id,
            "x": round(state["x"], 2),
            "y": round(state["y"], 2),
            "z": round(state["z"], 2),
            "pitch": round(state["pitch"], 2),
            "roll": round(state["roll"], 2),
            "yaw": round(state["yaw"], 2),
            "battery": round(state["battery"], 1)
        }
        
        try:
            response = requests.post(BACKEND_URL, json=telemetry, timeout=1)
            update_counts[drone_id] += 1
            
            # Print every 20th update per drone
            if update_counts[drone_id] % 20 == 0:
                if response.status_code == 200:
                    print(f"📡 {drone_id}: X={telemetry['x']}, Y={telemetry['y']}, Z={telemetry['z']} [{update_counts[drone_id]}]")
        except:
            pass  # Silently ignore errors for smoother operation
        
        time.sleep(0.05)  # 50ms = 20 Hz

def main():
    global running
    
    print("=" * 70)
    print("🚁 FAST MULTI-DRONE SIMULATOR")
    print("=" * 70)
    print(f"Match ID: {MATCH_ID}")
    print(f"Backend: {BACKEND_URL}")
    print(f"Drones: {len(DRONES)} (Red: R1-R4, Blue: B1-B4)")
    print(f"Update Rate: 20 Hz (50ms per drone)")
    print(f"Total Updates/sec: {len(DRONES) * 20} Hz")
    print("=" * 70)
    print("\n🚀 Starting all drones...\n")
    
    # Create threads for each drone
    threads = []
    for drone in DRONES:
        thread = threading.Thread(target=simulate_drone, args=(drone,), daemon=True)
        thread.start()
        threads.append(thread)
        time.sleep(0.01)  # Stagger starts
    
    print("✅ All drones active! Press Ctrl+C to stop\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping all drones...")
        running = False
        time.sleep(1)
        
        total_updates = sum(update_counts.values())
        print(f"\n📊 Statistics:")
        for drone_id, count in update_counts.items():
            print(f"   {drone_id}: {count} updates")
        print(f"   Total: {total_updates} updates")
        print("\n👋 Goodbye!")

if __name__ == "__main__":
    main()