import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { UserPlus, Hash, Lock, User, Briefcase, Trash2, RefreshCw } from 'lucide-react';

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

    // MAO list state
    const [maoList, setMaoList] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, id: null, name: '' });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchMaoList = useCallback(async () => {
        setListLoading(true);
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch('http://localhost:8000/api/superadmin/list-mao/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMaoList(data);
            }
        } catch (err) {
            console.error('Error fetching MAO list:', err);
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMaoList();
    }, [fetchMaoList]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'control_id' ? value.toUpperCase() : value }));
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
                setFormData({ control_id: '', password: '', firstname: '', lastname: '', position: 'Head Agriculturist' });
                fetchMaoList(); // Refresh the list
            } else {
                setStatus({ type: 'error', message: `❌ Error: ${data.error || 'Failed to register MAO.'}` });
            }
        } catch (error) {
            setStatus({ type: 'error', message: '❌ Connection error. Is the Django server running?' });
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (mao) => {
        setModal({ open: true, id: mao.id, name: `${mao.firstname} ${mao.lastname} (${mao.control_id})` });
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`http://localhost:8000/api/superadmin/delete-mao/${modal.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMaoList(prev => prev.filter(m => m.id !== modal.id));
                setModal({ open: false, id: null, name: '' });
            }
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <>
            <ConfirmModal
                isOpen={modal.open}
                title="Delete MAO Account"
                message={`Are you sure you want to permanently delete the account for ${modal.name}? This action cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={() => setModal({ open: false, id: null, name: '' })}
                loading={deleteLoading}
            />
            <Sidebar role="superadmin" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>Super Admin Control</h1>
                        <p>System Configuration &amp; Personnel Management</p>
                    </div>
                </header>

                {/* Register MAO Form */}
                <div className="glass-card-form" style={{ maxWidth: '800px', margin: '0 auto 40px' }}>
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

                {/* MAO Accounts List */}
                <div className="table-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 className="section-title" style={{ margin: 0 }}>Registered MAO Administrators</h3>
                        <button
                            onClick={fetchMaoList}
                            style={{
                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
                                color: 'var(--text-secondary, #aaa)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem'
                            }}
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                    {listLoading ? (
                        <p>Loading MAO accounts...</p>
                    ) : maoList.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary, #aaa)' }}>No MAO administrators registered yet.</p>
                    ) : (
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Control ID</th>
                                    <th>Name</th>
                                    <th>Position</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maoList.map((mao) => (
                                    <tr key={mao.id}>
                                        <td><strong>{mao.control_id}</strong></td>
                                        <td>{mao.firstname} {mao.lastname}</td>
                                        <td><span className="badge badge-optimal">{mao.position}</span></td>
                                        <td>
                                            <button
                                                onClick={() => openDeleteModal(mao)}
                                                style={{
                                                    background: 'rgba(255,60,60,0.12)',
                                                    border: '1px solid rgba(255,60,60,0.3)',
                                                    borderRadius: '8px',
                                                    padding: '6px 14px',
                                                    cursor: 'pointer',
                                                    color: '#ff5050',
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    fontWeight: 600, fontSize: '0.85rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,60,60,0.25)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,60,60,0.12)'}
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
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

export default SuperAdminDashboard;
