import { useLocation } from 'react-router-dom';
import { MapPin, ShieldCheck, User } from 'lucide-react';
import { MUNICIPALITY } from '../config';

const ROUTE_META = {
    '/farmer/dashboard': { section: 'Farmer Portal', title: 'My Soil Dashboard' },
    '/farmer/history': { section: 'Farmer Portal', title: 'Historical Soil Logs' },
    '/mao/dashboard': { section: 'MAO Administration', title: 'Municipal Data Center' },
    '/mao/register-farmer': { section: 'MAO Administration', title: 'Farmer Registry' },
    '/mao/devices': { section: 'MAO Administration', title: 'Hardware & Farm Registry' },
    '/mao/history': { section: 'MAO Administration', title: 'Municipal Soil Logs' },
};

const Header = ({ role }) => {
    const location = useLocation();
    const meta = ROUTE_META[location.pathname] || {
        section: role === 'mao' ? 'MAO Administration' : 'Farmer Portal',
        title: 'SoilSense',
    };
    const username = sessionStorage.getItem('username') || (role === 'mao' ? 'MAO Admin' : 'Farmer');
    const isMao = role === 'mao';

    return (
        <header className="app-header">
            <div className="app-header-breadcrumb" aria-label="Breadcrumb">
                <span className="app-header-section">{meta.section}</span>
                <span className="app-header-sep" aria-hidden="true">/</span>
                <span className="app-header-title">{meta.title}</span>
            </div>

            <div className="app-header-meta">
                <span className="app-header-location">
                    <MapPin size={14} aria-hidden="true" />
                    {MUNICIPALITY.name}, {MUNICIPALITY.province}
                </span>

                <div className="app-header-user">
                    {isMao ? (
                        <ShieldCheck size={15} className="app-header-user-icon" aria-hidden="true" />
                    ) : (
                        <User size={15} className="app-header-user-icon" aria-hidden="true" />
                    )}
                    <span className="app-header-username">{username}</span>
                    <span className={`app-role-badge ${isMao ? 'app-role-mao' : 'app-role-farmer'}`}>
                        {isMao ? 'MAO Admin' : 'Rice Farmer'}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
