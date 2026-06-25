import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { getStudents, getHallTicket, getDepartments, getSemesters, releaseHallTickets, toggleStudentHallTicket } from '../../api/admin';
import { Search, Ticket, Printer, AlertTriangle, User, QrCode, CheckCircle, XCircle } from 'lucide-react';

export default function HallTicketsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [hallTicket, setHallTicket] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const printRef = useRef();

  const [sortBy, setSortBy] = useState('register_number');
  const [sortOrder, setSortOrder] = useState('asc');

  // Bulk Release States
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [bulkDept, setBulkDept] = useState('');
  const [bulkSem, setBulkSem] = useState('');
  const [releasing, setReleasing] = useState(false);

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    getDepartments()
      .then(d => setDepartments(d.departments || []))
      .catch(() => toast.error('Failed to load departments.'));
  }, []);

  useEffect(() => {
    const params = {};
    if (bulkDept) params.department_id = bulkDept;
    getSemesters(params)
      .then(s => setSemesters(s.semesters || []))
      .catch(() => toast.error('Failed to load semesters.'));
  }, [bulkDept]);

  // Load students by default on mount and when sorting changes
  const loadStudents = (searchVal = '') => {
    setLoading(true);
    getStudents({ search: searchVal, limit: 100, sort_by: sortBy, sort_order: sortOrder })
      .then(d => setStudents(d.students || []))
      .catch(() => toast.error('Failed to load students.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents(search);
  }, [sortBy, sortOrder]);

  const searchStudents = () => {
    loadStudents(search);
  };

  const loadTicket = async (student) => {
    setLoadingTicket(true);
    setHallTicket(null);
    try {
      const data = await getHallTicket(student.id);
      setHallTicket(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleBulkRelease = async (isReleased) => {
    if (!bulkDept && !bulkSem) {
      toast.error('Please select at least a Department or Semester for bulk action.');
      return;
    }
    const actionText = isReleased ? 'Release' : 'Revoke';
    setConfirmModal({
      isOpen: true,
      title: `${actionText} Hall Tickets`,
      message: `Are you sure you want to ${actionText.toLowerCase()} hall tickets for the selected filter?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setReleasing(true);
        try {
          await releaseHallTickets({
            department_id: bulkDept || null,
            semester_id: bulkSem || null,
            is_released: isReleased
          });
          toast.success(`Hall tickets ${isReleased ? 'released' : 'revoked'} successfully.`);
          loadStudents(search);
        } catch (err) {
          toast.error(err.message || 'Failed to update hall tickets.');
        } finally {
          setReleasing(false);
        }
      }
    });
  };

  const handleToggleIndividual = async (studentId, currentStatus) => {
    const nextStatus = !currentStatus;
    try {
      await toggleStudentHallTicket(studentId, { is_released: nextStatus });
      toast.success(`Hall ticket ${nextStatus ? 'released' : 'revoked'} for student.`);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, is_hall_ticket_released: nextStatus } : s));
    } catch (err) {
      toast.error(err.message || 'Failed to toggle status.');
    }
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>Anna University Affiliated College - Exam Hall Ticket</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Outfit', 'Inter', sans-serif;
            margin: 30px;
            color: #111827;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 10px 14px;
            font-size: 13px;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 800;
            color: #374151;
            text-transform: uppercase;
          }
          .badge {
            font-size: 11px; 
            font-weight: 700; 
            padding: 3px 8px; 
            border-radius: 4px;
            display: inline-block;
          }
          .badge-fn {
            background-color: #ecfdf5; 
            color: #047857;
          }
          .badge-an {
            background-color: #f5f3ff; 
            color: #6d28d9;
          }
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="border: 2px solid #1f2937; padding: 40px; border-radius: 8px; max-width: 800px; margin: 0 auto; position: relative;">
          ${content}
        </div>
      </body>
      </html>
    `);
    win.document.close();
    // Wait a brief moment for fonts to load
    setTimeout(() => {
      win.print();
    }, 500);
  };

  const hasSchedules = hallTicket?.schedules && hallTicket.schedules.some(s => s.exam_date !== null);

  return (
    <div>
      <div className="page-header">
        <h2>Hall Ticket Generation & Release</h2>
        <p>Bulk release hall tickets to departments/semesters, toggle individual status, and preview timetables</p>
      </div>

      {/* Bulk Release Panel */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div className="card-title">Bulk Release Hall Tickets</div>
          <div className="card-subtitle">Select a department and/or semester to release/revoke hall tickets in bulk</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="form-control" style={{ minWidth: '220px', flex: 1 }} value={bulkDept} onChange={e => { setBulkDept(e.target.value); setBulkSem(''); }}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
            <select className="form-control" style={{ minWidth: '220px', flex: 1 }} value={bulkSem} onChange={e => setBulkSem(e.target.value)}>
              <option value="">All Semesters</option>
              {semesters.map(s => <option key={s.id} value={s.id}>Semester {s.semester_number} ({s.academic_year})</option>)}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" onClick={() => handleBulkRelease(true)} disabled={releasing} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} /> Release Bulk
              </button>
              <button className="btn btn-secondary" onClick={() => handleBulkRelease(false)} disabled={releasing} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <XCircle size={16} /> Revoke Bulk
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <span className="search-icon"><Search size={16} /></span>
              <input
                className="form-control"
                placeholder="Search by student name or register number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchStudents()}
              />
            </div>
            <select className="form-control" style={{ width: '140px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="register_number">Register No.</option>
              <option value="full_name">Student Name</option>
            </select>
            <select className="form-control" style={{ width: '130px' }} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            <button className="btn btn-primary" onClick={searchStudents} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {loading ? 'Searching...' : <><Search size={16} /> Search</>}
            </button>
          </div>

          {loading ? (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '60%' }}>
                    <div className="skeleton skeleton-title" style={{ width: '120px', height: '14px', marginBottom: '6px' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="skeleton skeleton-badge" style={{ width: '80px' }}></div>
                    <div className="skeleton skeleton-button" style={{ width: '60px' }}></div>
                    <div className="skeleton skeleton-button" style={{ width: '60px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : students.length > 0 ? (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>{students.length} student(s) found</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                {students.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', transition: 'border-color 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{s.full_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {s.register_number} &nbsp;•&nbsp; {s.dept_code || s.department_name} &nbsp;•&nbsp; Semester {s.semester_number}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`badge ${s.is_hall_ticket_released ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: '11px', fontWeight: '600' }}>
                        {s.is_hall_ticket_released ? 'Released' : 'Not Released'}
                      </span>
                      <button 
                        className={`btn ${s.is_hall_ticket_released ? 'btn-secondary' : 'btn-primary'} btn-sm`} 
                        onClick={() => handleToggleIndividual(s.id, s.is_hall_ticket_released)}
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        {s.is_hall_ticket_released ? 'Revoke' : 'Release'}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => loadTicket(s)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Ticket size={14} /> View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--text-tertiary)', padding: '10px' }}>
              No students found.
            </div>
          )}
        </div>
      </div>

      {/* Hall Ticket Preview */}
      {loadingTicket && (
        <div className="skeleton-card" style={{ marginTop: '24px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div className="skeleton skeleton-avatar" style={{ width: '80px', height: '80px' }}></div>
          <div className="skeleton skeleton-title" style={{ width: '150px', height: '20px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '60%', height: '14px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '40%', height: '14px' }}></div>
          <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '20px 0' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '90%', height: '12px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '90%', height: '12px' }}></div>
        </div>
      )}

      {hallTicket && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Ticket size={18} /> Hall Ticket Preview</span>
            <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={16} /> Print / Download
            </button>
          </div>
          <div className="card-body" style={{ background: '#f3f4f6', padding: '30px', display: 'flex', justifyContent: 'center' }}>
            {/* The actual styled printable wrapper */}
            <div 
              ref={printRef}
              style={{ 
                width: '100%',
                maxWidth: '800px',
                padding: '40px', 
                background: 'white', 
                color: '#111827',
                border: '2px solid #1f2937', 
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                fontFamily: '"Outfit", "Inter", sans-serif',
                position: 'relative',
                boxSizing: 'border-box'
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
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', textTransform: 'uppercase', marginTop: '2px', margin: 0 }}>{hallTicket.student?.full_name}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Register Number</span>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a8a', marginTop: '2px', margin: 0 }}>{hallTicket.student?.register_number}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Department / Branch</span>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginTop: '2px', margin: 0 }}>{hallTicket.student?.department_name}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Center Code & Name</span>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginTop: '2px', margin: 0 }}>9999 - DEMO ENGINEERING COLLEGE</p>
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
                  borderRadius: '6px',
                  boxSizing: 'border-box'
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
                    {hallTicket.schedules.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>No subjects enrolled for this student.</td>
                      </tr>
                    ) : (
                      hallTicket.schedules.map((sched, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#1e3a8a', borderRight: '1px solid #e5e7eb' }}>{sched.subject_code}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#111827', borderRight: '1px solid #e5e7eb' }}>{sched.subject_name}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', borderRight: '1px solid #e5e7eb', fontWeight: '500' }}>
                            {sched.exam_date ? new Date(sched.exam_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                          </td>
                          <td style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>
                            <span className={`badge ${sched.session === 'FN' ? 'badge-fn' : 'badge-an'}`}>
                              {sched.session || 'TBD'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', fontWeight: '500' }}>{sched.venue || 'Main Block Hall 1A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Candidate Instructions */}
              <div style={{ background: '#fdf2f8', padding: '16px', borderRadius: '8px', border: '1px dashed #fbcfe8', marginBottom: '40px', fontSize: '11px', color: '#831843' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#9d174d', textTransform: 'uppercase', margin: 0 }}>Instructions to the Candidate:</h4>
                <ol style={{ paddingLeft: '16px', margin: '4px 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  <p style={{ borderTop: '1px solid #1f2937', width: '140px', paddingTop: '8px', fontSize: '11px', fontWeight: '700', color: '#374151', marginTop: '8px', margin: '8px 0 0' }}>
                    Signature of Candidate
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span style={{ fontFamily: '"Great Vibes", cursive', fontSize: '18px', color: '#1e3a8a', transform: 'rotate(-5deg)', display: 'inline-block' }}>Principal</span>
                  </div>
                  <p style={{ borderTop: '1px solid #1f2937', width: '140px', paddingTop: '8px', fontSize: '11px', fontWeight: '700', color: '#374151', marginTop: '8px', margin: '8px 0 0' }}>
                    Principal Signature
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span style={{ fontFamily: '"Great Vibes", cursive', fontSize: '18px', color: '#1e3a8a', transform: 'rotate(-3deg)', display: 'inline-block' }}>CoE Anna Univ</span>
                  </div>
                  <p style={{ borderTop: '1px solid #1f2937', width: '180px', paddingTop: '8px', fontSize: '11px', fontWeight: '700', color: '#374151', marginTop: '8px', margin: '8px 0 0' }}>
                    Controller of Examinations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{confirmModal.title}</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>{confirmModal.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmModal.onConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
