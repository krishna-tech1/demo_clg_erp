import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getResults, publishResults, getResultsSummary, getSubjects, getSemesters } from '../../api/admin';
import { Send, ClipboardList, CheckCircle, XCircle, BarChart2 } from 'lucide-react';

const GRADE_COLORS = { 'O':'badge-success','A+':'badge-success','A':'badge-info','B+':'badge-info','B':'badge-purple','RA':'badge-warning','U':'badge-danger' };

export default function ResultsPage() {
  const [tab, setTab] = useState('Results');
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [filterPublished, setFilterPublished] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    getSubjects().then(d => setSubjects(d.subjects));
    getSemesters().then(d => setSemesters(d.semesters));
  }, []);

  useEffect(() => { loadResults(); }, [filterSubject, filterSem, filterPublished]);
  useEffect(() => { if (tab === 'Summary') loadSummary(); }, [tab, filterSem]);

  const loadResults = () => {
    setLoading(true);
    const params = {};
    if (filterSubject) params.subject_id = filterSubject;
    if (filterSem) params.semester_id = filterSem;
    if (filterPublished !== '') params.is_published = filterPublished;
    getResults(params)
      .then(d => setResults(d.results))
      .catch(() => toast.error('Failed to load results.'))
      .finally(() => setLoading(false));
  };

  const loadSummary = () => {
    const params = {};
    if (filterSem) params.semester_id = filterSem;
    getResultsSummary(params).then(d => setSummary(d.summary)).catch(() => {});
  };

  const handlePublish = async () => {
    if (!window.confirm('Publish all pending results? This will make them visible to students.')) return;
    setPublishing(true);
    try {
      const params = {};
      if (filterSubject) params.subject_id = filterSubject;
      if (filterSem) params.semester_id = filterSem;
      const res = await publishResults(params);
      toast.success(res.message);
      loadResults();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Results Management</h2>
        <p>Review computed results and publish to students</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'20px', background:'var(--bg-surface-2)', padding:'4px', borderRadius:'var(--radius-md)', width:'fit-content', border:'1px solid var(--border-color)' }}>
        {['Results', 'Summary'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'7px 20px', borderRadius:'var(--radius-sm)', border:'none', cursor:'pointer', fontSize:'13.5px', fontWeight:'500', transition:'all 0.15s',
              background: tab === t ? 'var(--bg-surface)' : 'transparent',
              color: tab === t ? 'var(--brand-primary)' : 'var(--text-secondary)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            }}>{t}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:'16px' }}>
        <div className="card-body" style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ flex:1, minWidth:'220px' }}>
            <label className="form-label">Filter by Subject</label>
            <select className="form-control" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} – {s.subject_name}</option>)}
            </select>
          </div>
          <div style={{ flex:1, minWidth:'180px' }}>
            <label className="form-label">Filter by Semester</label>
            <select className="form-control" value={filterSem} onChange={e => setFilterSem(e.target.value)}>
              <option value="">All Semesters</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.department_name} – Sem {s.semester_number}</option>)}
            </select>
          </div>
          <div style={{ flex:1, minWidth:'160px' }}>
            <label className="form-label">Status</label>
            <select className="form-control" value={filterPublished} onChange={e => setFilterPublished(e.target.value)}>
              <option value="">All</option>
              <option value="false">Pending</option>
              <option value="true">Published</option>
            </select>
          </div>
          <button className="btn btn-success" onClick={handlePublish} disabled={publishing} style={{display:'flex', alignItems:'center', gap:'6px'}}>
            {publishing ? 'Publishing...' : <><Send size={16} /> Publish Results</>}
          </button>
        </div>
      </div>

      {/* Results Table */}
      {tab === 'Results' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Results ({results.length})</div>
            <div style={{ fontSize:'12px', color:'var(--text-tertiary)' }}>
              Pass: <strong style={{color:'var(--brand-success)'}}>{results.filter(r=>r.pass_fail==='Pass').length}</strong> &nbsp;|&nbsp;
              Fail: <strong style={{color:'var(--brand-danger)'}}>{results.filter(r=>r.pass_fail==='Fail').length}</strong>
            </div>
          </div>
          {loading ? (
            <div className="loading-center"><span className="spinner"></span></div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ClipboardList size={32} /></div>
              <h3>No results found</h3>
              <p>Compute results from the Marks Entry page first</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Reg. No.</th>
                    <th>Student Name</th>
                    <th>Subject</th>
                    <th style={{textAlign:'center'}}>Internal /40</th>
                    <th style={{textAlign:'center'}}>External /60</th>
                    <th style={{textAlign:'center'}}>Total /100</th>
                    <th style={{textAlign:'center'}}>Grade</th>
                    <th style={{textAlign:'center'}}>Result</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={r.id}>
                      <td style={{color:'var(--text-tertiary)',fontSize:'12px'}}>{idx+1}</td>
                      <td><code style={{fontSize:'11px',background:'var(--bg-surface-2)',padding:'2px 5px',borderRadius:'4px',color:'var(--brand-primary)'}}>{r.register_number}</code></td>
                      <td style={{fontWeight:'500'}}>{r.student_name}</td>
                      <td><span className="badge badge-gray">{r.subject_code}</span></td>
                      <td style={{textAlign:'center',fontWeight:'600'}}>{parseFloat(r.internal_total).toFixed(1)}</td>
                      <td style={{textAlign:'center',fontWeight:'600'}}>{parseFloat(r.external_total).toFixed(1)}</td>
                      <td style={{textAlign:'center',fontWeight:'700',fontSize:'15px',color:'var(--brand-primary)'}}>{parseFloat(r.final_score).toFixed(1)}</td>
                      <td style={{textAlign:'center'}}><span className={`badge ${GRADE_COLORS[r.grade]||'badge-gray'}`}>{r.grade}</span></td>
                      <td style={{textAlign:'center'}}><span className={`badge ${r.pass_fail==='Pass'?'badge-success':'badge-danger'}`} style={{display:'inline-flex', alignItems:'center', gap:'4px'}}>{r.pass_fail==='Pass'?<><CheckCircle size={12}/> Pass</>:<><XCircle size={12}/> Fail</>}</span></td>
                      <td><span className={`badge ${r.is_published?'badge-success':'badge-warning'}`}>{r.is_published?'Published':'Pending'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary Tab */}
      {tab === 'Summary' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Subject-wise Pass Percentage</div></div>
          {summary.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><BarChart2 size={32} /></div><h3>No data</h3><p>Publish results to see summary</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th style={{textAlign:'center'}}>Total</th>
                    <th style={{textAlign:'center'}}>Passed</th>
                    <th style={{textAlign:'center'}}>Failed</th>
                    <th style={{textAlign:'center'}}>Avg Score</th>
                    <th style={{textAlign:'center'}}>Pass %</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map(s => (
                    <tr key={s.subject_code}>
                      <td><code style={{fontSize:'12px',background:'var(--bg-surface-2)',padding:'2px 6px',borderRadius:'4px',color:'var(--brand-primary)'}}>{s.subject_code}</code></td>
                      <td>{s.subject_name}</td>
                      <td style={{textAlign:'center',fontWeight:'600'}}>{s.total}</td>
                      <td style={{textAlign:'center',color:'var(--brand-success)',fontWeight:'600'}}>{s.passed}</td>
                      <td style={{textAlign:'center',color:'var(--brand-danger)',fontWeight:'600'}}>{s.failed}</td>
                      <td style={{textAlign:'center'}}>{s.avg_score}</td>
                      <td style={{textAlign:'center'}}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <div style={{ flex:1, height:'6px', background:'var(--bg-hover)', borderRadius:'3px', overflow:'hidden' }}>
                            <div style={{ width:`${s.pass_percent}%`, height:'100%', background: parseFloat(s.pass_percent)>=75?'var(--brand-success)':'var(--brand-warning)', borderRadius:'3px', transition:'width 0.5s' }}></div>
                          </div>
                          <span style={{fontWeight:'700',color:parseFloat(s.pass_percent)>=75?'var(--brand-success)':'var(--brand-warning)',minWidth:'40px'}}>{s.pass_percent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
