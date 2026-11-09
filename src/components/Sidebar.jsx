import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
const Sidebar = ({ role }) => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    useEffect(() => {
        setIsOpen(false);
    }, [location]);
    const farmerLinks = [
        { path: '/farmer/dashboard', label: 'My Dashboard' },
        { path: '/farmer/history', label: 'Soil Logs' },
    ];
    const maoLinks = [
        { path: '/mao/dashboard', label: 'Municipality View' },
        { path: '/mao/register-farmer', label: 'Register Farmer' },
        { path: '/mao/devices', label: 'Hardware Registry' },
        { path: '/mao/history', label: 'All Logs' },
    ];

    const getLinks = () => {

        if (role === 'mao') return maoLinks;
        if (role === 'farmer') return farmerLinks;
        return [{ path: '/login', label: 'Login' }];
    };
    const links = getLinks();
    return (
        <>
            <div className="mobile-header">
                <Link to={links[0].path} className="mobile-logo">Soil<span>Sense</span></Link>
                <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>
            {isOpen && <div className="mobile-overlay" onClick={() => setIsOpen(false)}></div>}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <Link to={links[0].path} className="logo">Soil<span>Sense</span></Link>
            <ul className="nav-links">
                {links.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <li key={link.path}>
                            <Link 
                                to={link.path} 
                                className={isActive ? 'active bg-emerald-600 text-white font-semibold shadow-sm' : 'text-gray-600 hover:bg-gray-100'}
                                style={isActive ? { color: '#ffffff', backgroundColor: '#059669' } : {}}
                            >
                                {link.label}
                            </Link>
                        </li>
                    );
                })}
                <li><Link to="/logout" className="logout-link">Logout</Link></li>
            </ul>
            </aside>
        </>
    );
};
export default Sidebar;
