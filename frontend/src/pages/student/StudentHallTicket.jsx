import { useState, useEffect } from 'react';
import { getStudentHallTicket } from '../../api/admin';
import { Ticket, Printer, AlertTriangle } from 'lucide-react';

export default function StudentHallTicket() {
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentHallTicket()
      .then(data => {
        setTicketData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  const { student, schedules = [] } = ticketData || {};

  // Check if there are scheduled exams
  const hasSchedules = schedules.some(s => s.exam_date !== null);

  return (
    <div>
      {/* Printable Area Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-hall-ticket, #printable-hall-ticket * {
            visibility: visible;
          }
          #printable-hall-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 24px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Semester Examination Hall Ticket
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13.5px' }}>
            Verify your exam schedules and download/print your official hall ticket.
          </p>
        </div>
        {hasSchedules && (
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} /> Print Hall Ticket
          </button>
        )}
      </div>

      {!hasSchedules ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--brand-warning)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>No Exams Scheduled</h3>
          <p style={{ color: 'var(--text-tertiary)', maxWidth: '400px' }}>
            The examination schedule has not been published for your current semester yet. Please check back later or contact college admin.
          </p>
        </div>
      ) : (
        <div id="printable-hall-ticket" className="card" style={{ padding: '30px', background: 'var(--bg-surface)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', paddingBottom: '20px', borderBottom: '2px solid var(--border-color)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              Anna University Affiliated College
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
              SEMESTER EXAMINATIONS HALL TICKET - APRIL/MAY 2026
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Regulation 2025 Curriculum Framework
            </p>
          </div>

          {/* Student Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '30px', background: 'var(--bg-surface-2)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>STUDENT NAME</span>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>{student?.full_name}</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>REGISTER NUMBER</span>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{student?.register_number}</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>DEPARTMENT</span>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{student?.department_name}</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>COLLEGE CODE / NAME</span>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>9999 - DEMO ENGINEERING COLLEGE</p>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <table>
              <thead>
                <tr style={{ background: 'var(--bg-surface-2)' }}>
                  <th style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Subject Code</th>
                  <th style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Subject Name</th>
                  <th style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Exam Date</th>
                  <th style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Session</th>
                  <th style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Venue</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((sched, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>{sched.subject_code}</td>
                    <td style={{ fontWeight: '500' }}>{sched.subject_name}</td>
                    <td>{sched.exam_date ? new Date(sched.exam_date).toLocaleDateString() : 'TBD'}</td>
                    <td>
                      <span className={`badge ${sched.session === 'FN' ? 'badge-info' : 'badge-purple'}`}>
                        {sched.session || 'TBD'}
                      </span>
                    </td>
                    <td>{sched.venue || 'TBD'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px' }}></div>
              <p style={{ borderTop: '1px solid var(--border-color)', width: '150px', paddingTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Candidate Signature
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px' }}></div>
              <p style={{ borderTop: '1px solid var(--border-color)', width: '150px', paddingTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Principal Signature
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px' }}></div>
              <p style={{ borderTop: '1px solid var(--border-color)', width: '180px', paddingTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Controller of Examinations
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
