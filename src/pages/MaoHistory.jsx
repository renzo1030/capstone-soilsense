import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
const MaoHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchLogs = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const response = await fetch('http://localhost:8000/api/mao/logs/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setLogs(data);
                }
            } catch (error) {
                console.error("Error fetching MAO logs:", error);
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
            <Sidebar role="mao" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>Municipal Soil Records</h1>
                        <p>Consolidated Live Data for <strong>Unisan, Quezon</strong></p>
                    </div>
                    <button className="btn-sm btn-header">Download Excel</button>
                </header>
                <div className="table-container">
                    <h3 className="section-title">Recent Readings (All Barangays)</h3>
                    {loading ? (
                        <p>Loading records...</p>
                    ) : logs.length === 0 ? (
                        <p>No historical records found.</p>
                    ) : (
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Farmer / Location</th> 
                                    <th>N-P-K (mg/kg)</th>
                                    <th>pH</th>
                                    <th>Moisture</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{formatDate(log.timestamp)}</td>
                                        <td>
                                            <strong>{log.farmer_name}</strong><br/>
                                            <span className="sub-text">{log.location}</span>
                                        </td>
                                        <td>{log.nitrogen} - {log.phosphorus} - {log.potassium}</td>
                                        <td className={log.ph < 5.5 || log.ph > 7.5 ? "text-danger fw-600" : "text-success fw-600"}>{log.ph}</td>
                                        <td className={log.moisture < 40 ? "text-warning fw-600" : "text-success fw-600"}>{log.moisture}%</td>
                                        <td>
                                            <span className={`badge ${log.condition === 'Optimal' ? 'badge-optimal' : 'badge-warning-alt'}`}>
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
export default MaoHistory;
