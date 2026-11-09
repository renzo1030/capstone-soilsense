// Dynamic API Base URL: Uses environment variable in production, falls back to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const MUNICIPALITY = {
    name: 'Unisan',
    province: 'Quezon',
    officeName: 'Unisan Agriculture Office',
};

export const THRESHOLDS = {
    nitrogen: { low: 20 },
    phosphorus: { low: 20 },
    potassium: { low: 30 },
    ph: { low: 5.5, high: 7.5 },
    moisture: { low: 40, optimalRange: '50-60%' },
};
