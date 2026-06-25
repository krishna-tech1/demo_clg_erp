import { useState, useEffect } from 'react';
import { getStudentHallTicket } from '../../api/admin';
import { Calendar, Clock, MapPin, BookOpen, FileText } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function StudentTimetable() {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStudentHallTicket()
      .then(data => {
        setTimetableData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Failed to load timetable.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Semester Exam Timetable
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13.5px' }}>
            View your upcoming semester exam schedule. All details are synchronized with the university controller office.
          </p>
        </div>
        <SkeletonLoader type="timetable" count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Calendar size={48} style={{ color: 'var(--brand-danger)' }} />
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Timetable Unavailable</h3>
        <p style={{ color: 'var(--text-tertiary)', maxWidth: '400px' }}>
          {error}
        </p>
      </div>
    );
  }

  const { student, schedules = [] } = timetableData || {};

  // Separate scheduled and unscheduled exams
  const scheduledExams = schedules.filter(s => s.exam_date !== null);
  const unscheduledExams = schedules.filter(s => s.exam_date === null);

  // Sort scheduled exams chronologically
  scheduledExams.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
          Semester Exam Timetable
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13.5px' }}>
          View your upcoming semester exam schedule. All details are synchronized with the university controller office.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Schedule Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} className="text-brand" /> Exam Timeline
            </h3>

            {scheduledExams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
                <Calendar size={36} style={{ strokeWidth: 1.5, marginBottom: '12px', opacity: 0.7 }} />
                <p style={{ fontSize: '14px', fontWeight: '500' }}>No exams scheduled yet</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Once the administration publishes the timetable, it will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border-color)' }}>
                {scheduledExams.map((exam, idx) => {
                  const examDateObj = new Date(exam.exam_date);
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        position: 'relative', 
                        padding: '16px', 
                        background: 'var(--bg-surface-2)', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {/* Timeline dot */}
                      <div style={{ 
                        position: 'absolute', 
                        left: '-29px', 
                        top: '24px', 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        background: 'var(--brand-primary)', 
                        border: '4px solid var(--bg-surface)',
                      }}></div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <span className="badge badge-purple" style={{ marginBottom: '6px' }}>{exam.subject_code}</span>
                          <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{exam.subject_name}</h4>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '120px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--brand-primary)' }}>
                            {examDateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} style={{ color: 'var(--brand-secondary)' }} />
                          <span>Session: <strong>{exam.session}</strong> {exam.start_time ? `(${exam.start_time.slice(0, 5)} - ${exam.end_time.slice(0, 5)})` : ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} style={{ color: 'var(--brand-secondary)' }} />
                          <span>Venue: <strong>{exam.venue || 'Main Block Exam Hall'}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BookOpen size={14} style={{ color: 'var(--brand-secondary)' }} />
                          <span>Credits: {exam.credits}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>Student Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Register Number</span>
                <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{student?.register_number}</p>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Department</span>
                <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{student?.department_name}</p>
              </div>
            </div>
          </div>

          {unscheduledExams.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} /> Pending Schedules ({unscheduledExams.length})
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                Exams for these subjects are not scheduled by the admin yet:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {unscheduledExams.map((exam, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '500', color: 'var(--text-primary)' }}>{exam.subject_name}</span>
                    <code style={{ fontSize: '11px', color: 'var(--brand-primary)' }}>{exam.subject_code}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
