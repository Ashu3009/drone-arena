# ml-service/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from scipy import stats
import json

app = Flask(__name__)
CORS(app)

def calculate_variance(data):
    """Calculate variance for each axis"""
    if len(data) < 2:
        return {
            'x_variance': 0,
            'y_variance': 0,
            'z_variance': 0,
            'pitch_variance': 0,
            'roll_variance': 0,
            'yaw_variance': 0
        }
    
    x_values = [point['x'] for point in data]
    y_values = [point['y'] for point in data]
    z_values = [point['z'] for point in data]
    pitch_values = [point['pitch'] for point in data]
    roll_values = [point['roll'] for point in data]
    yaw_values = [point['yaw'] for point in data]
    
    return {
        'x_variance': float(np.var(x_values)),
        'y_variance': float(np.var(y_values)),
        'z_variance': float(np.var(z_values)),
        'pitch_variance': float(np.var(pitch_values)),
        'roll_variance': float(np.var(roll_values)),
        'yaw_variance': float(np.var(yaw_values))
    }


def detect_spikes(data, axis, threshold=2.0):
    """Detect sudden spikes in data using z-score"""
    if len(data) < 3:
        return []
    
    values = [point[axis] for point in data]
    z_scores = np.abs(stats.zscore(values))
    
    spike_indices = np.where(z_scores > threshold)[0]
    return spike_indices.tolist()


def detect_oscillations(data, axis):
    """Detect oscillation patterns using frequency analysis"""
    if len(data) < 10:
        return False
    
    values = [point[axis] for point in data]
    
    # Calculate consecutive differences
    diffs = np.diff(values)
    
    # Count sign changes (oscillation indicator)
    sign_changes = np.sum(np.diff(np.sign(diffs)) != 0)
    
    # If more than 40% of points show sign changes, it's oscillating
    oscillation_ratio = sign_changes / len(diffs)
    
    return oscillation_ratio > 0.4

def calculate_smoothness(data, axis):
    """Calculate trajectory smoothness (jerk - rate of change of acceleration)"""
    if len(data) < 4:
        return 100.0
    
    values = [point[axis] for point in data]
    
    # Calculate jerk (third derivative)
    velocity = np.diff(values)
    acceleration = np.diff(velocity)
    jerk = np.diff(acceleration)
    
    # Lower jerk = smoother trajectory
    avg_jerk = np.mean(np.abs(jerk))
    
    # Normalize to 0-100 scale (lower jerk = higher score)
    smoothness_score = max(0, 100 - (avg_jerk * 10))
    
    return float(smoothness_score)

def analyze_drone(drone_data):
    """Analyze single drone's stability"""
    
    logs = drone_data.get('logs', [])
    drone_id = drone_data.get('drone_id', 'unknown')
    
    if len(logs) < 10:
        return {
            'drone_id': drone_id,
            'stability_score': 0,
            'classification': 'Insufficient Data',
            'issues_detected': ['Not enough data points'],
            'variance_data': {},
            'data_points': len(logs)
        }
    
    # Calculate variance
    variance_data = calculate_variance(logs)
    
    # Detect issues
    issues = []
    
    # Check for high variance
    if variance_data['yaw_variance'] > 0.5:
        issues.append('Yaw drift detected')
    
    if variance_data['z_variance'] > 1.0:
        issues.append('Altitude instability')
    
    if variance_data['pitch_variance'] > 0.3:
        issues.append('Pitch oscillation')
    
    if variance_data['roll_variance'] > 0.3:
        issues.append('Roll oscillation')
    
    # Detect spikes 
    x_spikes = detect_spikes(logs, 'x')
    y_spikes = detect_spikes(logs, 'y')
    z_spikes = detect_spikes(logs, 'z')
    
    if len(x_spikes) > 5:
        issues.append('Horizontal position spikes (X-axis)')
    if len(y_spikes) > 5:
        issues.append('Horizontal position spikes (Y-axis)')
    if len(z_spikes) > 5:
        issues.append('Vertical position spikes')
    
    # Detect oscillations
    if detect_oscillations(logs, 'pitch'):
        issues.append('Pitch oscillation pattern detected')
    if detect_oscillations(logs, 'roll'):
        issues.append('Roll oscillation pattern detected')
    if detect_oscillations(logs, 'yaw'):
        issues.append('Yaw oscillation pattern detected')
    
    # Calculate smoothness
    x_smoothness = calculate_smoothness(logs, 'x')
    y_smoothness = calculate_smoothness(logs, 'y')
    z_smoothness = calculate_smoothness(logs, 'z')
    avg_smoothness = (x_smoothness + y_smoothness + z_smoothness) / 3
    
    # Calculate stability score (0-100)
    base_score = 100
    
    # NEW (✅ More lenient):
    variance_penalty = (
        min(variance_data['x_variance'] * 0.5, 15) +      # Max 15 penalty
        min(variance_data['y_variance'] * 0.5, 15) +      # Max 15 penalty
        min(variance_data['z_variance'] * 3, 10) +        # Max 10 penalty
        min(variance_data['pitch_variance'] * 10, 15) +   # Max 15 penalty
        min(variance_data['roll_variance'] * 10, 15) +    # Max 15 penalty
        min(variance_data['yaw_variance'] * 8, 12)        # Max 12 penalty
    )
# Max total penalty = 82 (instead of unlimited)
    
    # Spike penalties
    spike_penalty = (len(x_spikes) + len(y_spikes) + len(z_spikes)) * 0.5
    
    # Oscillation penalty
    oscillation_penalty = len([i for i in issues if 'oscillation' in i.lower()]) * 5
    
    # Calculate final score
    stability_score = base_score - variance_penalty - spike_penalty - oscillation_penalty
    
    # Bonus for smoothness
    stability_score += (avg_smoothness - 50) * 0.2
    
    # Clamp between 0-100
    stability_score = max(0, min(100, stability_score))
    
    # Classification
    if stability_score >= 90:
        classification = 'Excellent'
    elif stability_score >= 70:
        classification = 'Good'
    elif stability_score >= 50:
        classification = 'Moderate'
    else:
        classification = 'Poor'
    
    if not issues:
        issues.append('No major issues detected')
    
    return {
        'drone_id': drone_id,
        'stability_score': round(stability_score, 2),
        'classification': classification,
        'issues_detected': issues,
        'variance_data': variance_data,
        'smoothness_scores': {
            'x': round(x_smoothness, 2),
            'y': round(y_smoothness, 2),
            'z': round(z_smoothness, 2),
            'average': round(avg_smoothness, 2)
        },
        'spike_counts': {
            'x': len(x_spikes),
            'y': len(y_spikes),
            'z': len(z_spikes)
        },
        'data_points': len(logs)
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Drone Stability Analysis ML Service',
        'version': '1.0.0'
    })

@app.route('/analyze-stability', methods=['POST'])
def analyze_stability():
    """Main endpoint to analyze drone stability"""
    try:
        data = request.get_json()
        
        print("📨 Received analysis request")
        print(f"📊 Data keys: {data.keys() if data else 'None'}")
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        match_id = data.get('matchId')
        round_number = data.get('roundNumber')
        telemetry = data.get('telemetry', [])
        
        print(f"📊 Match ID: {match_id}")
        print(f"📊 Round: {round_number}")
        print(f"📊 Telemetry points: {len(telemetry)}")
        
        if not telemetry:
            return jsonify({
                'success': False,
                'message': 'No telemetry data provided',
                'stabilityScore': 0,
                'bonusPoints': 0
            }), 400
        
        # Prepare data for analysis
        drone_data = {
            'drone_id': telemetry[0].get('droneId', 'unknown') if telemetry else 'unknown',
            'logs': telemetry
        }
        
        print(f"🔍 Analyzing {len(telemetry)} data points...")
        
        # Analyze drone
        result = analyze_drone(drone_data)
        
        print(f"✅ Analysis complete!")
        print(f"   - Stability Score: {result['stability_score']}")
        
        # Calculate bonus points based on stability score
        stability_score = result['stability_score']
        
        if stability_score >= 90:
            bonus_points = 15
        elif stability_score >= 80:
            bonus_points = 10
        elif stability_score >= 70:
            bonus_points = 5
        else:
            bonus_points = 0
        
        print(f"   - Bonus Points: {bonus_points}")
        
        response = {
            'success': True,
            'matchId': match_id,
            'roundNumber': round_number,
            'stabilityScore': result['stability_score'],
            'bonusPoints': bonus_points,
            'flightQuality': result['classification'].lower(),
            'details': {
                'issues': result['issues_detected'],
                'variance': result['variance_data'],
                'smoothness': result['smoothness_scores'],
                'spikes': result['spike_counts'],
                'dataPoints': result['data_points']
            }
        }
        return jsonify(response)
        

    except Exception as e:
        print(f"❌ Analysis error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Analysis failed: {str(e)}',
            'stabilityScore': 0,
            'bonusPoints': 0
        }), 500
    
    
@app.route('/batch-analyze', methods=['POST'])
def batch_analyze():
    """Analyze multiple teams at once"""
    try:
        data = request.get_json()
        
        teams_data = data.get('teams', [])
        
        if not teams_data:
            return jsonify({
                'success': False,
                'message': 'No teams data provided'
            }), 400
        
        results = []
        
        for team_data in teams_data:
            drones = team_data.get('drones', [])
            drone_results = []
            total_stability = 0
            
            for drone in drones:
                result = analyze_drone(drone)
                drone_results.append(result)
                total_stability += result['stability_score']
            
            team_avg = total_stability / len(drones) if drones else 0
            
            results.append({
                'team_id': team_data.get('team_id'),
                'drones': drone_results,
                'team_avg_stability': round(team_avg, 2)
            })
        
        return jsonify({
            'success': True,
            'match_id': data.get('match_id'),
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Batch analysis failed: {str(e)}'
        }), 500
        
if __name__ == '__main__':
    print("🤖 ML Stability Analysis Service Starting...")
    print("📊 Ready to analyze drone telemetry!")
    app.run(host='0.0.0.0', port=5001, debug=True)