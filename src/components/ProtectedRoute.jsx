import { Navigate } from 'react-router-dom';
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = sessionStorage.getItem('access_token');
    const userRole = sessionStorage.getItem('user_role');
    if (!token) {
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
