import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, loading }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div style={{
                background: 'var(--card-bg, #1a1f2e)',
                border: '1px solid rgba(255,80,80,0.35)',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '420px',
                width: '90%',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                animation: 'slideUp 0.25s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                        background: 'rgba(255,80,80,0.15)',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex'
                    }}>
                        <AlertTriangle size={22} color="#ff5050" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary, #fff)' }}>
                        {title}
                    </h3>
                    <button
                        onClick={onCancel}
                        style={{
                            marginLeft: 'auto', background: 'none', border: 'none',
                            cursor: 'pointer', color: 'var(--text-secondary, #aaa)',
                            padding: '4px', borderRadius: '6px'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
                <p style={{ margin: '0 0 28px', color: 'var(--text-secondary, #aaa)', lineHeight: 1.6 }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            padding: '10px 20px', borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'transparent',
                            color: 'var(--text-primary, #fff)',
                            cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: '10px 24px', borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #ff4444, #cc2222)',
                            color: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            opacity: loading ? 0.7 : 1,
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {loading ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
