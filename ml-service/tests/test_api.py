import pytest
import json
import sys
from pathlib import Path

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import app

@pytest.fixture
def client():
    """Create test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Test /health endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'

def test_predict_breakfast_valid(client):
    """Test breakfast prediction with valid meal"""
    response = client.post('/predict-breakfast',
                          json={'meal': 'Scrambled eggs with spinach and toast'},
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert data['success'] == True
    assert 'predictions' in data
    assert data['predictions']['calories'] > 0
    assert data['predictions']['protein'] > 0
    assert data['predictions']['carbs'] >= 0
    assert data['predictions']['fat'] >= 0

def test_predict_lunch_valid(client):
    """Test lunch prediction"""
    response = client.post('/predict-lunch',
                          json={'meal': 'Grilled chicken salad with vinaigrette'},
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True
    assert data['predictions']['calories'] > 300  # Lunch typically higher cal

def test_predict_missing_meal(client):
    """Test error handling for missing meal parameter"""
    response = client.post('/predict-breakfast',
                          json={},
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['success'] == False
    assert 'error' in data

def test_all_endpoints_exist(client):
    """Test that all 5 meal type endpoints exist"""
    endpoints = [
        '/predict-breakfast',
        '/predict-lunch',
        '/predict-dinner',
        '/predict-snacks',
        '/predict-desserts'
    ]
    
    for endpoint in endpoints:
        response = client.post(endpoint,
                              json={'meal': 'Test meal'},
                              content_type='application/json')
        # Should not be 404
        assert response.status_code != 404, f"Endpoint {endpoint} not found"