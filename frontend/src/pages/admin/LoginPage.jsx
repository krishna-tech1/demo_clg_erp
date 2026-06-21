import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { adminLogin } from '../../api/admin';
import { GraduationCap, User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      const data = await adminLogin(username, password);
      login(data.token, data.admin);
      toast.success(`Welcome back, ${data.admin.full_name}!`);
      navigate('/admin/dashboard');
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
          <h1>Examination System</h1>
          <p>Anna University Regulation 2025</p>
        </div>

        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Admin Portal
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Sign in to manage examination operations
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-tertiary)', fontSize:'16px', display:'flex' }}>
                <User size={18} />
              </span>
              <input
                id="username"
                className="form-control"
                type="text"
                placeholder="Enter username"
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
            Demo Credentials
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>User: <strong style={{ color: 'var(--brand-primary)' }}>admin</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>Pass: <strong style={{ color: 'var(--brand-primary)' }}>12341234</strong></span>
          </div>
        </div>

        <p style={{ marginTop: '20px', fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          Department of Examinations • Version 1.0
        </p>
      </div>
    </div>
  );
}
