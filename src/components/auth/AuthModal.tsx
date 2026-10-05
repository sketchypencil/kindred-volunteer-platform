import React, { useState, useEffect } from 'react';
import { Mail, Lock, User as UserIcon, Shield, AlertCircle, X, Eye, EyeOff } from 'lucide-react';
import { useVolunteer } from '../../context/VolunteerContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (userData: { id: string; name: string; email: string; role: 'volunteer' | 'admin' }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { registerUser, loginUser } = useVolunteer();

  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'volunteer' | 'admin'>('volunteer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset errors and fields when toggling views or closing
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateEmail = (value: string): boolean => {
    return value.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validatePassword = (value: string): string | null => {
    if (value.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(value)) return 'Password must include at least one uppercase letter (A-Z).';
    if (!/[a-z]/.test(value)) return 'Password must include at least one lowercase letter (a-z).';
    if (!/[0-9]/.test(value)) return 'Password must include at least one number (0-9).';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value))
      return 'Password must include at least one special character (!@#$%^&* etc.).';
    return null;
  };

  const handleToggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict Email Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address containing "@".');
      return;
    }

    // Password rules only enforced during registration
    if (!isLoginView) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    setLoading(true);

    try {
      // The server returns the real user (including the stored role).
      // VolunteerContext already saves it as the current user.
      const result = isLoginView
        ? await loginUser(email, password)
        : await registerUser({ name, email, password, role });

      if (!result.success || !result.user) {
        setError(result.message || 'Authentication failed. Please check your credentials.');
        return;
      }

      onLoginSuccess?.(result.user);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', padding: '2rem', position: 'relative' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#64748b',
          }}
        >
          <X size={20} />
        </button>

        <h2 id="auth-modal-title" style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          {isLoginView ? 'Welcome Back to Kindred' : 'Create an Account'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
          {isLoginView ? 'Sign in to manage your volunteer shifts.' : 'Register to start tracking your community service.'}
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLoginView && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon
                  size={16}
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 2.25rem 0.6rem 2.25rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {!isLoginView && (
              <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
                Requires uppercase, lowercase, number, and special character.
              </p>
            )}
          </div>

          {!isLoginView && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Account Role
              </label>
              <div style={{ position: 'relative' }}>
                <Shield
                  size={16}
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'volunteer' | 'admin')}
                  style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Organizer / Admin</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ marginTop: '0.5rem', width: '100%', padding: '0.65rem' }}
          >
            {loading ? 'Processing...' : isLoginView ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          {isLoginView ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={handleToggleView}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
          >
            {isLoginView ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};