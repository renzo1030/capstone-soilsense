"""
Standalone script to re-serialize upgraded_rice_model.pkl using the current scikit-learn environment.
Resolves InconsistentVersionWarning caused by training vs. production sklearn version differences.
Usage:
    python reserialize_model.py
"""
import os
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'upgraded_rice_model.pkl')

def reserialize():
    print(f"Loading model from: {MODEL_PATH}")
    model = joblib.load(MODEL_PATH)
    print(f"Model type: {type(model).__name__}")
    if hasattr(model, 'n_estimators'):
        print(f"Random Forest trees: {model.n_estimators}")
    joblib.dump(model, MODEL_PATH)
    print(f"SUCCESS: Model re-serialized with current scikit-learn environment.")

if __name__ == '__main__':
    reserialize()

