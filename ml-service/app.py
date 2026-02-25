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
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

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

if __name__ == '__main__':
    load_model()
    print("Diabetes ML Service starting on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=True)
