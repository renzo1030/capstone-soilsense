import urllib.request
import json
import time
import random
API_URL = "http://localhost:8000/api/iot/upload/"
FARM_ID = 1
def generate_sensor_data():
    return {
        "farm_id": FARM_ID,
        "nitrogen": round(random.uniform(10.0, 50.0), 2),
        "phosphorus": round(random.uniform(10.0, 50.0), 2),
        "potassium": round(random.uniform(10.0, 50.0), 2),
        "ph": round(random.uniform(4.5, 8.5), 2),
        "moisture": round(random.uniform(20.0, 80.0), 2)
    }
def send_data(data):
    json_data = json.dumps(data).encode('utf-8')
    headers = {
        'Content-Type': 'application/json',
        'X-Api-Key': 'unisan-soil-sense-2026'
    }
    req = urllib.request.Request(API_URL, data=json_data, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"✅ Success! Sent data: N:{data['nitrogen']} P:{data['phosphorus']} K:{data['potassium']} pH:{data['ph']}")
            print(f"🤖 ML Prediction returned: {result.get('ml_prediction')}")
            print("-" * 50)
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error: {e.code} - {e.read().decode()}")
    except Exception as e:
        print(f"❌ Connection Error: {e}. Is your Django server running?")
if __name__ == "__main__":
    print(f"🚀 Starting IoT Simulator for Farm ID: {FARM_ID}")
    print("Press Ctrl+C to stop.")
    print("-" * 50)
    try:
        while True:
            sensor_data = generate_sensor_data()
            send_data(sensor_data)
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n🛑 Simulator stopped.")
