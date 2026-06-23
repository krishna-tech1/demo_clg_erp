import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { userLogin } from '../../api/admin';
import { GraduationCap, User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin'); // 'admin', 'faculty', 'student'
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { id: 'admin', label: 'Admin' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'student', label: 'Student' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      const data = await userLogin(username, password, role);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.full_name}!`);
      
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'faculty') {
        navigate('/faculty/dashboard');
      } else if (role === 'student') {
        navigate('/student/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon"><GraduationCap size={40} /></div>
          <h1>College ERP System</h1>
          <p>Anna University Regulation 2025</p>
        </div>

        {/* Segmented Control Role Selector */}
        <div style={{ 
          display: 'flex', 
          background: 'var(--bg-surface-2)', 
          padding: '4px', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-color)', 
          marginBottom: '24px' 
        }}>
          {roles.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setRole(r.id);
                // Clear fields on switch to prevent confusion
                setUsername('');
                setPassword('');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: role === r.id ? 'var(--brand-primary)' : 'transparent',
                color: role === r.id ? 'white' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'all var(--transition-fast)'
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {role.charAt(0).toUpperCase() + role.slice(1)} Portal
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Sign in as {role} to access your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {role === 'admin' ? 'Username' : role === 'faculty' ? 'Faculty ID / Email' : 'Register Number / Email'}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-tertiary)', fontSize:'16px', display:'flex' }}>
                <User size={18} />
              </span>
              <input
                id="username"
                className="form-control"
                type="text"
                placeholder={role === 'admin' ? 'Enter username' : role === 'faculty' ? 'Enter faculty ID or email' : 'Enter register number or email'}
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ paddingLeft: '38px' }}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-tertiary)', fontSize:'16px', display:'flex' }}>
                <Lock size={18} />
              </span>
              <input
                id="password"
                className="form-control"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '38px', paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', fontSize:'16px', padding:'2px', display:'flex' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
            style={{ marginTop: '8px', justifyContent: 'center' }}
          >
            {loading ? <><span className="spinner" style={{ width:'16px', height:'16px', borderWidth:'2px' }}></span> Signing in...</> : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '14px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: '6px', fontWeight: '600' }}>
            Demo Login Info
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', alignItems: 'center' }}>
            {role === 'admin' && (
              <span style={{ color: 'var(--text-secondary)' }}>User: <strong style={{ color: 'var(--brand-primary)' }}>admin</strong> | Pass: <strong style={{ color: 'var(--brand-primary)' }}>12341234</strong></span>
            )}
            {role === 'faculty' && (
              <span style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Create a Faculty in Admin Portal first to log in here. (Default password is the Faculty ID)</span>
            )}
            {role === 'student' && (
              <span style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Create a Student in Admin Portal first to log in here. (Default password is the Register Number)</span>
            )}
          </div>
        </div>

        <p style={{ marginTop: '20px', fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          College Administration • Version 1.0
        </p>
      </div>
    </div>
  );
}


