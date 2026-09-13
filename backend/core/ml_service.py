
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

def classify_ph_level(ph):
    """
    Classifies pH into a human-readable label for the dashboard.
    Based on standard agricultural soil pH ranges for rice cultivation.
    """
    ph = float(ph)
    if ph < 4.5:
        return "Highly Acidic"
    elif ph < 5.5:
        return "Acidic"
    elif ph < 6.0:
        return "Slightly Acidic"
    elif ph <= 7.0:
        return "Optimal"
    elif ph <= 7.5:
        return "Slightly Alkaline"
    elif ph <= 8.5:
        return "Alkaline"
    else:
        return "Highly Alkaline"


def predict_soil_condition(nitrogen, phosphorus, potassium, ph, moisture):
    """
    Predicts soil condition, action plan, and recommended fertilizer details using the ML model.
    Returns:
        tuple: (condition, action_plan, fertilizer_name, nutrient_type, recommended_amount_kg)
    """
    ph_label = classify_ph_level(ph)

    try:
        model = load_model()
        
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
            condition = details['condition']
            action_plan = details['action_plan']
            fert_name = details['fertilizer_name']
            nutrient = details['nutrient_type']
            amount = details['recommended_amount_kg']
            
            if float(moisture) <= 10.0:
                condition = f"{condition} & Critically Dry"
                action_plan = f"Soil moisture is dangerously low ({moisture}%). Irrigate immediately before applying fertilizer! " + action_plan

            
            if nutrient == "Nitrogen" and float(ph) > 7.5:
                fert_name = "Ammonium Sulfate (21-0-0)"
                action_plan = (
                    f"Apply {fert_name} to replenish Nitrogen. "
                    f"[SYSTEM OVERRIDE]: Soil is highly alkaline (pH {ph}). Urea recommendation canceled to prevent ammonia gas loss and root toxicity."
                )
                
            elif float(ph) < 5.0:
                original_fert = fert_name
                fert_name = f"Agricultural Lime + {original_fert}"
                action_plan = (
                    f"IMMEDIATE ACTION: Apply Agricultural Lime to neutralize extreme acidity (pH {ph}). "
                    f"Wait 2 weeks, then apply {original_fert}."
                )
                condition = f"Critical Acidity & {condition}"

            if float(moisture) >= 90:
                action_plan += " WARNING: Field is completely waterlogged. Ensure proper drainage immediately to prevent root rot."

            # Append pH level label to condition for the dashboard
            condition = f"{condition} | pH: {ph_label}"

            return (
                condition,
                action_plan,
                fert_name,
                nutrient,
                amount
            )
    except Exception as e:
        print(f"ML Prediction failed, using fallback rule-based system: {e}")
        
    if float(ph) < 5.5:
        return (f"High Acidity | pH: {ph_label}", "Apply Agricultural Lime (15 bags/ha) to stabilize pH.", "Agricultural Lime", "pH Balancer", 15.0)
    elif float(moisture) < 40.0:
        return (f"Low Moisture | pH: {ph_label}", "Increase water supply to reach optimal 50-60% moisture.", "Urea (46-0-0)", "Nitrogen", 10.0)
    elif float(nitrogen) < 18.0:
        return (f"Low Nitrogen | pH: {ph_label}", "Apply Urea (46-0-0) to replenish Nitrogen levels.", "Urea (46-0-0)", "Nitrogen", 15.0)
    else:
        return (f"Optimal | pH: {ph_label}", "Soil is in great condition. Continue current monitoring.", "Urea (46-0-0)", "Nitrogen", 5.0)


