import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Logout from './pages/Logout';
import ChangePassword from './pages/ChangePassword';
import FarmerDashboard from './pages/FarmerDashboard';
import FarmerHistory from './pages/FarmerHistory';
import MaoDashboard from './pages/MaoDashboard';
import MaoDevices from './pages/MaoDevices';
import MaoHistory from './pages/MaoHistory';
import MaoRegisterFarmer from './pages/MaoRegisterFarmer';
import ProtectedRoute from './components/ProtectedRoute';
import useIdleTimer from './hooks/useIdleTimer';

import { Toaster } from 'react-hot-toast';

// Inner component so useNavigate (required by useIdleTimer) has Router context
function AppRoutes() {
  useIdleTimer(15 * 60 * 1000); // 15-minute idle auto-logout

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/change-password" element={
          <ProtectedRoute allowedRoles={['farmer', 'mao']}>
            <ChangePassword />
          </ProtectedRoute>
        } />

        <Route path="/farmer/dashboard" element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <FarmerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/farmer/history" element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <FarmerHistory />
          </ProtectedRoute>
        } />
        <Route path="/mao/dashboard" element={
          <ProtectedRoute allowedRoles={['mao']}>
            <MaoDashboard />
          </ProtectedRoute>
        } />
        <Route path="/mao/devices" element={
          <ProtectedRoute allowedRoles={['mao']}>
            <MaoDevices />
          </ProtectedRoute>
        } />
        <Route path="/mao/history" element={
          <ProtectedRoute allowedRoles={['mao']}>
            <MaoHistory />
          </ProtectedRoute>
        } />
        <Route path="/mao/register-farmer" element={
          <ProtectedRoute allowedRoles={['mao']}>
            <MaoRegisterFarmer />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
export default App;
