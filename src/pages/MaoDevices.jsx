import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { Tractor, MapPin, User, PlusCircle, Trash2, Cpu, Link2Off, Link2, X, Pencil } from 'lucide-react';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

const MaoDevices = () => {
    // Device list state
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Farmer & Farm lists for dropdowns
    const [farmerList, setFarmerList] = useState([]);
    const [farmList, setFarmList] = useState([]);

    // Farm Registration Form
    const [farmFormData, setFarmFormData] = useState({
        farmer_id: '',
        farm_location: '',
        farm_area_sqm: ''
    });
    const [farmFormStatus, setFarmFormStatus] = useState({ type: '', message: '' });
    const [farmFormLoading, setFarmFormLoading] = useState(false);

    // Device Registration Form
    const [deviceFormData, setDeviceFormData] = useState({
        device_uid: '',
        device_name: '',
        farm_id: ''
    });
    const [deviceFormStatus, setDeviceFormStatus] = useState({ type: '', message: '' });
    const [deviceFormLoading, setDeviceFormLoading] = useState(false);

    // Unassign Modal State
    const [unassignModal, setUnassignModal] = useState({ open: false, id: null, title: '' });
    const [unassignLoading, setUnassignLoading] = useState(false);

    // Reassign Modal State
    const [reassignModal, setReassignModal] = useState({ open: false, device: null });
    const [reassignFarmId, setReassignFarmId] = useState('');
    const [reassignLoading, setReassignLoading] = useState(false);

    // Edit Device Name Modal State
    const [editModal, setEditModal] = useState({ open: false, device: null });
    const [editName, setEditName] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Delete Device Modal State
    const [deleteModal, setDeleteModal] = useState({ open: false, device: null });
    const [deleteLoading, setDeleteLoading] = useState(false);

    // ── Fetch Functions ──

    const fetchDevices = useCallback(async () => {
        const token = sessionStorage.getItem('access_token');
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/mao/device-list/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401) {
                window.location.href = '/logout';
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setDevices(data);
            }
        } catch (error) {
            console.error("Error fetching devices:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchFarmers = useCallback(async () => {
        const token = sessionStorage.getItem('access_token');
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
    }, []);

    const fetchFarms = useCallback(async () => {
        const token = sessionStorage.getItem('access_token');
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/mao/farms/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFarmList(data);
            }
        } catch (error) {
            console.error("Error fetching farms:", error);
        }
    }, []);

    useEffect(() => {
        fetchDevices();
        fetchFarmers();
        fetchFarms();
    }, [fetchDevices, fetchFarmers, fetchFarms]);

    // ── Farm Registration ──

    const handleFarmChange = (e) => {
        const { name, value } = e.target;
        setFarmFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegisterFarm = async (e) => {
        e.preventDefault();
        setFarmFormLoading(true);
        setFarmFormStatus({ type: '', message: '' });

        const token = sessionStorage.getItem('access_token');
        try {
            const response = await fetch(`${API_BASE_URL}/mao/register-farm/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(farmFormData)
            });

            if (response.status === 401) { window.location.href = '/logout'; return; }

            let data;
            try { data = await response.json(); } catch {
                setFarmFormStatus({ type: 'error', message: '❌ Server error.' });
                return;
            }

            if (response.ok) {
                setFarmFormStatus({ type: 'success', message: `✅ Farm registered (ID: ${data.farm_id}). Now register an IoT device below.` });
                setFarmFormData({ farmer_id: '', farm_location: '', farm_area_sqm: '' });
                fetchFarms(); // Refresh farm dropdown
            } else {
                setFarmFormStatus({ type: 'error', message: `❌ ${data.error || 'Failed to register farm.'}` });
            }
        } catch {
            setFarmFormStatus({ type: 'error', message: '❌ Connection error.' });
        } finally {
            setFarmFormLoading(false);
        }
    };

    // ── Device Registration ──

    const handleDeviceChange = (e) => {
        const { name, value } = e.target;
        setDeviceFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegisterDevice = async (e) => {
        e.preventDefault();
        setDeviceFormLoading(true);
        setDeviceFormStatus({ type: '', message: '' });

        const token = sessionStorage.getItem('access_token');
        try {
            const response = await fetch(`${API_BASE_URL}/mao/register-device/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(deviceFormData)
            });

            if (response.status === 401) { window.location.href = '/logout'; return; }

            let data;
            try { data = await response.json(); } catch {
                setDeviceFormStatus({ type: 'error', message: '❌ Server error.' });
                return;
            }

            if (response.ok) {
                setDeviceFormStatus({ type: 'success', message: `✅ Device registered (UID: ${data.device_uid}).` });
                setDeviceFormData({ device_uid: '', device_name: '', farm_id: '' });
                fetchDevices(); // Refresh table
            } else {
                setDeviceFormStatus({ type: 'error', message: `❌ ${data.error || 'Failed to register device.'}` });
            }
        } catch {
            setDeviceFormStatus({ type: 'error', message: '❌ Connection error.' });
        } finally {
            setDeviceFormLoading(false);
        }
    };

    // ── Unassign Device (sets device.farm = null, preserves data) ──

    const openUnassignModal = (device) => {
        setUnassignModal({ open: true, id: device.device_id, title: device.device_uid });
    };

    const handleUnassign = async () => {
        setUnassignLoading(true);
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE_URL}/mao/unassign-device/${unassignModal.id}/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) { window.location.href = '/logout'; return; }
            if (res.ok) {
                setDevices(prev => prev.map(d =>
                    d.device_id === unassignModal.id
                        ? { ...d, farm_id: null, farm_location: 'Unassigned', farmer_name: 'N/A', control_id: 'N/A' }
                        : d
                ));
                setUnassignModal({ open: false, id: null, title: '' });
                toast.success('Device unassigned. Historical soil data preserved.');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to unassign device.');
            }
        } catch (err) {
            console.error('Unassign failed:', err);
            toast.error('Connection error.');
        } finally {
            setUnassignLoading(false);
        }
    };

    // ── Reassign Device ──

    const openReassignModal = (device) => {
        setReassignModal({ open: true, device });
        setReassignFarmId(device.farm_id ? String(device.farm_id) : '');
    };

    const handleReassign = async () => {
        if (!reassignFarmId) { toast.error('Please select a farm.'); return; }
        setReassignLoading(true);
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE_URL}/mao/assign-device/${reassignModal.device.device_id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ farm_id: Number(reassignFarmId) })
            });
            if (res.status === 401) { window.location.href = '/logout'; return; }

            let data = {};
            try {
                data = await res.json();
            } catch {
                // fallback if non-json
            }

            if (res.ok) {
                const selectedFarm = farmList.find(f => String(f.farm_id) === String(reassignFarmId));
                setDevices(prev => prev.map(d => {
                    if (d.device_id !== reassignModal.device.device_id) return d;
                    if (data.device) return data.device;
                    return {
                        ...d,
                        farm_id: Number(reassignFarmId),
                        farm_location: selectedFarm ? selectedFarm.location : d.farm_location,
                        farmer_name: selectedFarm ? selectedFarm.farmer_name : d.farmer_name,
                        control_id: selectedFarm ? selectedFarm.control_id : d.control_id,
                    };
                }));
                setReassignModal({ open: false, device: null });
                toast.success(data.message || 'Device assigned to farm successfully.');
                fetchDevices();
            } else {
                toast.error(data.error || 'Failed to assign device.');
            }
        } catch (err) {
            console.error('Reassign failed:', err);
            toast.error('Connection error while assigning device.');
        } finally {
            setReassignLoading(false);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'No data received yet';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // ── Edit Device Name ──

    const openEditModal = (device) => {
        setEditModal({ open: true, device });
        setEditName(device.device_name || '');
    };

    const closeEditModal = () => {
        if (editLoading) return;
        setEditModal({ open: false, device: null });
        setEditName('');
    };

    const handleEditSave = async (e) => {
        e?.preventDefault();
        const trimmed = editName.trim();
        if (!trimmed) { toast.error('Device name cannot be empty.'); return; }
        if (trimmed === editModal.device.device_name) { closeEditModal(); return; }

        setEditLoading(true);
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE_URL}/mao/devices/${editModal.device.device_id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ device_name: trimmed })
            });
            if (res.status === 401) { window.location.href = '/logout'; return; }
            let data = {};
            try { data = await res.json(); } catch { /* non-JSON */ }

            if (res.ok) {
                const id = editModal.device.device_id;
                setDevices(prev => prev.map(d =>
                    d.device_id === id ? (data.device || { ...d, device_name: trimmed }) : d
                ));
                toast.success(data.message || 'Device renamed.');
                setEditModal({ open: false, device: null });
                setEditName('');
            } else {
                toast.error(data.error || 'Failed to rename device.');
            }
        } catch (err) {
            console.error('Rename failed:', err);
            toast.error('Connection error while renaming device.');
        } finally {
            setEditLoading(false);
        }
    };

    // ── Delete Device ──

    const openDeleteModal = (device) => setDeleteModal({ open: true, device });

    const handleDelete = async () => {
        const device = deleteModal.device;
        if (!device) return;
        setDeleteLoading(true);
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE_URL}/mao/devices/${device.device_id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) { window.location.href = '/logout'; return; }
            let data = {};
            try { data = await res.json(); } catch { /* non-JSON */ }

            if (res.ok) {
                setDevices(prev => prev.filter(d => d.device_id !== device.device_id));
                setDeleteModal({ open: false, device: null });
                toast.success(data.message || `Device ${device.device_uid} deleted.`);
            } else {
                toast.error(data.error || 'Failed to delete device.');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            toast.error('Connection error while deleting device.');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <>
            {/* Unassign Confirmation Modal */}
            <ConfirmModal
                isOpen={unassignModal.open}
                title="Unassign IoT Device"
                message={`Are you sure you want to unassign device "${unassignModal.title}" from its current farm? The device will stop sending data until reassigned. All historical soil readings are preserved.`}
                onConfirm={handleUnassign}
                onCancel={() => setUnassignModal({ open: false, id: null, title: '' })}
                loading={unassignLoading}
                confirmLabel="Yes, Unassign"
                loadingLabel="Unassigning..."
            />

            {/* Delete Device Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.open}
                title="Delete IoT Device"
                message={`Permanently delete device "${deleteModal.device?.device_uid}"${deleteModal.device?.device_name ? ` (${deleteModal.device.device_name})` : ''}? This cannot be undone. Historical soil readings recorded by this device will be preserved and remain visible in the farm's history, but the ESP32 using this UID will be rejected until it is re-registered.`}
                onConfirm={handleDelete}
                onCancel={() => !deleteLoading && setDeleteModal({ open: false, device: null })}
                loading={deleteLoading}
                confirmLabel="Yes, Delete Device"
                loadingLabel="Deleting..."
            />

            {/* Edit Device Name Modal */}
            {editModal.open && (
                <div className="modal-overlay">
                    <form className="modal-container" style={{ maxWidth: '460px' }} onSubmit={handleEditSave}>
                        <div className="modal-header-container">
                            <div className="modal-icon-wrapper" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                                <Pencil size={20} />
                            </div>
                            <h3 className="modal-title">Edit Device Name</h3>
                            <button type="button" onClick={closeEditModal} className="btn-close" aria-label="Close modal">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body-text" style={{ textAlign: 'left', marginBottom: '20px' }}>
                            <p style={{ marginBottom: '15px' }}>
                                Device UID: <strong>{editModal.device?.device_uid}</strong>
                                <br />
                                <span className="sub-text">The UID is read-only because the ESP32 firmware authenticates with it.</span>
                            </p>
                            <div className="flex flex-col gap-1.5 mb-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                    Device Name
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base">
                                        <Cpu size={18} />
                                    </span>
                                    <input
                                        type="text"
                                        autoFocus
                                        maxLength={100}
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="e.g., SoilSense Probe #1"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-cancel" onClick={closeEditModal} disabled={editLoading}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-confirm primary"
                                disabled={editLoading || !editName.trim()}
                            >
                                <Pencil size={16} />
                                {editLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reassign Modal */}
            {reassignModal.open && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '460px' }}>
                        <div className="modal-header-container">
                            <div className="modal-icon-wrapper" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                                <Link2 size={22} />
                            </div>
                            <h3 className="modal-title">
                                {reassignModal.device?.farm_id ? 'Reassign Device' : 'Assign Device'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setReassignModal({ open: false, device: null })}
                                className="btn-close"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body-text" style={{ textAlign: 'left', marginBottom: '20px' }}>
                            <p style={{ marginBottom: '15px' }}>
                                Assigning <strong>{reassignModal.device?.device_uid}</strong> to a farm:
                            </p>
                            <div className="flex flex-col gap-1.5 mb-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                    Select Farm
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base z-10">
                                        <MapPin className="h-5 w-5 text-slate-400" />
                                    </span>
                                    <select
                                        className="w-full appearance-none pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium shadow-sm hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150 cursor-pointer"
                                        value={reassignFarmId}
                                        onChange={(e) => setReassignFarmId(e.target.value)}
                                    >
                                        <option value="" disabled className="text-slate-400 bg-white py-2">
                                            Select a farm
                                        </option>
                                        {farmList.map((farm) => (
                                            <option
                                                key={farm.farm_id}
                                                value={farm.farm_id}
                                                className="text-slate-800 bg-white py-2.5 px-3 hover:bg-emerald-50"
                                            >
                                                {farm.farmer_name} — {farm.location} (FARM-{farm.farm_id.toString().padStart(4, '0')})
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
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setReassignModal({ open: false, device: null })}
                                disabled={reassignLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-confirm primary inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition duration-150 disabled:opacity-50"
                                style={{ backgroundColor: '#059669', color: '#ffffff' }}
                                onClick={handleReassign}
                                disabled={reassignLoading || !reassignFarmId}
                            >
                                <Link2 size={16} />
                                {reassignLoading ? 'Assigning...' : 'Confirm Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Sidebar role="mao" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>Hardware & Farm Registry</h1>
                        <p>Register Farms, Deploy IoT Sensors, and Manage Assignments</p>
                    </div>
                </header>

                {/* ── Section 1: Register a Farm ── */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden mb-8">
                    {farmFormStatus.message && (
                        <div className={`p-4 text-sm font-medium border-b ${farmFormStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
                            {farmFormStatus.message}
                        </div>
                    )}
                    <form onSubmit={handleRegisterFarm}>
                        <div className="p-6">
                            <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
                                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md flex items-center justify-center">
                                    <Tractor size={18} />
                                </span>
                                <h3 className="font-semibold text-slate-800 text-sm">Step 1: Register a Farm</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Select Farmer */}
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Select Farmer
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base z-10">
                                            <User size={18} />
                                        </span>
                                        <select
                                            name="farmer_id"
                                            value={farmFormData.farmer_id}
                                            onChange={handleFarmChange}
                                            required
                                            className="w-full appearance-none pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium shadow-sm hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150 cursor-pointer"
                                        >
                                            <option value="" disabled className="text-slate-400 bg-white py-2">
                                                Select a registered farmer
                                            </option>
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

                                {/* Farm Location */}
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Farm Location
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base">
                                            <MapPin size={18} />
                                        </span>
                                        <input 
                                            type="text" 
                                            name="farm_location" 
                                            value={farmFormData.farm_location} 
                                            onChange={handleFarmChange} 
                                            required 
                                            placeholder="e.g., Brgy. San Jose Lot A"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150"
                                        />
                                    </div>
                                </div>

                                {/* Total Area */}
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Total Area (Square Meters)
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base">
                                            <MapPin size={18} />
                                        </span>
                                        <input 
                                            type="number" 
                                            name="farm_area_sqm" 
                                            value={farmFormData.farm_area_sqm} 
                                            onChange={handleFarmChange} 
                                            required 
                                            placeholder="e.g., 10000"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end px-6 pb-6">
                            <button
                                type="submit"
                                disabled={farmFormLoading || farmerList.length === 0}
                                className="w-full md:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium text-sm rounded-lg shadow-sm shadow-emerald-900/10 transition duration-150 disabled:opacity-50"
                            >
                                <PlusCircle size={18} />
                                {farmFormLoading ? 'Registering...' : 'Register Farm'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Section 2: Register an IoT Device ── */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden mb-8">
                    {deviceFormStatus.message && (
                        <div className={`p-4 text-sm font-medium border-b ${deviceFormStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
                            {deviceFormStatus.message}
                        </div>
                    )}
                    <form onSubmit={handleRegisterDevice}>
                        <div className="p-6">
                            <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
                                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md flex items-center justify-center">
                                    <Cpu size={18} />
                                </span>
                                <h3 className="font-semibold text-slate-800 text-sm">Step 2: Register & Assign IoT Device</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Device UID */}
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Device UID (MAC / Serial)
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base">
                                            <Cpu size={18} />
                                        </span>
                                        <input 
                                            type="text" 
                                            name="device_uid" 
                                            value={deviceFormData.device_uid} 
                                            onChange={handleDeviceChange} 
                                            required 
                                            placeholder="e.g., AA:BB:CC:DD:EE:FF"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150"
                                        />
                                    </div>
                                </div>

                                {/* Device Name */}
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Device Name
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base">
                                            <Cpu size={18} />
                                        </span>
                                        <input 
                                            type="text" 
                                            name="device_name" 
                                            value={deviceFormData.device_name} 
                                            onChange={handleDeviceChange} 
                                            placeholder="e.g., SoilSense Probe #1"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150"
                                        />
                                    </div>
                                </div>

                                {/* Assign to Farm */}
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Assign to Farm
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center text-base z-10">
                                            <MapPin size={18} />
                                        </span>
                                        <select
                                            name="farm_id"
                                            value={deviceFormData.farm_id}
                                            onChange={handleDeviceChange}
                                            className="w-full appearance-none pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium shadow-sm hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition duration-150 cursor-pointer"
                                        >
                                            <option value="" className="text-slate-500 bg-white py-2">No assignment (register only)</option>
                                            {farmList.map((farm) => (
                                                <option
                                                    key={farm.farm_id}
                                                    value={farm.farm_id}
                                                    className="text-slate-800 bg-white py-2.5 px-3 hover:bg-emerald-50"
                                                >
                                                    {farm.farmer_name} — {farm.location} (FARM-{farm.farm_id.toString().padStart(4, '0')})
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
                        </div>
                        <div className="flex justify-end px-6 pb-6">
                            <button
                                type="submit"
                                disabled={deviceFormLoading}
                                className="w-full md:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium text-sm rounded-lg shadow-sm shadow-emerald-900/10 transition duration-150 disabled:opacity-50"
                            >
                                <PlusCircle size={18} />
                                {deviceFormLoading ? 'Registering...' : 'Register IoT Device'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Section 3: Deployed Devices Table ── */}
                <div className="table-container mt-30">
                    <h3 className="section-title">Deployed IoT Devices</h3>
                    {loading ? (
                        <p>Loading device registry...</p>
                    ) : devices.length === 0 ? (
                        <p>No IoT devices registered yet.</p>
                    ) : (
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Device UID</th>
                                    <th>Device Name</th>
                                    <th>Assigned Farm</th>
                                    <th>Farmer</th>
                                    <th>Status</th>
                                    <th>Last Sync</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {devices.map((device) => (
                                    <tr key={device.device_id}>
                                        <td data-label="Device UID"><strong>{device.device_uid}</strong></td>
                                        <td data-label="Device Name">{device.device_name}</td>
                                        <td data-label="Assigned Farm">{device.farm_id ? `${device.farm_location}` : <span className="sub-text">Unassigned</span>}</td>
                                        <td data-label="Farmer">
                                            {device.farm_id ? (
                                                <>{device.farmer_name}<br/><span className="sub-text">ID: {device.control_id}</span></>
                                            ) : (
                                                <span className="sub-text">—</span>
                                            )}
                                        </td>
                                        <td data-label="Status">
                                            <span className={`badge ${device.is_active && device.farm_id ? 'badge-optimal' : 'badge-warning-alt'}`}>
                                                {device.is_active ? (device.farm_id ? 'Active' : 'Idle') : 'Inactive'}
                                            </span>
                                        </td>
                                        <td data-label="Last Sync" className="sub-text">{formatDate(device.last_sync)}</td>
                                        <td data-label="Actions" className="device-actions-cell">
                                            <div className="device-actions">
                                                {device.farm_id ? (
                                                    <>
                                                        <button className="btn-view" onClick={() => openReassignModal(device)} title="Move to another farm">
                                                            <Link2 size={14} /> Reassign
                                                        </button>
                                                        <button className="btn-unassign" onClick={() => openUnassignModal(device)} title="Detach from farm">
                                                            <Link2Off size={14} /> Unassign
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button className="btn-view" onClick={() => openReassignModal(device)} title="Assign to a farm">
                                                        <Link2 size={14} /> Assign
                                                    </button>
                                                )}
                                                <button className="btn-edit" onClick={() => openEditModal(device)} title="Rename device" aria-label={`Edit ${device.device_uid}`}>
                                                    <Pencil size={14} /> Edit
                                                </button>
                                                <button className="btn-delete" onClick={() => openDeleteModal(device)} title="Delete device" aria-label={`Delete ${device.device_uid}`}>
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
export default MaoDevices;
