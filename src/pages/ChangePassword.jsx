import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Live password complexity criteria checks
    const criteria = [
        { label: 'At least 8 characters', met: formData.new_password.length >= 8 },
        { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(formData.new_password) },
        { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(formData.new_password) },
        { label: 'One digit (0-9)', met: /\d/.test(formData.new_password) },
        { label: 'One special symbol (@$!%*?&# etc.)', met: /[@$!%*?&#^()_\-+=\[\]{}|:;,<.>]/.test(formData.new_password) }
    ];

    const allCriteriaMet = criteria.every(c => c.met);
    const passwordsMatch = formData.new_password && formData.confirm_password && formData.new_password === formData.confirm_password;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!allCriteriaMet) {
            setError('Please satisfy all password complexity requirements.');
            return;
        }

        if (formData.new_password !== formData.confirm_password) {
            setError('New password and confirmation do not match.');
            return;
        }

        if (formData.new_password === 'Farmer123') {
            setError('You cannot reuse the temporary default password.');
            return;
        }

        setIsLoading(true);
        const token = sessionStorage.getItem('access_token');
        const userRole = sessionStorage.getItem('user_role');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/change-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Password updated successfully! Welcome to SoilSense.');
                sessionStorage.setItem('must_change_password', 'false');

                if (userRole === 'mao') {
                    navigate('/mao/dashboard', { replace: true });
                } else {
                    navigate('/farmer/dashboard', { replace: true });
                }
            } else {
                if (Array.isArray(data.error)) {
                    setError(data.error.join(' '));
                } else {
                    setError(data.error || 'Failed to update password. Please check your inputs.');
                }
            }
        } catch {
            setError('Failed to connect to the server. Is Django running?');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="form-container" style={{ maxWidth: '440px' }}>
                <div className="login-header-logo">
                    <ShieldCheck size={48} className="logo-icon text-emerald-600" />
                    <h2>Setup New Password</h2>
                </div>
                <p className="subtitle">
                    For your account security, you must replace your temporary default password before continuing to your dashboard.
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Current Temporary Password */}
                    <div className="form-group input-with-icon">
                        <label>Current Temporary Password</label>
                        <div className="input-icon-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input 
                                type={showOldPassword ? "text" : "password"} 
                                placeholder="e.g. Farmer123" 
                                value={formData.old_password}
                                onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                                required 
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                aria-label={showOldPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="form-group input-with-icon">
                        <label>New Password</label>
                        <div className="input-icon-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input 
                                type={showNewPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                value={formData.new_password}
                                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                                required 
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                aria-label={showNewPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Live Criteria Checklist */}
                    <div className="p-3 mb-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1.5 text-left">
                        <p className="font-semibold text-gray-700 mb-1">Password Requirements:</p>
                        {criteria.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                {c.met ? (
                                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                ) : (
                                    <XCircle size={15} className="text-gray-400 shrink-0" />
                                )}
                                <span className={c.met ? 'text-emerald-700 font-medium' : 'text-gray-500'}>
                                    {c.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Confirm New Password */}
                    <div className="form-group input-with-icon">
                        <label>Confirm New Password</label>
                        <div className="input-icon-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                value={formData.confirm_password}
                                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                                required 
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {formData.confirm_password && (
                            <div className="text-xs mt-1 text-left">
                                {passwordsMatch ? (
                                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                                        <CheckCircle2 size={13} /> Passwords match
                                    </span>
                                ) : (
                                    <span className="text-rose-600 font-medium flex items-center gap-1">
                                        <XCircle size={13} /> Passwords do not match
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button 
                        type="submit" 
                        className="btn-submit mt-3" 
                        disabled={isLoading || !allCriteriaMet || !passwordsMatch}
                    >
                        {isLoading ? 'Securing Account...' : 'Set Password & Enter Dashboard'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>&copy; 2026 SoilSense Capstone Project</p>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
