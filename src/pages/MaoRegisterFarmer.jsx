import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { UserPlus, MapPin, Phone, User, Hash, Lock, Trash2, RefreshCw, Cpu, Ruler, Eye, X } from 'lucide-react';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

const MaoRegisterFarmer = () => {
    const [formData, setFormData] = useState({
        control_id: '',
        firstname: '',
        lastname: '',
        contact_number: '',
        barangay: ''
    });
    const [loading, setLoading] = useState(false);

    // Farmer list state
    const [farmerList, setFarmerList] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, id: null, name: '' });
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Profile Modal State
    const [profileModal, setProfileModal] = useState({ open: false, farmer: null });
    const openProfileModal = (farmer) => setProfileModal({ open: true, farmer });
    const closeProfileModal = () => setProfileModal({ open: false, farmer: null });
    const fetchFarmerList = useCallback(async () => {
        setListLoading(true);
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE_URL}/mao/list-farmers/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                window.location.href = '/logout';
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setFarmerList(data);
            }
        } catch (err) {
            console.error('Error fetching farmer list:', err);
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFarmerList();
    }, [fetchFarmerList]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'control_id' ? value.toUpperCase() : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = sessionStorage.getItem('access_token');
        try {
            const response = await fetch(`${API_BASE_URL}/mao/register-farmer/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (response.status === 401) {
                window.location.href = '/logout';
                return;
            }
            let data;
            try {
                data = await response.json();
            } catch {
                toast.error('Server error. Could not parse response.');
                setLoading(false);
                return;
            }
            if (response.ok) {
                toast.success(`Success! New farmer registered (ID: ${data.farmer_id}). Default password: Farmer123`);
                setFormData({
                    control_id: '', firstname: '', lastname: '',
                    contact_number: '', barangay: ''
                });
                fetchFarmerList(); // Refresh list
            } else {
                toast.error(data.error || 'Failed to register farmer.');
            }
        } catch {
            toast.error('Connection error. Is the Django server running?');
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (farmer) => {
        setModal({ open: true, id: farmer.id, name: `${farmer.firstname} ${farmer.lastname} (${farmer.control_id})` });
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE_URL}/mao/delete-farmer/${modal.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                window.location.href = '/logout';
                return;
            }
            if (res.ok) {
                setFarmerList(prev => prev.filter(f => f.id !== modal.id));
                setModal({ open: false, id: null, name: '' });
                toast.success('Farmer account deleted successfully.');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete farmer.');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            toast.error('Connection error while deleting.');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <>
            {/* Profile Modal */}
            {profileModal.open && profileModal.farmer && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '500px' }}>
                        <div className="modal-header-container">
                            <div className="modal-icon-wrapper" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                                <User size={22} />
                            </div>
                            <h3 className="modal-title">Farmer Profile</h3>
                            <button onClick={closeProfileModal} className="btn-close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body-text" style={{ textAlign: 'left' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Control ID</span>
                                    <p style={{ fontWeight: '600', color: 'var(--text-dark)', marginTop: '4px' }}>{profileModal.farmer.control_id}</p>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Full Name</span>
                                    <p style={{ fontWeight: '600', color: 'var(--text-dark)', marginTop: '4px' }}>{profileModal.farmer.firstname} {profileModal.farmer.lastname}</p>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Contact Number</span>
                                    <p style={{ fontWeight: '600', color: 'var(--text-dark)', marginTop: '4px' }}>{profileModal.farmer.contact_number}</p>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Barangay</span>
                                    <p style={{ fontWeight: '600', color: 'var(--text-dark)', marginTop: '4px' }}>{profileModal.farmer.barangay}</p>
                                </div>
                                <div style={{ gridColumn: '1 / -1', padding: '15px', background: 'var(--bg-color)', borderRadius: '8px', marginTop: '10px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Farm Location</span>
                                    <p style={{ fontWeight: '600', color: 'var(--text-dark)', marginTop: '4px', marginBottom: '10px' }}>{profileModal.farmer.farm_location}</p>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Farm Area (sqm)</span>
                                    <p style={{ fontWeight: '600', color: 'var(--text-dark)', marginTop: '4px' }}>{profileModal.farmer.farm_area_sqm} sqm</p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ marginTop: '20px' }}>
                            <button onClick={closeProfileModal} className="btn-submit" style={{ width: '100%', marginTop: '0' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <ConfirmModal
                isOpen={modal.open}
                title="Delete Farmer Account"
                message={`Are you sure you want to permanently delete the account for ${modal.name}? This will also remove their farm and all associated soil readings.`}
                onConfirm={handleDelete}
                onCancel={() => setModal({ open: false, id: null, name: '' })}
                loading={deleteLoading}
            />
            <Sidebar role="mao" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>Register New Farmer</h1>
                        <p>Create a new farmer account.</p>
                    </div>
                </header>

                {/* Register Farmer Form Container */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden mb-10">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                            {/* Card 1: Account Credentials */}
                            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
                                    <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md flex items-center justify-center">
                                        <Lock size={18} />
                                    </span>
                                    <h3 className="font-semibold text-slate-800 text-sm">Account Credentials</h3>
                                </div>

                                {/* Control ID */}
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Control ID (Username)
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base">
                                            <Hash size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            name="control_id"
                                            value={formData.control_id}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150"
                                            placeholder="e.g. FARMER001"
                                        />
                                    </div>
                                </div>

                                {/* Default Temporary Password Notice */}
                                <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-left">
                                    <div className="flex items-start gap-3">
                                        <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0 mt-0.5">
                                            <Lock size={16} />
                                        </span>
                                        <div className="text-xs text-slate-700 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-800">Default Temporary Password:</span>
                                                <code className="bg-emerald-100/80 px-2 py-0.5 rounded font-mono font-bold text-emerald-900 text-xs">
                                                    Farmer123
                                                </code>
                                            </div>
                                            <p className="text-slate-500 leading-relaxed">
                                                New farmers will be automatically prompted to create their own strong, private password upon their first login.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Personal Details */}
                            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
                                    <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md flex items-center justify-center">
                                        <User size={18} />
                                    </span>
                                    <h3 className="font-semibold text-slate-800 text-sm">Personal Details</h3>
                                </div>

                                {/* First Name */}
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        First Name
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base">
                                            <User size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            name="firstname"
                                            value={formData.firstname}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150"
                                            placeholder="Juan"
                                        />
                                    </div>
                                </div>

                                {/* Last Name */}
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Last Name
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base">
                                            <User size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            name="lastname"
                                            value={formData.lastname}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150"
                                            placeholder="Dela Cruz"
                                        />
                                    </div>
                                </div>

                                {/* Contact Number */}
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Contact Number
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base">
                                            <Phone size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            name="contact_number"
                                            value={formData.contact_number}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150"
                                            placeholder="09xxxxxxxxx"
                                        />
                                    </div>
                                </div>

                                {/* Barangay */}
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Barangay
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base">
                                            <MapPin size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            name="barangay"
                                            value={formData.barangay}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150"
                                            placeholder="San Jose"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end px-6 pb-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full md:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium text-sm rounded-lg shadow-sm shadow-emerald-900/10 transition duration-150 disabled:opacity-50"
                            >
                                {loading ? 'Registering...' : 'Register Farmer'}
                            </button>
                        </div>
                    </form>
                </div>

                {}
                <div className="table-container mt-30">
                    <div className="flex-between-mb16">
                        <h3 className="section-title m-0">Registered Farmers</h3>
                        <button
                            onClick={fetchFarmerList}
                            className="btn-refresh"
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                    {listLoading ? (
                        <p>Loading farmer list...</p>
                    ) : farmerList.length === 0 ? (
                        <p className="text-secondary">No farmers registered yet.</p>
                    ) : (
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Control ID</th>
                                    <th>Name</th>
                                    <th>Barangay</th>
                                    <th>Contact</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {farmerList.map((farmer) => (
                                    <tr key={farmer.id}>
                                        <td><strong>{farmer.control_id}</strong></td>
                                        <td>{farmer.firstname} {farmer.lastname}</td>
                                        <td>{farmer.barangay}</td>
                                        <td>{farmer.contact_number}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => openProfileModal(farmer)}
                                                    className="btn-view"
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(farmer)}
                                                    className="btn-delete"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
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

export default MaoRegisterFarmer;
