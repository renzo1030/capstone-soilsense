import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ role, children }) => {
    return (
        <div className="app-layout">
            <Sidebar role={role} />
            <div className="app-shell">
                <Header role={role} />
                {children}
                <Footer />
            </div>
        </div>
    );
};

export default Layout;
