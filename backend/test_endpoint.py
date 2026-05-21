from app import app
import json

with app.test_client() as client:
    response = client.get('/api/violations')
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.get_json(), indent=2)}")
