import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
const MaoDevices = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchFarms = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const response = await fetch('http://localhost:8000/api/mao/farms/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setFarms(data);
                }
            } catch (error) {
                console.error("Error fetching farms:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFarms();
    }, []);
    const formatDate = (isoString) => {
        if (!isoString) return 'No data received yet';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    return (
        <>
            <Sidebar role="mao" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>Hardware & Farm Registry</h1>
                        <p>Track Deployed Sensors (Farm IDs)</p>
                    </div>
                </header>
                <div className="table-container" style={{ marginTop: '30px' }}>
                    <h3 className="section-title">Deployed Hardware Units</h3>
                    {loading ? (
                        <p>Loading farm registry...</p>
                    ) : farms.length === 0 ? (
                        <p>No farms registered yet.</p>
                    ) : (
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Hardware ID (Farm)</th>
                                    <th>Assigned Farmer</th>
                                    <th>Location</th>
                                    <th>Total Area</th>
                                    <th>Status</th>
                                    <th>Last Sync</th>
                                </tr>
                            </thead>
                            <tbody>
                                {farms.map((farm) => (
                                    <tr key={farm.farm_id}>
                                        <td><strong>FARM-{farm.farm_id.toString().padStart(4, '0')}</strong></td>
                                        <td>{farm.farmer_name} <br/><span className="sub-text">ID: {farm.control_id}</span></td>
                                        <td>{farm.location}</td>
                                        <td>{farm.area} sqm</td>
                                        <td>
                                            <span className={`badge ${farm.hardware_status === 'Active' ? 'badge-optimal' : 'badge-warning-alt'}`}>
                                                {farm.hardware_status}
                                            </span>
                                        </td>
                                        <td className="sub-text">{formatDate(farm.latest_reading)}</td>
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
export default MaoDevices;
