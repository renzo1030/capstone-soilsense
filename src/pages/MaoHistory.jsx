import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { User } from 'lucide-react';
import { API_BASE_URL, MUNICIPALITY, THRESHOLDS } from '../config';
const MaoHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [farmerList, setFarmerList] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState('');

    useEffect(() => {
        const fetchFarmers = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/mao/list-farmers/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setFarmerList(data);
                }
            } catch (error) {
                console.error("Error fetching farmers:", error);
            }
        };
        fetchFarmers();
    }, []);

    useEffect(() => {
        const fetchLogs = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const url = selectedFarmer 
                    ? `${API_BASE_URL}/mao/logs/?farmer_id=${selectedFarmer}`
                    : `${API_BASE_URL}/mao/logs/`;
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
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
                console.error("Error fetching MAO logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, [selectedFarmer]);
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    const handleDownloadExcel = () => {
        if (!logs.length) return;
        const headers = ['Date & Time', 'Farmer Name', 'Location', 'N (mg/kg)', 'P (mg/kg)', 'K (mg/kg)', 'pH', 'Moisture (%)', 'ML Condition', 'Recommended Fertilizer', 'Amount (kg/ha)'];
        const rows = logs.map(log => [
            formatDate(log.timestamp),
            log.farmer_name,
            log.location,
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
        link.download = `SoilSense_MAO_Records_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    return (
        <>
            <Sidebar role="mao" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>Municipal Soil Records</h1>
                        <p>Consolidated Live Data for <strong>{MUNICIPALITY.name}, {MUNICIPALITY.province}</strong></p>
                    </div>
                    <button className="btn-sm btn-header" onClick={handleDownloadExcel} disabled={logs.length === 0}>⬇ Download CSV</button>
                </header>
                <div className="table-container">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h3 className="section-title m-0">Recent Readings</h3>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 whitespace-nowrap">Filter by Farmer:</label>
                            <div className="relative flex items-center w-full sm:w-auto min-w-[240px]">
                                <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base z-10">
                                    <User size={16} />
                                </span>
                                <select 
                                    className="w-full appearance-none pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium shadow-sm hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150 cursor-pointer" 
                                    value={selectedFarmer}
                                    onChange={(e) => setSelectedFarmer(e.target.value)}
                                >
                                    <option value="" className="text-slate-800 bg-white py-2">All Farmers</option>
                                    {farmerList.map((farmer) => (
                                        <option
                                            key={farmer.farmer_id}
                                            value={farmer.farmer_id}
                                            className="text-slate-800 bg-white py-2.5 px-3 hover:bg-emerald-50"
                                        >
                                            {farmer.firstname} {farmer.lastname} ({farmer.control_id})
                                        </option>
                                    ))}
                                </select>
                                <span className="absolute right-3.5 pointer-events-none text-slate-400 flex items-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Date &amp; Time</th>
                                <th>Farmer / Location</th> 
                                <th>N-P-K (mg/kg)</th>
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
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>Loading records...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>No historical records found.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td data-label="Date & Time">{formatDate(log.timestamp)}</td>
                                        <td data-label="Farmer / Location">
                                            <strong>{log.farmer_name}</strong><br/>
                                            <span className="sub-text">{log.location}</span>
                                        </td>
                                        <td data-label="N-P-K (mg/kg)">{log.nitrogen} - {log.phosphorus} - {log.potassium}</td>
                                        <td data-label="pH" className={log.ph < THRESHOLDS.ph.low || log.ph > THRESHOLDS.ph.high ? "text-danger fw-600" : "text-success fw-600"}>{log.ph}</td>
                                        <td data-label="Moisture" className={log.moisture < THRESHOLDS.moisture.low ? "text-warning fw-600" : "text-success fw-600"}>{log.moisture}%</td>
                                        <td data-label="ML Condition">
                                            <span className={`badge ${log.condition === 'Optimal' ? 'badge-optimal' : 'badge-warning-alt'}`}>
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
export default MaoHistory;
