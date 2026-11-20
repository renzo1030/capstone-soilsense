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
import Layout from './components/Layout';
import useIdleTimer from './hooks/useIdleTimer';

import { Toaster } from 'react-hot-toast';

// Inner component so useNavigate (required by useIdleTimer) has Router context
function AppRoutes() {
  useIdleTimer(15 * 60 * 1000); // 15-minute idle auto-logout

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 5000,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            fontSize: '13.5px',
            fontWeight: '500',
            padding: '14px 18px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            maxWidth: '440px',
          },
          success: {
            style: {
              borderLeft: '5px solid #059669',
            },
            iconTheme: {
              primary: '#059669',
              secondary: '#ffffff',
            },
          },
          error: {
            style: {
              borderLeft: '5px solid #e11d48',
            },
            iconTheme: {
              primary: '#e11d48',
              secondary: '#ffffff',
            },
          },
        }}
      />
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
            <Layout role="farmer">
              <FarmerDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/farmer/history" element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <Layout role="farmer">
              <FarmerHistory />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/mao/dashboard" element={
          <ProtectedRoute allowedRoles={['mao']}>
            <Layout role="mao">
              <MaoDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/mao/devices" element={
          <ProtectedRoute allowedRoles={['mao']}>
            <Layout role="mao">
              <MaoDevices />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/mao/history" element={
          <ProtectedRoute allowedRoles={['mao']}>
            <Layout role="mao">
              <MaoHistory />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/mao/register-farmer" element={
          <ProtectedRoute allowedRoles={['mao']}>
            <Layout role="mao">
              <MaoRegisterFarmer />
            </Layout>
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
