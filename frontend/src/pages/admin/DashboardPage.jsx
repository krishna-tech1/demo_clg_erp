import { useEffect, useState } from 'react';
import { getDashboardStats } from '../../api/admin';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GraduationCap, Users, BookOpen, Building, CheckCircle, Clock, Calendar, Award, PieChart as PieChartIcon, UserPlus, FileEdit, ClipboardList, FlaskConical, History } from 'lucide-react';

const COLORS = ['#4f46e5', '#ef4444'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of the College system</p>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="stats-grid">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="stat-card">
            <div className="skeleton skeleton-avatar" style={{ width: '40px', height: '40px' }}></div>
            <div className="stat-info" style={{ width: '60%' }}>
              <div className="skeleton skeleton-title" style={{ width: '40px', height: '24px', marginBottom: '8px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px' }}>
        <div className="card">
          <div className="card-header">
            <div className="skeleton skeleton-title" style={{ width: '120px' }}></div>
          </div>
          <div className="card-body" style={{ display:'flex', alignItems:'center', justifyContent:'center', height: '200px' }}>
            <div className="skeleton skeleton-avatar" style={{ width: '120px', height: '120px' }}></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="skeleton skeleton-title" style={{ width: '100px' }}></div>
          </div>
          <div className="card-body">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="skeleton skeleton-button" style={{ width: '100%', height: '44px' }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const pieData = stats ? [
    { name: 'Pass', value: stats.stats.passCount || 0 },
    { name: 'Fail', value: stats.stats.failCount || 0 },
  ] : [];

  const statCards = [
    { label: 'Total Students', value: stats?.stats.students || 0, icon: <GraduationCap size={24} />, color: 'blue' },
    { label: 'Faculty Members', value: stats?.stats.faculty || 0, icon: <Users size={24} />, color: 'purple' },
    { label: 'Subjects', value: stats?.stats.subjects || 0, icon: <BookOpen size={24} />, color: 'green' },
    { label: 'Departments', value: stats?.stats.departments || 0, icon: <Building size={24} />, color: 'orange' },
    { label: 'Published Results', value: stats?.stats.publishedResults || 0, icon: <CheckCircle size={24} />, color: 'teal' },
    { label: 'Pending Results', value: stats?.stats.pendingResults || 0, icon: <Clock size={24} />, color: 'yellow' },
    { label: 'Upcoming Exams', value: stats?.stats.upcomingExams || 0, icon: <Calendar size={24} />, color: 'indigo' },
    { label: 'Pass Count', value: stats?.stats.passCount || 0, icon: <Award size={24} />, color: 'green' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of the College system</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map(card => (
          <div key={card.label} className="stat-card">
            <div className={`stat-icon ${card.color}`}>{card.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px' }}>
        {/* Pass/Fail Pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Result Overview</div>
              <div className="card-subtitle">Published results breakdown</div>
            </div>
          </div>
          <div className="card-body" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            {(stats?.stats.passCount || 0) + (stats?.stats.failCount || 0) === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><PieChartIcon size={32} /></div>
                <h3>No results yet</h3>
                <p>Publish results to see statistics</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Quick Actions</div>
          </div>
          <div className="card-body">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {[
                { label: 'Add Student', icon: <UserPlus size={18} />, path: '/admin/students' },
                { label: 'Add Faculty', icon: <UserPlus size={18} />, path: '/admin/faculty' },
                { label: 'Exam Schedule', icon: <Calendar size={18} />, path: '/admin/exam-schedule' },
                { label: 'Enter Marks', icon: <FileEdit size={18} />, path: '/admin/marks' },
                { label: 'Publish Results', icon: <ClipboardList size={18} />, path: '/admin/results' },
                { label: 'OBE Report', icon: <FlaskConical size={18} />, path: '/admin/obe' },
              ].map(action => (
                <a key={action.label} href={action.path}
                  style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px', background:'var(--bg-surface-2)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-color)', fontSize:'12.5px', fontWeight:'500', color:'var(--text-primary)', textDecoration:'none', transition:'all 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <span style={{ display:'flex', alignItems:'center' }}>{action.icon}</span>
                  {action.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Activity</div>
            <div className="card-subtitle">Latest system actions</div>
          </div>
        </div>
        <div className="table-container">
          {!stats?.recentActivity?.length ? (
            <div className="empty-state">
              <div className="empty-state-icon"><History size={32} /></div>
              <h3>No activity yet</h3>
              <p>System actions will appear here</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.map(log => (
                  <tr key={log.id}>
                    <td><span className="badge badge-info">{log.action}</span></td>
                    <td style={{ color:'var(--text-secondary)' }}>{log.entity_type || '—'}</td>
                    <td style={{ color:'var(--text-secondary)', maxWidth:'300px' }} className="truncate">{log.details || '—'}</td>
                    <td style={{ color:'var(--text-tertiary)', fontSize:'12px' }}>
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
