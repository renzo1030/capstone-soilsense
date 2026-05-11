import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
const Logout = () => {
    useEffect(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
    }, []);
    return (
        <div className="login-wrapper">
            <div className="form-container logout-container">
                <div className="logout-emoji">👋</div>
                <h2 className="logout-title">Signed Out</h2>
                <p className="logout-text">
                    You have successfully logged out of SoilSense.
                </p>
                <Link to="/login" className="btn-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
                    Return to Login
                </Link>
            </div>
        </div>
    );
};
export default Logout;
