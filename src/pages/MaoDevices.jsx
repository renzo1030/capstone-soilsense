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
        const token = localStorage.getItem('access_token');
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
    }, []);

    const fetchFarms = useCallback(async () => {
        const token = localStorage.getItem('access_token');
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

        const token = localStorage.getItem('access_token');
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

        const token = localStorage.getItem('access_token');
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
        const token = localStorage.getItem('access_token');
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
        const token = localStorage.getItem('access_token');
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
                            <div className="form-group m-0">
                                <label>Select Farm</label>
                                <select
                                    className="select-input"
                                    value={reassignFarmId}
                                    onChange={(e) => setReassignFarmId(e.target.value)}
                                >
                                    <option value="" disabled>Select a farm</option>
                                    {farmList.map(farm => (
                                        <option key={farm.farm_id} value={farm.farm_id}>
                                            {farm.farmer_name} — {farm.location} (FARM-{farm.farm_id.toString().padStart(4, '0')})
                                        </option>
                                    ))}
                                </select>
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
                <div className="glass-card-form">
                    {farmFormStatus.message && (
                        <div className={`status-badge status-badge-lg ${farmFormStatus.type === 'success' ? 'badge-optimal' : 'badge-warning-alt'}`}>
                            {farmFormStatus.message}
                        </div>
                    )}
                    <form onSubmit={handleRegisterFarm} className="form-grid">
                        <div className="form-section grid-col-full">
                            <div className="section-badge">
                                <span className="section-badge-icon"><Tractor size={18} color="var(--primary)" /></span>
                                Step 1: Register a Farm
                            </div>
                            <div className="grid-auto-fit-250">
                                <div className="form-group m-0">
                                    <label>Select Farmer</label>
                                    <div className="relative w-full">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                        <select
                                            name="farmer_id"
                                            value={farmFormData.farmer_id}
                                            onChange={handleFarmChange}
                                            required
                                            className="select-input w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            style={{ paddingLeft: '2.75rem' }}
                                        >
                                            <option value="" disabled>Select a registered farmer</option>
                                            {farmerList.map(farmer => (
                                                <option key={farmer.farmer_id} value={farmer.farmer_id}>
                                                    {farmer.firstname} {farmer.lastname} ({farmer.control_id})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group m-0">
                                    <label>Farm Location</label>
                                    <div className="relative w-full">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                        <input 
                                            type="text" 
                                            name="farm_location" 
                                            value={farmFormData.farm_location} 
                                            onChange={handleFarmChange} 
                                            required 
                                            placeholder="e.g., Brgy. San Jose Lot A"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            style={{ paddingLeft: '2.75rem' }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group m-0">
                                    <label>Total Area (Square Meters)</label>
                                    <div className="relative w-full">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                        <input 
                                            type="number" 
                                            name="farm_area_sqm" 
                                            value={farmFormData.farm_area_sqm} 
                                            onChange={handleFarmChange} 
                                            required 
                                            placeholder="e.g., 10000"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            style={{ paddingLeft: '2.75rem' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid-col-full mt-10">
                            <button type="submit" className={`btn-submit ${farmFormLoading ? 'btn-submit-loading' : ''}`} disabled={farmFormLoading || farmerList.length === 0}>
                                <PlusCircle size={18} style={{ marginRight: '8px' }} />
                                {farmFormLoading ? 'Registering...' : 'Register Farm'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Section 2: Register an IoT Device ── */}
                <div className="glass-card-form mt-30">
                    {deviceFormStatus.message && (
                        <div className={`status-badge status-badge-lg ${deviceFormStatus.type === 'success' ? 'badge-optimal' : 'badge-warning-alt'}`}>
                            {deviceFormStatus.message}
                        </div>
                    )}
                    <form onSubmit={handleRegisterDevice} className="form-grid">
                        <div className="form-section grid-col-full">
                            <div className="section-badge">
                                <span className="section-badge-icon"><Cpu size={18} color="var(--primary)" /></span>
                                Step 2: Register & Assign IoT Device
                            </div>
                            <div className="grid-auto-fit-250">
                                <div className="form-group m-0">
                                    <label>Device UID (MAC / Serial)</label>
                                    <div className="relative w-full">
                                        <Cpu className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                        <input 
                                            type="text" 
                                            name="device_uid" 
                                            value={deviceFormData.device_uid} 
                                            onChange={handleDeviceChange} 
                                            required 
                                            placeholder="e.g., AA:BB:CC:DD:EE:FF"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            style={{ paddingLeft: '2.75rem' }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group m-0">
                                    <label>Device Name</label>
                                    <div className="relative w-full">
                                        <Cpu className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                        <input 
                                            type="text" 
                                            name="device_name" 
                                            value={deviceFormData.device_name} 
                                            onChange={handleDeviceChange} 
                                            placeholder="e.g., SoilSense Probe #1"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            style={{ paddingLeft: '2.75rem' }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group m-0">
                                    <label>Assign to Farm</label>
                                    <div className="relative w-full">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                        <select
                                            name="farm_id"
                                            value={deviceFormData.farm_id}
                                            onChange={handleDeviceChange}
                                            className="select-input w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            style={{ paddingLeft: '2.75rem' }}
                                        >
                                            <option value="">No assignment (register only)</option>
                                            {farmList.map(farm => (
                                                <option key={farm.farm_id} value={farm.farm_id}>
                                                    {farm.farmer_name} — {farm.location} (FARM-{farm.farm_id.toString().padStart(4, '0')})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid-col-full mt-10">
                            <button type="submit" className={`btn-submit ${deviceFormLoading ? 'btn-submit-loading' : ''}`} disabled={deviceFormLoading}>
                                <PlusCircle size={18} style={{ marginRight: '8px' }} />
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
