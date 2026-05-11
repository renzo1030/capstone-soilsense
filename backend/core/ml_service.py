import random
def predict_soil_condition(nitrogen, phosphorus, potassium, ph, moisture):
    if ph < 5.5:
        return "High Acidity", "Apply Agricultural Lime (15 bags/ha) to stabilize pH."
    elif moisture < 40:
        return "Low Moisture", "Increase water supply to reach optimal 50-60% moisture."
    elif nitrogen < 18:
        return "Low Nitrogen", "Apply Urea (46-0-0) to replenish Nitrogen levels."
    else:
        return "Optimal", "Soil is in great condition. Continue current monitoring."
