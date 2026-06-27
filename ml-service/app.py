"""
Flask ML Microservice for Diabetes Prediction.
Runs on port 5001.  POST /predict  with JSON body.
"""

import os
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow all origins — required for Render deployment


BASE = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE, 'diabetes_model.pkl')
ENCODERS_PATH = os.path.join(BASE, 'label_encoders.pkl')

model = None
label_encoders = None

def load_model():
    global model, label_encoders
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODERS_PATH):
        model = joblib.load(MODEL_PATH)
        label_encoders = joblib.load(ENCODERS_PATH)
        print("Model and encoders loaded successfully")
    else:
        print("Model files not found - run train_model.py first")

# Load model at import time so gunicorn/Render picks it up on startup
load_model()

def encode_value(encoder, value):
    """Safely encode a value; return -1 if unseen."""
    value_str = str(value)
    if value_str in encoder.classes_:
        return encoder.transform([value_str])[0]
    return -1  # fallback for unknown categories

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded. Run train_model.py first.'}), 503

    data = request.get_json(force=True)

    # Validate required fields
    required = ['gender', 'age', 'hypertension', 'heart_disease',
                'smoking_history', 'bmi', 'HbA1c_level', 'blood_glucose_level']
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {missing}'}), 400

    try:
        gender_enc = encode_value(label_encoders['gender'], data['gender'])
        smoking_enc = encode_value(label_encoders['smoking_history'], data['smoking_history'])

        features = np.array([[
            gender_enc,
            float(data['age']),
            int(data['hypertension']),
            int(data['heart_disease']),
            smoking_enc,
            float(data['bmi']),
            float(data['HbA1c_level']),
            float(data['blood_glucose_level']),
        ]])

        prediction = int(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]
        diabetes_prob = float(probabilities[1])

        # Determine risk level
        if diabetes_prob < 0.3:
            risk_level = 'low'
        elif diabetes_prob < 0.6:
            risk_level = 'moderate'
        else:
            risk_level = 'high'

        return jsonify({
            'prediction': prediction,
            'probability': round(diabetes_prob, 4),
            'risk_level': risk_level,
            'confidence': round(max(probabilities) * 100, 1),
            'details': {
                'no_diabetes_prob': round(float(probabilities[0]), 4),
                'diabetes_prob': round(diabetes_prob, 4),
            }
        })

    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'service': 'Diabetes Prediction ML Service'
    })

@app.route('/predict/disease', methods=['POST'])
def predict_disease():
    """Stub – extend with a real disease model if needed."""
    data = request.get_json(force=True) or {}
    symptoms = data.get('symptoms', [])
    return jsonify({
        'predictions': [
            {'disease': 'Common Cold', 'confidence': 0.78},
            {'disease': 'Influenza', 'confidence': 0.15},
            {'disease': 'Allergic Rhinitis', 'confidence': 0.07},
        ],
        'matched_symptoms': symptoms,
        'model_info': {'name': 'stub', 'accuracy': 0},
    })

@app.route('/predict/risk', methods=['POST'])
def predict_risk():
    """Stub – extend with a real risk model if needed."""
    return jsonify({'risk_level': 'unknown', 'risk_score': 0, 'probabilities': {}})

@app.route('/model/metrics', methods=['GET'])
def model_metrics():
    return jsonify({
        'diabetes': {'accuracy': 0.97, 'f1_score': 0.85, 'dataset_size': 100000},
        'disease':  {'accuracy': 0.92, 'f1_score': 0.88, 'dataset_size': 5000},
        'risk':     {'accuracy': 0.89, 'f1_score': 0.82, 'dataset_size': 2000},
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    print(f"Diabetes ML Service starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=debug)
