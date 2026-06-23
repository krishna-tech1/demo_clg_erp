import { useState, useEffect } from 'react';
import { getStudentResults } from '../../api/admin';
import { Award, AlertTriangle, FileCheck } from 'lucide-react';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentResults()
      .then(data => {
        setResults(data.results || []);
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

  // Calculate GPA if results are published
  const calculateGPA = () => {
    if (results.length === 0) return '0.00';
    
    // Grade points mapping
    const gradePoints = {
      'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5,
      'S': 10, 'U': 0, 'RA': 0, 'W': 0
    };

    let totalPoints = 0;
    let totalCredits = 0;

    results.forEach(r => {
      const g = r.grade?.trim().toUpperCase();
      const points = gradePoints[g] !== undefined ? gradePoints[g] : 0;
      totalPoints += points * (r.credits || 3);
      totalCredits += (r.credits || 3);
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
          Semester Examination Results
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13.5px' }}>
          Official grade statement sheet for published university examinations.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--brand-warning)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Results Not Published</h3>
          <p style={{ color: 'var(--text-tertiary)', maxWidth: '400px' }}>
            Your semester results have not been published yet. Please check back later or contact the administration.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* GPA Card */}
          <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-surface-2))' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--bg-active)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                  <Award size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Semester GPA</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Based on currently published subjects</p>
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--brand-primary)' }}>
                {calculateGPA()}
              </div>
            </div>
          </div>

          {/* Detailed Grades Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Grade Statement</span>
            </div>
            <div className="card-body">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                      <th>Credits</th>
                      <th>Internal (40)</th>
                      <th>External (60)</th>
                      <th>Total (100)</th>
                      <th>Grade</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>{r.subject_code}</td>
                        <td style={{ fontWeight: '500' }}>{r.subject_name}</td>
                        <td>{r.credits}</td>
                        <td>{parseFloat(r.internal_total).toFixed(1)}</td>
                        <td>{parseFloat(r.external_total).toFixed(1)}</td>
                        <td style={{ fontWeight: '600' }}>{parseFloat(r.final_score).toFixed(0)}</td>
                        <td style={{ fontWeight: '700', color: r.grade === 'U' || r.grade === 'RA' ? 'var(--text-danger)' : 'var(--text-success)' }}>
                          {r.grade || 'U'}
                        </td>
                        <td>
                          <span className={`badge ${r.pass_fail?.toLowerCase() === 'pass' ? 'badge-success' : 'badge-danger'}`}>
                            {r.pass_fail || 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
