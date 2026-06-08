
import os
import joblib
import pandas as pd
from django.conf import settings

_model = None

def load_model():
    global _model
    if _model is None:
        model_path = os.path.join(settings.BASE_DIR.parent, 'upgraded_rice_model.pkl')
        if not os.path.exists(model_path):
            model_path = os.path.join(settings.BASE_DIR, 'upgraded_rice_model.pkl')
        _model = joblib.load(model_path)
    return _model

# Detailed mapping for the model's 7 output fertilizer classes:
# 'Compost', 'DAP', 'MOP', 'NPK', 'SSP', 'Urea', 'Zinc Sulphate'
FERTILIZER_DETAILS = {
    'Urea': {
        'condition': 'Low Nitrogen',
        'action_plan': 'Apply Urea (46-0-0) to replenish Nitrogen levels.',
        'fertilizer_name': 'Urea (46-0-0)',
        'nutrient_type': 'Nitrogen',
        'recommended_amount_kg': 15.0
    },
    'DAP': {
        'condition': 'Low Nitrogen & Phosphorus',
        'action_plan': 'Apply Diammonium Phosphate (DAP) to address Nitrogen and Phosphorus deficiency.',
        'fertilizer_name': 'DAP (18-46-0)',
        'nutrient_type': 'Nitrogen & Phosphorus',
        'recommended_amount_kg': 12.0
    },
    'MOP': {
        'condition': 'Low Potassium',
        'action_plan': 'Apply Muriate of Potash (MOP) to replenish Potassium levels.',
        'fertilizer_name': 'MOP (0-0-60)',
        'nutrient_type': 'Potassium',
        'recommended_amount_kg': 10.0
    },
    'NPK': {
        'condition': 'Nutrient Deficient',
        'action_plan': 'Apply NPK Compound Fertilizer for balanced nutrient replenishment.',
        'fertilizer_name': 'NPK (14-14-14)',
        'nutrient_type': 'Nitrogen, Phosphorus & Potassium',
        'recommended_amount_kg': 15.0
    },
    'SSP': {
        'condition': 'Low Phosphorus',
        'action_plan': 'Apply Single Superphosphate (SSP) to replenish Phosphorus levels.',
        'fertilizer_name': 'SSP (0-18-0)',
        'nutrient_type': 'Phosphorus',
        'recommended_amount_kg': 12.0
    },
    'Compost': {
        'condition': 'Low Organic Matter',
        'action_plan': 'Apply organic Compost to improve soil structure and organic matter content.',
        'fertilizer_name': 'Compost',
        'nutrient_type': 'Organic Matter',
        'recommended_amount_kg': 20.0
    },
    'Zinc Sulphate': {
        'condition': 'Zinc Deficient',
        'action_plan': 'Apply Zinc Sulphate to address zinc deficiency and improve grain yield.',
        'fertilizer_name': 'Zinc Sulphate',
        'nutrient_type': 'Micronutrients',
        'recommended_amount_kg': 5.0
    }
}

def predict_soil_condition(nitrogen, phosphorus, potassium, ph, moisture):
    """
    Predicts soil condition, action plan, and recommended fertilizer details using the ML model.
    Returns:
        tuple: (condition, action_plan, fertilizer_name, nutrient_type, recommended_amount_kg)
    """
    try:
        model = load_model()
        
        # Features: ['Nitrogen_Level', 'Phosphorus_Level', 'Potassium_Level', 'Soil_pH', 'Soil_Moisture']
        df = pd.DataFrame([{
            'Nitrogen_Level': float(nitrogen),
            'Phosphorus_Level': float(phosphorus),
            'Potassium_Level': float(potassium),
            'Soil_pH': float(ph),
            'Soil_Moisture': float(moisture)
        }])
        
        predicted_fert = model.predict(df)[0]
        details = FERTILIZER_DETAILS.get(predicted_fert)
        
        if details:
            return (
                details['condition'],
                details['action_plan'],
                details['fertilizer_name'],
                details['nutrient_type'],
                details['recommended_amount_kg']
            )
    except Exception as e:
        # Fallback to rule-based logic in case model fails to load/predict
        print(f"ML Prediction failed, using fallback rule-based system: {e}")
        
    # Heuristic Fallback
    if float(ph) < 5.5:
        return ("High Acidity", "Apply Agricultural Lime (15 bags/ha) to stabilize pH.", "Agricultural Lime", "pH Balancer", 15.0)
    elif float(moisture) < 40.0:
        return ("Low Moisture", "Increase water supply to reach optimal 50-60% moisture.", "Urea (46-0-0)", "Nitrogen", 10.0)
    elif float(nitrogen) < 18.0:
        return ("Low Nitrogen", "Apply Urea (46-0-0) to replenish Nitrogen levels.", "Urea (46-0-0)", "Nitrogen", 15.0)
    else:
        return ("Optimal", "Soil is in great condition. Continue current monitoring.", "Urea (46-0-0)", "Nitrogen", 5.0)

