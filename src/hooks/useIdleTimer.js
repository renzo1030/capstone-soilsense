import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useIdleTimer — Auto-logout hook for inactivity detection.
 *
 * Monitors user interaction events (mouse, keyboard, scroll, touch).
 * After `timeoutMs` milliseconds of inactivity the hook:
 *   1. Clears all sessionStorage tokens.
 *   2. Redirects to /login?reason=idle_timeout.
 *
 * @param {number} timeoutMs  Idle threshold in ms (default: 900 000 = 15 min)
 */
const useIdleTimer = (timeoutMs = 15 * 60 * 1000) => {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // ── Logout action ──────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user_role');
    navigate('/login?reason=idle_timeout', { replace: true });
  }, [navigate]);

  // ── Reset the countdown on any user activity ───────────────────
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, timeoutMs);
  }, [handleLogout, timeoutMs]);

  useEffect(() => {
    // Only run when the user is actually authenticated
    const token = sessionStorage.getItem('access_token');
    if (!token) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    // Attach listeners
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    // Start the initial countdown
    resetTimer();

    return () => {
      // Cleanup on unmount
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [resetTimer]);
};

export default useIdleTimer;

