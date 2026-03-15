import requests
import json

BASE_URL = "http://localhost:8000"

def test_regions():
    regions = ["limburgs", "mestreechs", "zittesj", "venloos", "kirchroeadsj"]
    
    for r in regions:
        print(f"\nTesting region: {r}")
        # Test correction endpoint (as it's easy to check the internal logic via error/mock if needed, 
        # but here we just check if it accepts the parameter)
        payload = {
            "text": "hallo",
            "language": "li",
            "region": r,
            "mode": "local",
            "quality": "light"
        }
        try:
            # We don't necessarily need Ollama running to check if the backend parses the region
            # but it helps to see the logs.
            resp = requests.post(f"{BASE_URL}/correct", json=payload, timeout=5)
            print(f"  Status: {resp.status_code}")
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    test_regions()
