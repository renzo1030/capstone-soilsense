import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, MUNICIPALITY, THRESHOLDS } from '../config';
const MaoDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchDashboard = async () => {
            const token = sessionStorage.getItem('access_token');
            if (!token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/mao/dashboard/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.status === 401) {
                    window.location.href = '/logout';
                    return;
                }
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Error fetching MAO dashboard:", error);
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
                <Sidebar role="mao" />
                <main className="content">
                    <header className="dashboard-header">
                        <div style={{ width: '100%' }}>
                            <div className="skeleton skeleton-title"></div>
                            <div className="skeleton skeleton-text skeleton-text-short"></div>
                        </div>
                    </header>
                    <div className="dashboard-stats">
                        <div className="skeleton skeleton-stat-box"></div>
                        <div className="skeleton skeleton-stat-box"></div>
                        <div className="skeleton skeleton-stat-box"></div>
                    </div>
                    <div className="table-container">
                        <div className="skeleton skeleton-table-row" style={{height: '50px', marginBottom: '20px'}}></div>
                        <div className="skeleton skeleton-table-row"></div>
                        <div className="skeleton skeleton-table-row"></div>
                        <div className="skeleton skeleton-table-row"></div>
                    </div>
                </main>
            </>
        );
    }
    if (!data) return null;
    return (
        <>
            <Sidebar role="mao" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>Municipal Data Center</h1>
                        <p>Live Overview for <strong>{MUNICIPALITY.officeName}</strong></p>
                    </div>
                    <button className="btn-sm btn-header" onClick={() => navigate('/mao/history')}>View Full Logs</button>
                </header>
                <div className="dashboard-stats">
                    <div className="stat-box">
                        <h4>Registered Farmers</h4>
                        <div className="value text-success">{data.stats.total_farmers}</div>
                        <span className="unit">Rice Farmers</span>
                    </div>
                    <div className="stat-box">
                        <h4>Active Sensors</h4>
                        <div className="value text-warning">{data.stats.active_sensors}</div>
                        <span className="unit">Deployed Units</span>
                    </div>
                    <div className="stat-box">
                        <h4>Critical Fields</h4>
                        <div className="value text-danger">{data.stats.critical_fields}</div>
                        <span className="unit">Needs Attention</span>
                    </div>
                </div>
                <div className="table-container">
                    <h3 className="section-title">Live Farmer Status Snapshot</h3>
                    {data.recent_statuses && data.recent_statuses.length > 0 ? (
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Control ID</th>
                                    <th>Farmer Name</th>
                                    <th>Barangay</th>
                                    <th>N-P-K (mg/kg)</th>
                                    <th>pH</th>
                                    <th>Moisture</th>
                                    <th>ML Condition</th>
                                    <th>Recommended Fertilizer</th>
                                    <th>Amount (kg/ha)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recent_statuses.map((status, idx) => (
                                    <tr key={idx}>
                                        <td>{status.control_id}</td>
                                        <td>{status.farmer_name}</td>
                                        <td>{status.barangay}</td>
                                        <td>{status.nitrogen} - {status.phosphorus} - {status.potassium}</td>
                                        <td className={status.ph < THRESHOLDS.ph.low || status.ph > THRESHOLDS.ph.high ? "text-danger fw-600" : "text-success fw-600"}>{status.ph}</td>
                                        <td className={status.moisture < THRESHOLDS.moisture.low ? "text-warning fw-600" : "text-success fw-600"}>{status.moisture}%</td>
                                        <td>
                                            <span className={`badge ${status.condition === 'Optimal' ? 'badge-optimal' : 'badge-warning-alt'}`}>
                                                {status.condition}
                                            </span>
                                        </td>
                                        <td><strong>{status.fertilizer_name || 'N/A'}</strong></td>
                                        <td>{status.recommended_amount_kg != null ? `${status.recommended_amount_kg} kg` : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No sensor data available yet. Ensure farms are registered and devices are active.</p>
                    )}
                </div>
            </main>
        </>
    );
};
export default MaoDashboard;
