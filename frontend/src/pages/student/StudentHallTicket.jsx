import { useState, useEffect } from 'react';
import { getStudentHallTicket } from '../../api/admin';
import { Printer, AlertTriangle, User, QrCode } from 'lucide-react';

export default function StudentHallTicket() {
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStudentHallTicket()
      .then(data => {
        setTicketData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Failed to load hall ticket.');
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

  if (error) {
    return (
      <div className="card" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
        <AlertTriangle size={48} style={{ color: 'var(--brand-danger)' }} />
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Access Restricted</h3>
        <p style={{ color: 'var(--text-tertiary)', maxWidth: '400px' }}>
          {error}
        </p>
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
          body {
            background: white !important;
            color: black !important;
          }
          .sidebar, .admin-header, .no-print, header, aside, .theme-toggle {
            display: none !important;
          }
          .admin-layout, .admin-main, .admin-content {
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            transform: none !important;
          }
          #printable-hall-ticket {
            border: 2px solid #1f2937 !important;
            box-shadow: none !important;
            padding: 20px !important;
            margin: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            display: block !important;
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
          <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        <div 
          id="printable-hall-ticket" 
          className="card" 
          style={{ 
            padding: '40px', 
            background: 'white', 
            color: '#111827',
            border: '2px solid #1f2937', 
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-lg)',
            fontFamily: '"Outfit", "Inter", sans-serif',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '3px double #1f2937', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>
                AU
              </div>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '0.5px', margin: 0 }}>
                  ANNA UNIVERSITY AFFILIATED COLLEGE
                </h2>
                <p style={{ fontSize: '13px', color: '#374151', fontWeight: '700', margin: '4px 0 0' }}>
                  OFFICE OF THE CONTROLLER OF EXAMINATIONS
                </p>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>
                  Regulation 2025 Curriculum Framework • Semester Exam Hall Ticket
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <QrCode size={48} style={{ color: '#111827' }} />
                <span style={{ fontSize: '9px', fontWeight: '600', color: '#374151' }}>HT-2026-A</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '6px 16px', borderRadius: '50px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              EXAMINATION HALL TICKET - APRIL/MAY 2026
            </span>
          </div>

          {/* Student Info & Photo Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '24px', marginBottom: '30px' }}>
            {/* Info Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Student Name</span>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', textTransform: 'uppercase', marginTop: '2px' }}>{student?.full_name}</p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Register Number</span>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a8a', marginTop: '2px' }}>{student?.register_number}</p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Department / Branch</span>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginTop: '2px' }}>{student?.department_name}</p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Center Code & Name</span>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginTop: '2px' }}>9999 - DEMO ENGINEERING COLLEGE</p>
              </div>
            </div>

            {/* Photo Box */}
            <div style={{ 
              width: '130px', 
              height: '150px', 
              border: '2px dashed #9ca3af', 
              background: '#f3f4f6', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textAlign: 'center',
              padding: '8px',
              borderRadius: '6px'
            }}>
              <User size={36} style={{ color: '#9ca3af', marginBottom: '8px' }} />
              <span style={{ fontSize: '9px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>
                Affix Passport Size Photo
              </span>
            </div>
          </div>

          {/* Schedule Table */}
          <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', marginBottom: '30px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderRight: '1px solid #e5e7eb' }}>Subject Code</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderRight: '1px solid #e5e7eb' }}>Subject Name</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderRight: '1px solid #e5e7eb' }}>Exam Date</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderRight: '1px solid #e5e7eb' }}>Session</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#374151', textTransform: 'uppercase' }}>Hall / Venue</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((sched, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#1e3a8a', borderRight: '1px solid #e5e7eb' }}>{sched.subject_code}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#111827', borderRight: '1px solid #e5e7eb' }}>{sched.subject_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', borderRight: '1px solid #e5e7eb', fontWeight: '500' }}>
                      {sched.exam_date ? new Date(sched.exam_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                    </td>
                    <td style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        background: sched.session === 'FN' ? '#ecfdf5' : '#f5f3ff', 
                        color: sched.session === 'FN' ? '#047857' : '#6d28d9', 
                        padding: '3px 8px', 
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {sched.session || 'TBD'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', fontWeight: '500' }}>{sched.venue || 'Main Block Hall 1A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Candidate Instructions */}
          <div style={{ background: '#fdf2f8', padding: '16px', borderRadius: '8px', border: '1px dashed #fbcfe8', marginBottom: '40px', fontSize: '11px', color: '#831843' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#9d174d', textTransform: 'uppercase' }}>Instructions to the Candidate:</h4>
            <ol style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Candidates must report at least 30 minutes before the commencement of the exam.</li>
              <li>Candidates will not be allowed to enter the exam hall after 10:00 AM (FN) / 02:00 PM (AN).</li>
              <li>Possession of programmable calculators, mobile phones, or smartwatches is strictly prohibited.</li>
              <li>Must bring this hall ticket and official college ID card to the exam hall daily.</li>
            </ol>
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span style={{ fontStyle: 'italic', color: '#6b7280', fontSize: '12px' }}>[Candidate Sign]</span>
              </div>
              <p style={{ borderTop: '1px solid #1f2937', width: '140px', paddingTop: '8px', fontSize: '11px', fontWeight: '700', color: '#374151', marginTop: '8px' }}>
                Signature of Candidate
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span style={{ fontFamily: '"Great Vibes", cursive', fontSize: '18px', color: '#1e3a8a', transform: 'rotate(-5deg)', display: 'inline-block' }}>Principal</span>
              </div>
              <p style={{ borderTop: '1px solid #1f2937', width: '140px', paddingTop: '8px', fontSize: '11px', fontWeight: '700', color: '#374151', marginTop: '8px' }}>
                Principal Signature
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span style={{ fontFamily: '"Great Vibes", cursive', fontSize: '18px', color: '#1e3a8a', transform: 'rotate(-3deg)', display: 'inline-block' }}>CoE Anna Univ</span>
              </div>
              <p style={{ borderTop: '1px solid #1f2937', width: '180px', paddingTop: '8px', fontSize: '11px', fontWeight: '700', color: '#374151', marginTop: '8px' }}>
                Controller of Examinations
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
