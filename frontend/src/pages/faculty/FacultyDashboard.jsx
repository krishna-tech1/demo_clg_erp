import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFacultySubjects } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Award, Users, ArrowRight } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getFacultySubjects()
      .then(data => {
        setSubjects(data.subjects || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
          Welcome back, {user?.full_name}!
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13.5px' }}>
          Here is an overview of your assigned classes and curriculum for the Anna University 2025 Regulation.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Left Side: Profile & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Faculty Profile
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Full Name</span>
                <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{user?.full_name}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Faculty ID / Email</span>
                <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{user?.username} ({user?.email})</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Role</span>
                <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--brand-primary)' }}>Teacher / Faculty</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Quick Stats
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--bg-active)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{subjects.length}</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Assigned Subjects</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Assigned Subjects */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Assigned Subjects ({subjects.length})</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {subjects.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
                No subjects assigned to you yet. Please contact the administrator.
              </p>
            ) : (
              subjects.map(subject => (
                <div 
                  key={subject.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '16px', 
                    background: 'var(--bg-surface-2)', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-color)' 
                  }}
                >
                  <div>
                    <span className="badge badge-info" style={{ marginBottom: '6px' }}>{subject.subject_code}</span>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {subject.subject_name}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Semester {subject.semester_number} | {subject.department_name} | Credits: {subject.credits}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => navigate('/faculty/marks', { state: { selectedSubjectId: subject.id } })}
                      className="btn btn-primary btn-sm"
                    >
                      <ArrowRight size={14} /> Enter Marks
                    </button>
                    <button 
                      onClick={() => navigate('/faculty/obe', { state: { selectedSubjectId: subject.id } })}
                      className="btn btn-secondary btn-sm"
                    >
                      CO-PO Mapping
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
