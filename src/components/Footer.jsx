import { Sprout } from 'lucide-react';
import { MUNICIPALITY } from '../config';

const Footer = () => {
    return (
        <footer className="app-footer">
            <div className="app-footer-brand">
                <span className="app-footer-logo">
                    <Sprout size={16} aria-hidden="true" />
                    <strong>Soil<span>Sense</span></strong>
                </span>
                <span className="app-footer-divider" aria-hidden="true">•</span>
                <span className="app-footer-subtitle">
                    Smart IoT Soil Monitoring &amp; Fertilizer Recommendation System
                </span>
            </div>
            <div className="app-footer-copy">
                &copy; 2026 SoilSense &bull; {MUNICIPALITY.officeName} ({MUNICIPALITY.name}, {MUNICIPALITY.province})
            </div>
        </footer>
    );
};

export default Footer;
