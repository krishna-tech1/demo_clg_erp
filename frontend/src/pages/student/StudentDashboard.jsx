import { useState, useEffect } from 'react';
import { getStudentProfile } from '../../api/admin';
import { BookOpen, User, Calendar, Award } from 'lucide-react';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentProfile()
      .then(data => {
        setProfile(data.student);
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
          Welcome, {profile?.full_name}!
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13.5px' }}>
          Here is your academic dashboard for Anna University Regulation 2025.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Left column - profile card */}
        <div className="card" style={{ padding: '20px', height: 'fit-content' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div className="admin-avatar" style={{ width: '64px', height: '64px', fontSize: '24px', margin: '0 auto 12px' }}>
              {profile?.full_name?.charAt(0) || 'S'}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{profile?.full_name}</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Reg No: {profile?.register_number}</p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Department</span>
              <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{profile?.department_name} ({profile?.dept_code})</p>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Current Semester</span>
              <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Semester {profile?.semester_number}</p>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Academic Year</span>
              <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{profile?.academic_year}</p>
            </div>
            {profile?.email && (
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Email</span>
                <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{profile?.email}</p>
              </div>
            )}
            {profile?.phone && (
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Phone</span>
                <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{profile?.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - enrolled subjects */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Currently Enrolled Subjects ({subjects.length})
            </h3>
            
            {subjects.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
                You are not enrolled in any subjects for this semester.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {subjects.map(subject => (
                  <div 
                    key={subject.id} 
                    style={{ 
                      padding: '16px', 
                      background: 'var(--bg-surface-2)', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <span className="badge badge-purple" style={{ marginBottom: '8px' }}>{subject.subject_code}</span>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {subject.subject_name}
                      </h4>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '12px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>Type: {subject.subject_type.toUpperCase()}</span>
                      <span>Credits: {subject.credits}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
