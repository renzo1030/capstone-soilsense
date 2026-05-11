import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
const FarmerHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchLogs = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const response = await fetch('http://localhost:8000/api/farmer/logs/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
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
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    return (
        <>
            <Sidebar role="farmer" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>Brgy. Central Field</h1>
                        <p>Live IoT Sensor Data for <strong>Farmer #FARMER001</strong></p>
                    </div>
                    <button className="btn-sm btn-header">Download Log</button>
                </header>
                <div className="table-container">
                    {loading ? (
                        <p>Loading sensor data...</p>
                    ) : logs.length === 0 ? (
                        <p>No sensor readings available yet. Run the simulate_iot.py script!</p>
                    ) : (
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>N (mg/kg)</th>
                                    <th>P (mg/kg)</th>
                                    <th>K (mg/kg)</th>
                                    <th>pH</th>
                                    <th>Moisture</th>
                                    <th>Status (ML)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{formatDate(log.timestamp)}</td>
                                        <td>{log.nitrogen}</td>
                                        <td>{log.phosphorus}</td>
                                        <td>{log.potassium}</td>
                                        <td className={log.ph < 5.5 ? "text-danger fw-600" : "text-success fw-600"}>{log.ph}</td>
                                        <td className={log.moisture < 40 ? "text-warning fw-600" : "text-success fw-600"}>{log.moisture}%</td>
                                        <td>
                                            <span className={log.condition === 'Optimal' ? "badge badge-optimal" : "badge badge-warning-alt"}>
                                                {log.condition}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </>
    );
};
export default FarmerHistory;
