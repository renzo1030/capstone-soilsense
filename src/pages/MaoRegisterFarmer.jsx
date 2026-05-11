import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { UserPlus, MapPin, Phone, User, Hash, Lock, Tractor } from 'lucide-react';
const MaoRegisterFarmer = () => {
    const [formData, setFormData] = useState({
        control_id: '',
        password: '',
        firstname: '',
        lastname: '',
        contact_number: '',
        barangay: '',
        farm_location: '',
        farm_area_sqm: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch('http://localhost:8000/api/mao/register-farmer/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            let data;
            try {
                data = await response.json();
            } catch (err) {
                setStatus({ type: 'error', message: '❌ Server error. Could not parse response.' });
                return;
            }
            if (response.ok) {
                setStatus({ type: 'success', message: `✅ Success! New farmer registered. Farm ID generated: ${data.farm_id}` });
                setFormData({
                    control_id: '', password: '', firstname: '', lastname: '',
                    contact_number: '', barangay: '', farm_location: '', farm_area_sqm: ''
                });
            } else {
                setStatus({ type: 'error', message: `❌ Error: ${data.error || 'Failed to register farmer.'}` });
            }
        } catch (error) {
            setStatus({ type: 'error', message: '❌ Connection error. Is the Django server running?' });
        } finally {
            setLoading(false);
        }
    };
    return (
        <>
            <Sidebar role="mao" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>Register New Farmer</h1>
                        <p>Create a new farmer account and farm profile simultaneously.</p>
                    </div>
                </header>
                <div className="glass-card-form">
                    {status.message && (
                        <div className={`status-badge ${status.type === 'success' ? 'badge-optimal' : 'badge-warning-alt'}`} style={{ marginBottom: '30px', padding: '16px', display: 'block', borderRadius: '12px' }}>
                            {status.message}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="form-grid">
                        {}
                        <div className="form-section">
                            <div className="section-badge">
                                <span className="section-badge-icon"><Lock size={18} color="var(--primary)" /></span>
                                Account Credentials
                            </div>
                            <div className="form-group">
                                <label>Control ID (Username)</label>
                                <div className="input-icon-wrapper">
                                    <Hash className="input-icon" size={20} />
                                    <input type="text" name="control_id" value={formData.control_id} onChange={handleChange} required placeholder="e.g., FARMER002" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Temporary Password</label>
                                <div className="input-icon-wrapper">
                                    <UserPlus className="input-icon" size={20} />
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Secure Password" />
                                </div>
                            </div>
                        </div>
                        {}
                        <div className="form-section">
                            <div className="section-badge">
                                <span className="section-badge-icon"><User size={18} color="var(--primary)" /></span>
                                Personal Details
                            </div>
                            <div className="form-group">
                                <label>First Name</label>
                                <div className="input-icon-wrapper">
                                    <User className="input-icon" size={20} />
                                    <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} required placeholder="Juan" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <div className="input-icon-wrapper">
                                    <User className="input-icon" size={20} />
                                    <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} required placeholder="Dela Cruz" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Contact Number</label>
                                <div className="input-icon-wrapper">
                                    <Phone className="input-icon" size={20} />
                                    <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} required placeholder="09xxxxxxxxx" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Barangay</label>
                                <div className="input-icon-wrapper">
                                    <MapPin className="input-icon" size={20} />
                                    <input type="text" name="barangay" value={formData.barangay} onChange={handleChange} required placeholder="San Jose" />
                                </div>
                            </div>
                        </div>
                        {}
                        <div className="form-section" style={{ gridColumn: '1 / -1' }}>
                            <div className="section-badge">
                                <span className="section-badge-icon"><Tractor size={18} color="var(--primary)" /></span>
                                Farm Profile
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Farm Location</label>
                                    <div className="input-icon-wrapper">
                                        <MapPin className="input-icon" size={20} />
                                        <input type="text" name="farm_location" value={formData.farm_location} onChange={handleChange} required placeholder="e.g., Brgy. San Jose Lot A" />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Total Area (Square Meters)</label>
                                    <div className="input-icon-wrapper">
                                        <MapPin className="input-icon" size={20} />
                                        <input type="number" name="farm_area_sqm" value={formData.farm_area_sqm} onChange={handleChange} required placeholder="e.g., 10000" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {}
                        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                            <button type="submit" className={`btn-submit ${loading ? 'btn-submit-loading' : ''}`} disabled={loading}>
                                {loading ? 'Registering...' : 'Register Farmer & Farm'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
};
export default MaoRegisterFarmer;
