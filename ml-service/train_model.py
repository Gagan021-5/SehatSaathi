"""
Train a RandomForest model on the diabetes prediction dataset.
Usage:  python train_model.py
Outputs: diabetes_model.pkl, label_encoders.pkl
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib

# ── Paths ──────────────────────────────────────────────
CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'server', 'diabetes_dataset.csv')
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'diabetes_model.pkl')
ENCODERS_PATH = os.path.join(os.path.dirname(__file__), 'label_encoders.pkl')

def main():
    print("📂 Loading dataset...")
    df = pd.read_csv(CSV_PATH)
    print(f"   Rows: {len(df):,}  |  Columns: {list(df.columns)}")

    # ── Encode categorical features ────────────────────
    label_encoders = {}

    for col in ['gender', 'smoking_history']:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le
        print(f"   Encoded '{col}': {list(le.classes_)}")

    # ── Features / Target ──────────────────────────────
    feature_cols = ['gender', 'age', 'hypertension', 'heart_disease',
                    'smoking_history', 'bmi', 'HbA1c_level', 'blood_glucose_level']
    X = df[feature_cols].values
    y = df['diabetes'].values

    print(f"\n📊 Class distribution: 0={np.sum(y==0):,}  1={np.sum(y==1):,}")

    # ── Train / Test split ─────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Train model ────────────────────────────────────
    print("\n🏋️  Training RandomForest (200 trees)...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'
    )
    model.fit(X_train, y_train)

    # ── Evaluate ───────────────────────────────────────
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n✅ Accuracy: {acc:.4f}  ({acc*100:.1f}%)")
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['No Diabetes', 'Diabetes']))

    # ── Feature importance ─────────────────────────────
    importances = model.feature_importances_
    print("📈 Feature Importances:")
    for name, imp in sorted(zip(feature_cols, importances), key=lambda x: -x[1]):
        print(f"   {name:25s}  {imp:.4f}")

    # ── Save ───────────────────────────────────────────
    joblib.dump(model, MODEL_PATH)
    joblib.dump(label_encoders, ENCODERS_PATH)
    print(f"\n💾 Saved model   → {MODEL_PATH}")
    print(f"💾 Saved encoders → {ENCODERS_PATH}")

if __name__ == '__main__':
    main()
