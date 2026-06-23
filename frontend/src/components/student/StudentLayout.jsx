import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';

import { 
  LayoutDashboard, Ticket, ClipboardList, LogOut, 
  Sun, Moon, ChevronRight, ChevronLeft, GraduationCap, Calendar
} from 'lucide-react';

const NAV_ITEMS = [
  { section: 'Overview', items: [
    { path: '/student/dashboard', label: 'Student Dashboard', icon: <LayoutDashboard size={18} /> },
  ]},
  { section: 'Assessment', items: [
    { path: '/student/timetable', label: 'Exam Timetable', icon: <Calendar size={18} /> },
    { path: '/student/hall-ticket', label: 'Hall Ticket', icon: <Ticket size={18} /> },
    { path: '/student/results', label: 'Results', icon: <ClipboardList size={18} /> },
  ]},
];

export default function StudentLayout({ children, collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/admin/login');
  };

  const currentPage = NAV_ITEMS.flatMap(s => s.items).find(i => location.pathname.startsWith(i.path));

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><GraduationCap size={24} /></div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <h1>College Portal</h1>
              <p>Student Portal</p>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(section => (
            <div key={section.section} className="nav-section">
              {!collapsed && <div className="nav-section-label">{section.section}</div>}
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px', borderRadius:'var(--radius-md)', background:'var(--bg-hover)', marginBottom:'8px' }}>
              <div className="admin-avatar" style={{ width:'32px', height:'32px', fontSize:'12px' }}>
                {user?.full_name?.charAt(0) || 'S'}
              </div>
              <div style={{ flex:1, overflow:'hidden' }}>
                <div style={{ fontSize:'12.5px', fontWeight:'600', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user?.full_name || 'Student'}
                </div>
                <div style={{ fontSize:'11px', color:'var(--text-tertiary)' }}>{user?.username || 'Student'}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="nav-item"
            title={collapsed ? 'Logout' : undefined}
            style={{ color:'var(--text-danger)', width:'100%' }}
          >
            <span className="nav-icon"><LogOut size={18} /></span>
            {!collapsed && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Header */}
      <header className={`admin-header${collapsed ? ' collapsed' : ''}`}>
        <div className="header-left">
          <button
            className="btn-icon"
            onClick={() => setCollapsed(c => !c)}
            title="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <div>
            <div className="header-title">{currentPage?.label || 'Student Panel'}</div>
            <div className="header-subtitle">College ERP System • Anna University 2025</div>
          </div>
        </div>

        <div className="header-right">
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div className="admin-avatar" title={user?.full_name}>
            {user?.full_name?.charAt(0) || 'S'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`admin-main${collapsed ? ' collapsed' : ''}`}>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
