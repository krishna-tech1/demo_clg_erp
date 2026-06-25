import { useState, useEffect } from 'react';
import { getStudentInternalMarks } from '../../api/admin';
import { ClipboardCheck, AlertTriangle } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function StudentInternalMarks() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentInternalMarks()
      .then(data => {
        setMarks(data.marks || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Internal Marks</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13.5px' }}>View model exam marks and continuous assessment scoring.</p>
        </div>
        <SkeletonLoader type="table" count={5} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
          Internal Assessment Marks
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13.5px' }}>
          View your continuous assessment marks, model exams, and practical score details.
        </p>
      </div>

      {marks.length === 0 ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--brand-warning)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>No Subject Registrations</h3>
          <p style={{ color: 'var(--text-tertiary)', maxWidth: '400px' }}>
            No registered subjects were found for your current semester curriculum.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardCheck size={18} style={{ color: 'var(--brand-primary)' }} />
              Internal Assessment Report (Weightage: 40 Marks)
            </span>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Credits</th>
                    <th style={{ textAlign: 'center' }}>Model Exam 1 (100)</th>
                    <th style={{ textAlign: 'center' }}>Model Exam 2 (100)</th>
                    <th style={{ textAlign: 'center' }}>Practical Marks (100)</th>
                    <th style={{ textAlign: 'center' }}>Internal Assessment (/40)</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((m, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>{m.subject_code}</td>
                      <td style={{ fontWeight: '500' }}>{m.subject_name}</td>
                      <td>{m.credits}</td>
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>
                        {m.model1_marks !== null ? parseFloat(m.model1_marks).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>
                        {m.model2_marks !== null ? parseFloat(m.model2_marks).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>
                        {m.practical_marks !== null ? parseFloat(m.practical_marks).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--brand-primary)', fontSize: '14px' }}>
                        {m.internal_total !== null ? parseFloat(m.internal_total).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
