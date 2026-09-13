import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { Tractor, MapPin, User, PlusCircle, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

const MaoDevices = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [farmerList, setFarmerList] = useState([]);
    
    
    const [formData, setFormData] = useState({
        farmer_id: '',
        farm_location: '',
        farm_area_sqm: ''
    });
    const [formStatus, setFormStatus] = useState({ type: '', message: '' });
    const [formLoading, setFormLoading] = useState(false);

    // Unregister State
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchFarms = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/mao/farms/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401) {
                window.location.href = '/logout';
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setFarms(data);
            }
        } catch (error) {
            console.error("Error fetching farms:", error);
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
            if (response.status === 401) {
                window.location.href = '/logout';
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setFarmerList(data);
            }
        } catch (error) {
            console.error("Error fetching farmers:", error);
        }
    }, []);

    useEffect(() => {
        fetchFarms();
        fetchFarmers();
    }, [fetchFarms, fetchFarmers]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegisterFarm = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormStatus({ type: '', message: '' });
        
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`${API_BASE_URL}/mao/register-farm/`, {
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
                setFormStatus({ type: 'error', message: '❌ Server error. Could not parse response.' });
                return;
            }
            
            if (response.ok) {
                setFormStatus({ type: 'success', message: `✅ Success! Hardware registered (Farm ID: ${data.farm_id}).` });
                setFormData({ farmer_id: '', farm_location: '', farm_area_sqm: '' });
                fetchFarms(); // Refresh table
            } else {
                setFormStatus({ type: 'error', message: `❌ Error: ${data.error || 'Failed to register hardware.'}` });
            }
        } catch {
            setFormStatus({ type: 'error', message: '❌ Connection error. Is the Django server running?' });
        } finally {
            setFormLoading(false);
        }
    };

    const openDeleteModal = (farm) => {
        setDeleteModal({ open: true, id: farm.farm_id, title: `FARM-${farm.farm_id.toString().padStart(4, '0')}` });
    };

    const handleUnregister = async () => {
        setDeleteLoading(true);
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE_URL}/mao/unregister-farm/${deleteModal.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                window.location.href = '/logout';
                return;
            }
            if (res.ok) {
                setFarms(prev => prev.filter(f => f.farm_id !== deleteModal.id));
                setDeleteModal({ open: false, id: null, title: '' });
                toast.success('Hardware unregistered successfully.');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to unregister hardware.');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            toast.error('Connection error while unregistering.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'No data received yet';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <ConfirmModal
                isOpen={deleteModal.open}
                title="Unregister Hardware"
                message={`Are you sure you want to unassign ${deleteModal.title} from its current farmer? This will delete all historical soil readings associated with this specific hardware deployment. The farmer's account will remain active.`}
                onConfirm={handleUnregister}
                onCancel={() => setDeleteModal({ open: false, id: null, title: '' })}
                loading={deleteLoading}
            />
            <Sidebar role="mao" />
            <main className="content">
                <header className="dashboard-header">
                    <div>
                        <h1>Hardware & Farm Registry</h1>
                        <p>Track Deployed Sensors and Register New Hardware</p>
                    </div>
                </header>

                {/* Hardware Registration Form */}
                <div className="glass-card-form">
                    {formStatus.message && (
                        <div className={`status-badge status-badge-lg ${formStatus.type === 'success' ? 'badge-optimal' : 'badge-warning-alt'}`}>
                            {formStatus.message}
                        </div>
                    )}
                    <form onSubmit={handleRegisterFarm} className="form-grid">
                        <div className="form-section grid-col-full">
                            <div className="section-badge">
                                <span className="section-badge-icon"><Tractor size={18} color="var(--primary)" /></span>
                                Assign Hardware to Farmer
                            </div>
                            <div className="grid-auto-fit-250">
                                <div className="form-group m-0">
                                    <label>Select Farmer</label>
                                    <div className="input-icon-wrapper">
                                        <User className="input-icon" size={20} />
                                        <select 
                                            name="farmer_id" 
                                            value={formData.farmer_id} 
                                            onChange={handleChange} 
                                            required
                                            className="select-input"
                                            style={{ paddingLeft: '40px' }}
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
                                    <div className="input-icon-wrapper">
                                        <MapPin className="input-icon" size={20} />
                                        <input type="text" name="farm_location" value={formData.farm_location} onChange={handleChange} required placeholder="e.g., Brgy. San Jose Lot A" />
                                    </div>
                                </div>
                                <div className="form-group m-0">
                                    <label>Total Area (Square Meters)</label>
                                    <div className="input-icon-wrapper">
                                        <MapPin className="input-icon" size={20} />
                                        <input type="number" name="farm_area_sqm" value={formData.farm_area_sqm} onChange={handleChange} required placeholder="e.g., 10000" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid-col-full mt-10">
                            <button type="submit" className={`btn-submit ${formLoading ? 'btn-submit-loading' : ''}`} disabled={formLoading || farmerList.length === 0}>
                                <PlusCircle size={18} style={{ marginRight: '8px' }} />
                                {formLoading ? 'Registering...' : 'Register Hardware'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="table-container mt-30">
                    <h3 className="section-title">Deployed Hardware Units</h3>
                    {loading ? (
                        <p>Loading farm registry...</p>
                    ) : farms.length === 0 ? (
                        <p>No hardware registered yet.</p>
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
                                    <th>Action</th>
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
                                        <td>
                                            <button className="btn-delete" onClick={() => openDeleteModal(farm)}>
                                                <Trash2 size={14} style={{ marginRight: '4px' }}/> Unassign
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
export default MaoDevices;
