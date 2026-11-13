import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Hash, Lock, Eye, EyeOff, AlertTriangle, ShieldAlert } from 'lucide-react';
import { API_BASE_URL } from '../config';
const Login = () => {
    const navigate = useNavigate();
    const [controlId, setControlId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    controlId: controlId,
                    password: password
                }),
            });
            const data = await response.json();
            if (response.ok) {
                sessionStorage.setItem('access_token', data.token);
                sessionStorage.setItem('user_role', data.user.role);
                sessionStorage.setItem('must_change_password', String(data.must_change_password));

                if (data.must_change_password) {
                    navigate('/change-password');
                    return;
                }

                if (data.user.role === 'mao') {
                    navigate('/mao/dashboard');
                } else if (data.user.role === 'farmer') {
                    navigate('/farmer/dashboard');
                }
            } else {
                setError(data.error || data.detail || 'Invalid username or password.');
            }
        } catch {
            setError('Failed to connect to the server. Is Django running?');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="login-wrapper">
            <div className="form-container">
                <div className="login-header-logo">
                    <Sprout size={48} className="logo-icon" />
                    <h2>SoilSense</h2>
                </div>
                <p className="subtitle">Precision Agriculture for Rice Farmers in Unisan, Quezon</p>
                <form id="loginForm" onSubmit={handleSubmit}>
                    {error && (
                        <div 
                            className={`p-3.5 mb-4 rounded-xl text-xs flex items-start gap-2.5 text-left border ${
                                error.includes('locked') || error.includes('throttled')
                                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                                    : 'bg-rose-50 border-rose-300 text-rose-800'
                            }`}
                            role="alert"
                        >
                            {error.includes('locked') || error.includes('throttled') ? (
                                <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" />
                            ) : (
                                <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <span className="font-medium leading-relaxed">{error}</span>
                        </div>
                    )}
                    <div className="form-group input-with-icon">
                        <label>Control ID</label>
                        <div className="input-icon-wrapper">
                            <Hash className="input-icon" size={20} />
                            <input 
                                type="text" 
                                placeholder="e.g. UN-2026-001" 
                                value={controlId}
                                onChange={(e) => setControlId(e.target.value.toUpperCase())}
                                autoCapitalize="characters"
                                autoCorrect="off"
                                spellCheck="false"
                                style={{ paddingLeft: '48px' }}
                                required 
                            />
                        </div>
                    </div>
                    <div className="form-group input-with-icon">
                        <label>Password</label>
                        <div className="input-icon-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                                required 
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn-submit" disabled={isLoading}>
                        {isLoading ? 'Connecting to Server...' : 'Login to Dashboard'}
                    </button>
                </form>
                <div className="login-footer">
                    <p>&copy; 2026 SoilSense Capstone Project</p>
                </div>
            </div>
        </div>
    );
};
export default Login;
