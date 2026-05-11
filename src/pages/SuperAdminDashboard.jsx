import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { UserPlus, Hash, Lock, User, Briefcase } from 'lucide-react';
const SuperAdminDashboard = () => {
    const [formData, setFormData] = useState({
        control_id: '',
        password: '',
        firstname: '',
        lastname: '',
        position: 'Head Agriculturist'
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
            const response = await fetch('http://localhost:8000/api/superadmin/register-mao/', {
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
                setLoading(false);
                return;
            }
            if (response.ok) {
                setStatus({ type: 'success', message: '✅ Success! New MAO Administrator registered.' });
                setFormData({
                    control_id: '', password: '', firstname: '', lastname: '', position: 'Head Agriculturist'
                });
            } else {
                setStatus({ type: 'error', message: `❌ Error: ${data.error || 'Failed to register MAO.'}` });
            }
        } catch (error) {
            setStatus({ type: 'error', message: '❌ Connection error. Is the Django server running?' });
        } finally {
            setLoading(false);
        }
    };
    return (
        <>
            <Sidebar role="superadmin" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>Super Admin Control</h1>
                        <p>System Configuration & Personnel Management</p>
                    </div>
                </header>
                <div className="glass-card-form" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {status.message && (
                        <div className={`status-badge ${status.type === 'success' ? 'badge-optimal' : 'badge-warning-alt'}`} style={{ marginBottom: '30px', padding: '16px', display: 'block', borderRadius: '12px' }}>
                            {status.message}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="form-section" style={{ gridColumn: '1 / -1' }}>
                            <div className="section-badge">
                                <span className="section-badge-icon"><UserPlus size={18} color="var(--primary)" /></span>
                                Register New MAO Administrator
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Control ID (Username)</label>
                                    <div className="input-icon-wrapper">
                                        <Hash className="input-icon" size={20} />
                                        <input type="text" name="control_id" value={formData.control_id} onChange={handleChange} required placeholder="e.g., MAO002" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Secure Password</label>
                                    <div className="input-icon-wrapper">
                                        <Lock className="input-icon" size={20} />
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
                                <div className="form-group">
                                    <label>First Name</label>
                                    <div className="input-icon-wrapper">
                                        <User className="input-icon" size={20} />
                                        <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} required placeholder="Maria" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <div className="input-icon-wrapper">
                                        <User className="input-icon" size={20} />
                                        <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} required placeholder="Santos" />
                                    </div>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '10px' }}>
                                <label>Position / Title</label>
                                <div className="input-icon-wrapper">
                                    <Briefcase className="input-icon" size={20} />
                                    <input type="text" name="position" value={formData.position} onChange={handleChange} required placeholder="e.g. Head Agriculturist" />
                                </div>
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                            <button type="submit" className={`btn-submit ${loading ? 'btn-submit-loading' : ''}`} disabled={loading}>
                                {loading ? 'Registering...' : 'Create MAO Account'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
};
export default SuperAdminDashboard;
