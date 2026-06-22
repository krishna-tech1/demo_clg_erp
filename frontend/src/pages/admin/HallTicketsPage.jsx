import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { getStudents, getHallTicket } from '../../api/admin';
import { Search, Ticket, Printer, AlertTriangle } from 'lucide-react';

export default function HallTicketsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [hallTicket, setHallTicket] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const printRef = useRef();

  const searchStudents = () => {
    if (!search.trim()) return toast.error('Enter a name or register number.');
    setLoading(true);
    getStudents({ search, limit: 20 })
      .then(d => setStudents(d.students))
      .catch(() => toast.error('Search failed.'))
      .finally(() => setLoading(false));
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

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Hall Ticket</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 20px; color: #000; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 8px 10px; }
        th { background: #f0f0f0; font-weight: bold; text-align: left; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 20px; border: 1px solid #000; }
        .info-cell { padding: 8px 12px; border-bottom: 1px solid #000; border-right: 1px solid #000; }
        .info-cell:nth-child(even) { border-right: none; }
        .info-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555; }
        .info-value { font-size: 14px; margin-top: 2px; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        h2 { font-size: 15px; margin: 0 0 4px; font-weight: normal; }
        .sign { margin-top: 40px; display: flex; justify-content: space-between; }
        @media print { .no-print { display: none; } }
      </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div>
      <div className="page-header">
        <h2>Hall Ticket Generation</h2>
        <p>Search students and generate hall tickets for published exam schedules</p>
      </div>

      <div className="card" style={{ marginBottom:'20px' }}>
        <div className="card-body">
          <div style={{ display:'flex', gap:'12px' }}>
            <div className="search-bar" style={{ flex:1 }}>
              <span className="search-icon"><Search size={16} /></span>
              <input
                className="form-control"
                placeholder="Search by student name or register number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchStudents()}
              />
            </div>
            <button className="btn btn-primary" onClick={searchStudents} disabled={loading} style={{display:'flex', alignItems:'center', gap:'6px'}}>
              {loading ? 'Searching...' : <><Search size={16} /> Search</>}
            </button>
          </div>

          {students.length > 0 && (
            <div style={{ marginTop:'16px' }}>
              <div style={{ fontSize:'12px', color:'var(--text-tertiary)', marginBottom:'8px' }}>{students.length} student(s) found</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {students.map(s => (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'var(--bg-surface-2)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', transition:'border-color 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor='var(--brand-primary)'}
                    onMouseOut={e => e.currentTarget.style.borderColor='var(--border-color)'}
                  >
                    <div>
                      <div style={{ fontWeight:'600', color:'var(--text-primary)' }}>{s.full_name}</div>
                      <div style={{ fontSize:'12px', color:'var(--text-secondary)' }}>
                        {s.register_number} &nbsp;•&nbsp; {s.department_name} &nbsp;•&nbsp; Semester {s.semester_number}
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => loadTicket(s)} style={{display:'flex', alignItems:'center', gap:'6px'}}><Ticket size={14} /> Generate</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hall Ticket Preview */}
      {loadingTicket && <div className="loading-center"><span className="spinner"></span></div>}

      {hallTicket && (
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{display:'flex', alignItems:'center', gap:'8px'}}><Ticket size={18} /> Hall Ticket Preview</div>
            <button className="btn btn-primary" onClick={handlePrint} style={{display:'flex', alignItems:'center', gap:'6px'}}><Printer size={16} /> Print / Download</button>
          </div>
          <div className="card-body">
            <div ref={printRef}>
              <div className="header" style={{ textAlign:'center', borderBottom:'2px solid var(--border-color)', paddingBottom:'16px', marginBottom:'20px' }}>
                <h1 style={{ fontSize:'18px', fontWeight:'700', color:'var(--text-primary)' }}>
                  COLLEGE HALL TICKET
                </h1>
                <h2 style={{ fontSize:'14px', color:'var(--text-secondary)', fontWeight:'400' }}>
                  Anna University – Regulation 2025
                </h2>
                <div style={{ marginTop:'8px', fontSize:'13px', color:'var(--text-secondary)' }}>
                  Academic Year: {hallTicket.student.academic_year}
                </div>
              </div>

              {/* Student Info */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', overflow:'hidden', marginBottom:'20px' }}>
                {[
                  { label:'Student Name', value: hallTicket.student.full_name },
                  { label:'Register Number', value: hallTicket.student.register_number },
                  { label:'Department', value: hallTicket.student.department_name },
                  { label:'Semester', value: `Semester ${hallTicket.student.semester_number}` },
                ].map((item, i) => (
                  <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border-color)', borderRight: i%2===0 ? '1px solid var(--border-color)' : 'none', background: i===0||i===2?'var(--bg-surface-2)':'var(--bg-surface)' }}>
                    <div style={{ fontSize:'10px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-tertiary)' }}>{item.label}</div>
                    <div style={{ fontSize:'15px', fontWeight:'600', color:'var(--text-primary)', marginTop:'4px' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Exam Schedule */}
              {hallTicket.schedules.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px', color:'var(--text-tertiary)', background:'var(--bg-surface-2)', borderRadius:'var(--radius-md)', border:'1px dashed var(--border-color)' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:'8px' }}><AlertTriangle size={32} /></div>
                  <div style={{ fontWeight:'600' }}>No published exam schedules found</div>
                  <div style={{ fontSize:'12px', marginTop:'4px' }}>Publish exam schedules to generate hall ticket</div>
                </div>
              ) : (
                <div className="table-container" style={{ border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Subject Code</th>
                        <th>Subject Name</th>
                        <th>Exam Date</th>
                        <th>Session</th>
                        <th>Venue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hallTicket.schedules.map((s, idx) => (
                        <tr key={s.id}>
                          <td style={{ color:'var(--text-tertiary)' }}>{idx+1}</td>
                          <td><strong style={{ color:'var(--brand-primary)' }}>{s.subject_code}</strong></td>
                          <td>{s.subject_name}</td>
                          <td style={{ fontWeight:'500' }}>{new Date(s.exam_date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}</td>
                          <td><span className={`badge ${s.session==='FN'?'badge-info':'badge-purple'}`}>{s.session}</span></td>
                          <td style={{ color:'var(--text-secondary)' }}>{s.venue || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signature */}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'40px', paddingTop:'20px', borderTop:'1px solid var(--border-color)' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ width:'120px', borderBottom:'1px solid var(--text-primary)', marginBottom:'6px' }}></div>
                  <div style={{ fontSize:'11px', color:'var(--text-secondary)' }}>Student Signature</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ width:'120px', borderBottom:'1px solid var(--text-primary)', marginBottom:'6px' }}></div>
                  <div style={{ fontSize:'11px', color:'var(--text-secondary)' }}>Controller of Examinations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
