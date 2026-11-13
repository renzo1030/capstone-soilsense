import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { Tractor, MapPin, User, PlusCircle, Trash2, Cpu, Link2Off, Link2 } from 'lucide-react';
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
        setReassignFarmId('');
    };

    const handleReassign = async () => {
        if (!reassignFarmId) { toast.error('Select a farm.'); return; }
        setReassignLoading(true);
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE_URL}/mao/assign-device/${reassignModal.device.device_id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ farm_id: reassignFarmId })
            });
            if (res.status === 401) { window.location.href = '/logout'; return; }
            if (res.ok) {
                setReassignModal({ open: false, device: null });
                toast.success('Device reassigned successfully.');
                fetchDevices();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to reassign device.');
            }
        } catch (err) {
            console.error('Reassign failed:', err);
            toast.error('Connection error.');
        } finally {
            setReassignLoading(false);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'No data received yet';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
            />

            {/* Reassign Modal */}
            {reassignModal.open && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '450px' }}>
                        <div className="modal-header-container">
                            <div className="modal-icon-wrapper" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                                <Link2 size={22} />
                            </div>
                            <h3 className="modal-title">Reassign Device</h3>
                        </div>
                        <div className="modal-body-text" style={{ textAlign: 'left' }}>
                            <p style={{ marginBottom: '15px' }}>
                                Reassigning <strong>{reassignModal.device?.device_uid}</strong> to a new farm:
                            </p>
                            <div className="flex flex-col gap-1.5 mb-4">
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
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setReassignModal({ open: false, device: null })}>Cancel</button>
                            <button className="btn-confirm" onClick={handleReassign} disabled={reassignLoading || !reassignFarmId}>
                                {reassignLoading ? 'Assigning...' : 'Assign Device'}
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
                                        <td><strong>{device.device_uid}</strong></td>
                                        <td>{device.device_name}</td>
                                        <td>{device.farm_id ? `${device.farm_location}` : <span className="sub-text">Unassigned</span>}</td>
                                        <td>
                                            {device.farm_id ? (
                                                <>{device.farmer_name}<br/><span className="sub-text">ID: {device.control_id}</span></>
                                            ) : (
                                                <span className="sub-text">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${device.is_active && device.farm_id ? 'badge-optimal' : 'badge-warning-alt'}`}>
                                                {device.is_active ? (device.farm_id ? 'Active' : 'Idle') : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="sub-text">{formatDate(device.last_sync)}</td>
                                        <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {device.farm_id ? (
                                                <button className="btn-delete" onClick={() => openUnassignModal(device)}>
                                                    <Link2Off size={14} style={{ marginRight: '4px' }}/> Unassign
                                                </button>
                                            ) : (
                                                <button className="btn-header btn-sm" onClick={() => openReassignModal(device)}>
                                                    <Link2 size={14} style={{ marginRight: '4px' }}/> Assign
                                                </button>
                                            )}
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
