import { useState, useEffect } from 'react';
import { getResultsSummary, getInternalMarks, getExternalMarks, getSemesters } from '../../api/admin';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart as BarChartIcon, Edit, Building2, FileText, ClipboardList, Printer } from 'lucide-react';
import { exportToExcel } from '../../utils/excelHelper';
import { toast } from 'react-hot-toast';
import SkeletonLoader from '../../components/SkeletonLoader';

const REPORT_TYPES = [
  { id: 'pass-percentage', label: 'Pass Percentage', icon: BarChartIcon, desc: 'Subject-wise pass/fail analysis' },
  { id: 'internal', label: 'Internal Marks', icon: Edit, desc: 'Model exam marks overview' },
  { id: 'external', label: 'External Marks', icon: Building2, desc: 'University exam marks' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('pass-percentage');
  const [semesters, setSemesters] = useState([]);
  const [filterSem, setFilterSem] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getSemesters().then(d => setSemesters(d.semesters)); }, []);

  useEffect(() => { loadReport(); }, [reportType, filterSem]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterSem) params.semester_id = filterSem;
      if (reportType === 'pass-percentage') {
        const r = await getResultsSummary(params);
        setData(r.summary);
      } else if (reportType === 'internal') {
        const r = await getInternalMarks(params);
        setData(r.marks);
      } else if (reportType === 'external') {
        const r = await getExternalMarks(params);
        setData(r.marks);
      }
    } catch (err) { setData([]); }
    finally { setLoading(false); }
  };

  const handleExportExcel = () => {
    if (data.length === 0) return toast.error('No data available to export.');
    let dataToExport = [];
    if (reportType === 'pass-percentage') {
      dataToExport = data.map(r => ({
        'Subject Code': r.subject_code,
        'Subject Name': r.subject_name,
        'Total Students': r.total,
        'Passed Students': r.passed,
        'Failed Students': r.failed,
        'Average Score': r.avg_score,
        'Pass Percentage': `${r.pass_percent}%`
      }));
    } else if (reportType === 'internal') {
      dataToExport = data.map(r => ({
        'Register Number': r.register_number,
        'Student Name': r.student_name,
        'Subject Code': r.subject_code,
        'Model 1 Marks': r.model1_marks,
        'Model 2 Marks': r.model2_marks,
        'Practical Marks': r.practical_marks,
        'Internal Total (40)': r.internal_total
      }));
    } else {
      dataToExport = data.map(r => ({
        'Register Number': r.register_number,
        'Student Name': r.student_name,
        'Subject Code': r.subject_code,
        'University Exam Marks': r.marks_obtained,
        'External Total (60)': r.external_total
      }));
    }
    exportToExcel(dataToExport, `${reportType}_report`, 'Report');
    toast.success('Report exported to Excel successfully.');
  };

  const chartData = reportType === 'pass-percentage' ? data.map(d => ({
    name: d.subject_code,
    Pass: parseInt(d.passed),
    Fail: parseInt(d.failed),
    'Pass %': parseFloat(d.pass_percent),
  })) : [];

  return (
    <div>
      <div className="page-header">
        <h2>Reports</h2>
        <p>Generate and view college performance reports</p>
      </div>

      <style>{`
        @media print {
          .sidebar, .admin-header, .no-print, header, aside, .theme-toggle {
            display: none !important;
          }
          .admin-layout, .admin-main, .admin-content {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            margin: 0 !important;
            padding: 10px !important;
          }
        }
      `}</style>

      {/* Report Type Selection */}
      <div className="no-print" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px', marginBottom:'20px' }}>
        {REPORT_TYPES.map(r => (
          <div key={r.id} onClick={() => setReportType(r.id)}
            style={{ padding:'16px', borderRadius:'var(--radius-lg)', border:`2px solid ${reportType===r.id?'var(--brand-primary)':'var(--border-color)'}`,
              background: reportType===r.id?'var(--bg-active)':'var(--bg-surface)', cursor:'pointer', transition:'all 0.15s' }}
          >
            <div style={{ marginBottom:'6px', display:'flex' }}><r.icon size={22} color={reportType===r.id?'var(--brand-primary)':'var(--text-secondary)'} /></div>
            <div style={{ fontWeight:'600', fontSize:'13.5px', color: reportType===r.id?'var(--brand-primary)':'var(--text-primary)' }}>{r.label}</div>
            <div style={{ fontSize:'11.5px', color:'var(--text-tertiary)', marginTop:'3px' }}>{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card no-print" style={{ marginBottom:'16px' }}>
        <div className="card-body" style={{ display:'flex', gap:'16px', flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ flex:1, minWidth:'200px' }}>
            <label className="form-label">Filter by Semester</label>
            <select className="form-control" value={filterSem} onChange={e => setFilterSem(e.target.value)}>
              <option value="">All Semesters</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.department_name} – Sem {s.semester_number}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => window.print()} style={{display:'flex', alignItems:'center', gap:'6px'}}><Printer size={16} /> Print Report</button>
          <button className="btn btn-secondary" onClick={handleExportExcel} style={{display:'flex', alignItems:'center', gap:'6px'}}><BarChartIcon size={16} /> Export Excel</button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader type="table" count={5} />
      ) : (
        <>
          {/* Bar Chart for Pass Percentage */}
          {reportType === 'pass-percentage' && chartData.length > 0 && (
            <div className="card" style={{ marginBottom:'16px' }}>
              <div className="card-header">
                <div className="card-title">Pass/Fail Distribution by Subject</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top:5, right:20, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" tick={{ fill:'var(--text-secondary)', fontSize:12 }} />
                    <YAxis tick={{ fill:'var(--text-secondary)', fontSize:12 }} />
                    <Tooltip contentStyle={{ background:'var(--bg-surface)', border:'1px solid var(--border-color)', borderRadius:'8px', color:'var(--text-primary)' }} />
                    <Legend />
                    <Bar dataKey="Pass" fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="Fail" fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                {reportType === 'pass-percentage' ? <><BarChartIcon size={18} style={{marginRight:'8px', verticalAlign:'middle'}} /> Subject-wise Summary</> :
                 reportType === 'internal' ? <><Edit size={18} style={{marginRight:'8px', verticalAlign:'middle'}} /> Internal Marks Data</> : <><Building2 size={18} style={{marginRight:'8px', verticalAlign:'middle'}} /> External Marks Data</>}
              </div>
              <span style={{ fontSize:'12px', color:'var(--text-tertiary)' }}>{data.length} records</span>
            </div>
            {data.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><ClipboardList size={32} /></div>
                <h3>No data available</h3>
                <p>Enter marks and publish results to generate reports</p>
              </div>
            ) : reportType === 'pass-percentage' ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                      <th style={{textAlign:'center'}}>Total</th>
                      <th style={{textAlign:'center'}}>Pass</th>
                      <th style={{textAlign:'center'}}>Fail</th>
                      <th style={{textAlign:'center'}}>Avg Score</th>
                      <th>Pass %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(r => (
                      <tr key={r.subject_code}>
                        <td><code style={{fontSize:'12px',background:'var(--bg-surface-2)',padding:'2px 6px',borderRadius:'4px',color:'var(--brand-primary)'}}>{r.subject_code}</code></td>
                        <td>{r.subject_name}</td>
                        <td style={{textAlign:'center',fontWeight:'600'}}>{r.total}</td>
                        <td style={{textAlign:'center',color:'var(--brand-success)',fontWeight:'600'}}>{r.passed}</td>
                        <td style={{textAlign:'center',color:'var(--brand-danger)',fontWeight:'600'}}>{r.failed}</td>
                        <td style={{textAlign:'center'}}>{r.avg_score}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <div style={{ flex:1, height:'6px', background:'var(--bg-hover)', borderRadius:'3px', overflow:'hidden' }}>
                              <div style={{ width:`${r.pass_percent}%`, height:'100%', background: parseFloat(r.pass_percent)>=75?'var(--brand-success)':'var(--brand-warning)', borderRadius:'3px' }}></div>
                            </div>
                            <strong style={{ color: parseFloat(r.pass_percent)>=75?'var(--brand-success)':'var(--brand-warning)', minWidth:'44px' }}>{r.pass_percent}%</strong>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : reportType === 'internal' ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Reg. No.</th><th>Student</th><th>Subject</th><th style={{textAlign:'center'}}>Model 1</th><th style={{textAlign:'center'}}>Model 2</th><th style={{textAlign:'center'}}>Practical</th><th style={{textAlign:'center'}}>Internal /40</th></tr>
                  </thead>
                  <tbody>
                    {data.map(r => (
                      <tr key={r.id}>
                        <td><code style={{fontSize:'11px',background:'var(--bg-surface-2)',padding:'2px 5px',borderRadius:'4px',color:'var(--brand-primary)'}}>{r.register_number}</code></td>
                        <td>{r.student_name}</td>
                        <td><span className="badge badge-gray">{r.subject_code}</span></td>
                        <td style={{textAlign:'center'}}>{r.model1_marks}</td>
                        <td style={{textAlign:'center'}}>{r.model2_marks}</td>
                        <td style={{textAlign:'center'}}>{r.practical_marks}</td>
                        <td style={{textAlign:'center',fontWeight:'700',color:'var(--brand-primary)'}}>{parseFloat(r.internal_total).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Reg. No.</th><th>Student</th><th>Subject</th><th style={{textAlign:'center'}}>Marks /100</th><th style={{textAlign:'center'}}>External /60</th></tr>
                  </thead>
                  <tbody>
                    {data.map(r => (
                      <tr key={r.id}>
                        <td><code style={{fontSize:'11px',background:'var(--bg-surface-2)',padding:'2px 5px',borderRadius:'4px',color:'var(--brand-primary)'}}>{r.register_number}</code></td>
                        <td>{r.student_name}</td>
                        <td><span className="badge badge-gray">{r.subject_code}</span></td>
                        <td style={{textAlign:'center'}}>{r.marks_obtained}</td>
                        <td style={{textAlign:'center',fontWeight:'700',color:'var(--brand-secondary)'}}>{parseFloat(r.external_total).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
