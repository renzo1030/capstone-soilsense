import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const token = sessionStorage.getItem('access_token');
    const userRole = sessionStorage.getItem('user_role');
    const mustChangePassword = sessionStorage.getItem('must_change_password') === 'true';

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Force mandatory redirect if password change is required
    if (mustChangePassword && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    // If password change is not required, prevent visiting /change-password directly
    if (!mustChangePassword && location.pathname === '/change-password') {
        if (userRole === 'mao' || userRole === 'farmer') {
            return <Navigate to={`/${userRole}/dashboard`} replace />;
        }
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        if (userRole === 'mao' || userRole === 'farmer') {
            return <Navigate to={`/${userRole}/dashboard`} replace />;
        }
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
