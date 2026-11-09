import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { API_BASE_URL, THRESHOLDS } from '../config';
const FarmerHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [farmerInfo, setFarmerInfo] = useState(null);
    useEffect(() => {
        const fetchFarmerInfo = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/farmer/dashboard/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.status === 401) {
                    window.location.href = '/logout';
                    return;
                }
                if (response.ok) {
                    const data = await response.json();
                    setFarmerInfo(data);
                }
            } catch (error) {
                console.error("Error fetching farmer info:", error);
            }
        };
        const fetchLogs = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/farmer/logs/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.status === 401) {
                    window.location.href = '/logout';
                    return;
                }
                if (response.ok) {
                    const data = await response.json();
                    setLogs(data);
                }
            } catch (error) {
                console.error("Error fetching logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFarmerInfo();
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    const handleDownloadLog = () => {
        if (!logs.length) return;
        const headers = ['Date & Time', 'N (mg/kg)', 'P (mg/kg)', 'K (mg/kg)', 'pH', 'Moisture (%)', 'ML Condition', 'Recommended Fertilizer', 'Amount (kg/ha)'];
        const rows = logs.map(log => [
            formatDate(log.timestamp),
            log.nitrogen,
            log.phosphorus,
            log.potassium,
            log.ph,
            log.moisture,
            log.condition,
            log.fertilizer_name || 'N/A',
            log.recommended_amount_kg != null ? log.recommended_amount_kg : 'N/A'
        ]);
        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const name = farmerInfo ? farmerInfo.control_id : 'farmer';
        link.download = `SoilSense_Log_${name}_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    return (
        <>
            <Sidebar role="farmer" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>{farmerInfo ? farmerInfo.farm_location : 'Loading...'}</h1>
                        <p>Live IoT Sensor Data for <strong>{farmerInfo ? `${farmerInfo.farmer_name} (#${farmerInfo.control_id})` : 'Loading...'}</strong></p>
                    </div>
                    <button className="btn-sm btn-header" onClick={handleDownloadLog} disabled={logs.length === 0}>⬇ Download CSV</button>
                </header>
                <div className="table-container">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>N (mg/kg)</th>
                                <th>P (mg/kg)</th>
                                <th>K (mg/kg)</th>
                                <th>pH</th>
                                <th>Moisture</th>
                                <th>ML Condition</th>
                                <th>Recommended Fertilizer</th>
                                <th>Amount (kg/ha)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>Loading sensor data...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>No sensor readings available yet.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td data-label="Date & Time">{formatDate(log.timestamp)}</td>
                                        <td data-label="Nitrogen (N)">{log.nitrogen} mg/kg</td>
                                        <td data-label="Phosphorus (P)">{log.phosphorus} mg/kg</td>
                                        <td data-label="Potassium (K)">{log.potassium} mg/kg</td>
                                        <td data-label="Soil pH" className={log.ph < THRESHOLDS.ph.low ? "text-danger fw-600" : "text-success fw-600"}>{log.ph}</td>
                                        <td data-label="Moisture" className={log.moisture < THRESHOLDS.moisture.low ? "text-warning fw-600" : "text-success fw-600"}>{log.moisture}%</td>
                                        <td data-label="ML Condition">
                                            <span className={log.condition === 'Optimal' ? "badge badge-optimal" : "badge badge-warning-alt"}>
                                                {log.condition}
                                            </span>
                                        </td>
                                        <td data-label="Recommended"><strong>{log.fertilizer_name || 'N/A'}</strong></td>
                                        <td data-label="Amount">{log.recommended_amount_kg != null ? `${log.recommended_amount_kg} kg` : 'N/A'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </>
    );
};
export default FarmerHistory;
