import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Hash, Lock, Eye, EyeOff } from 'lucide-react';
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
                localStorage.setItem('access_token', data.token);
                localStorage.setItem('user_role', data.user.role);
                if (data.user.role === 'mao') {
                    navigate('/mao/dashboard');
                } else if (data.user.role === 'farmer') {
                    navigate('/farmer/dashboard');
                }
            } else {
                setError(data.error || 'Invalid credentials.');
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
                    {error && <div className="error-message">{error}</div>}
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
