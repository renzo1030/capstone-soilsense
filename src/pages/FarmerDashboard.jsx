import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
const FarmerDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchDashboard = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const response = await fetch('http://localhost:8000/api/farmer/dashboard/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Error fetching dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 5000);
        return () => clearInterval(interval);
    }, []);
    if (loading) {
        return (
            <>
                <Sidebar role="farmer" />
                <main className="content">
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <h2>Loading Farm Data...</h2>
                    </div>
                </main>
            </>
        );
    }
    if (!data) return null;
    const r = data.latest_reading;
    return (
        <>
            <Sidebar role="farmer" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>{data.farm_location}</h1>
                        <p>Welcome back, <strong>{data.farmer_name}</strong> (#{data.control_id})</p>
                        <p className="crop-indicator">🌾 Current Crop: Rice</p>
                    </div>
                    <div className="badge">Live Monitoring</div>
                </header>
                {r ? (
                    <>
                        <div className="dashboard-stats">
                            <div className="stat-box">
                                <h4>Nitrogen (N)</h4>
                                <div className={`value ${r.nitrogen < 20 ? 'text-danger' : 'text-success'}`}>{r.nitrogen}</div>
                                <span className="unit">mg/kg</span>
                            </div>
                            <div className="stat-box">
                                <h4>Phosphorus (P)</h4>
                                <div className={`value ${r.phosphorus < 20 ? 'text-danger' : 'text-success'}`}>{r.phosphorus}</div>
                                <span className="unit">mg/kg</span>
                            </div>
                            <div className="stat-box">
                                <h4>Potassium (K)</h4>
                                <div className={`value ${r.potassium < 30 ? 'text-danger' : 'text-success'}`}>{r.potassium}</div>
                                <span className="unit">mg/kg</span>
                            </div>
                            <div className="stat-box">
                                <h4>Soil pH</h4>
                                <div className={`value ${r.ph < 5.5 || r.ph > 7.5 ? 'text-danger' : 'text-success'}`}>{r.ph}</div>
                                <span className="unit">{r.ph < 5.5 ? 'Acidic' : (r.ph > 7.5 ? 'Alkaline' : 'Optimal')}</span>
                            </div>
                            <div className="stat-box">
                                <h4>Moisture</h4>
                                <div className={`value ${r.moisture < 40 ? 'text-warning' : 'text-success'}`}>{r.moisture}</div>
                                <span className="unit">{r.moisture < 40 ? '% (Low)' : '%'}</span>
                            </div>
                        </div>
                        <div className="table-container mb-40">
                            <h3 className="section-title">Condition Status</h3>
                            <div className={`status-badge ${r.condition === 'Optimal' ? 'badge-optimal' : 'badge-warning-alt'}`} style={{ padding: '15px', borderRadius: '8px', fontSize: '1.1rem' }}>
                                AI Soil Classification: <strong>{r.condition}</strong>
                            </div>
                        </div>
                        <div className="rec-card">
                            <span className="badge">Random Forest Model</span>
                            <div className="rec-header">
                                <h3>🌾 Action Plan</h3>
                            </div>
                            <p>Based on your latest reading ({new Date(r.recorded_at).toLocaleString()}):</p>
                            <div className="action-list">
                                <ul>
                                    {r.condition === 'Optimal' && <li>Keep up the good work! Your soil is perfectly balanced.</li>}
                                    {r.ph < 5.5 && <li>Apply <strong>Agricultural Lime</strong> (15 bags/ha) to stabilize pH.</li>}
                                    {r.nitrogen < 20 && <li>Apply <strong>Urea (46-0-0)</strong> to replenish Nitrogen levels.</li>}
                                    {r.moisture < 40 && <li><strong>Irrigation Alert:</strong> Increase water supply to reach optimal 50-60% moisture.</li>}
                                    {r.condition !== 'Optimal' && r.ph >= 5.5 && r.nitrogen >= 20 && r.moisture >= 40 && <li>Monitor your field closely as conditions may be changing.</li>}
                                </ul>
                            </div>
                            <button className="btn-submit btn-submit-auto">Download Report</button>
                        </div>
                    </>
                ) : (
                    <div className="table-container">
                        <p>No sensor readings available yet for your farm. Waiting for IoT device to connect...</p>
                    </div>
                )}
            </main>
        </>
    );
};
export default FarmerDashboard;
