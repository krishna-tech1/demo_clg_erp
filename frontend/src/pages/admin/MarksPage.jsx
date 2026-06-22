import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getSubjects, getStudents, getInternalMarks, saveInternalMarks, getExternalMarks, saveExternalMarks, computeResults } from '../../api/admin';
import { Save, Settings, Info, Edit, GraduationCap } from 'lucide-react';

const TABS = ['Internal Marks', 'External Marks'];

export default function MarksPage() {
  const [tab, setTab] = useState('Internal Marks');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [computing, setComputing] = useState(false);

  useEffect(() => { getSubjects().then(d => setSubjects(d.subjects)); }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    setLoading(true);
    const params = { subject_id: selectedSubject };
    const fetchStudents = getStudents({ limit: 100 });
    const fetchMarks = tab === 'Internal Marks' ? getInternalMarks(params) : getExternalMarks(params);

    Promise.all([fetchStudents, fetchMarks]).then(([sd, md]) => {
      setStudents(sd.students);
      const map = {};
      const rows = tab === 'Internal Marks' ? md.marks : md.marks;
      rows.forEach(m => {
        map[m.student_id] = m;
      });
      setMarksData(map);
    }).catch(() => toast.error('Failed to load.'))
    .finally(() => setLoading(false));
  }, [selectedSubject, tab]);

  const updateMark = (studentId, field, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [field]: value, student_id: studentId, subject_id: selectedSubject }
    }));
  };

  const handleSaveAll = async () => {
    if (!selectedSubject) return toast.error('Please select a subject.');
    setSaving(true);
    const toSave = students.map(s => ({
      student_id: s.id,
      subject_id: selectedSubject,
      ...(tab === 'Internal Marks'
        ? { model1_marks: marksData[s.id]?.model1_marks || 0, model2_marks: marksData[s.id]?.model2_marks || 0, practical_marks: marksData[s.id]?.practical_marks || 0 }
        : { marks_obtained: marksData[s.id]?.marks_obtained || 0 }
      )
    }));

    try {
      for (const entry of toSave) {
        if (tab === 'Internal Marks') await saveInternalMarks(entry);
        else await saveExternalMarks(entry);
      }
      toast.success(`${tab} saved for ${toSave.length} students!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCompute = async () => {
    if (!selectedSubject) return toast.error('Select a subject first.');
    setComputing(true);
    try {
      const res = await computeResults({ subject_id: selectedSubject });
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setComputing(false);
    }
  };

  const internalTotal = (s) => {
    const d = marksData[s.id];
    if (!d) return 0;
    const best = Math.max(parseFloat(d.model1_marks)||0, parseFloat(d.model2_marks)||0);
    return Math.round((best / 100) * 40 * 100) / 100;
  };

  const externalTotal = (s) => {
    const d = marksData[s.id];
    return Math.round(((parseFloat(d?.marks_obtained)||0) / 100) * 60 * 100) / 100;
  };

  return (
    <div>
      <div className="page-header">
        <h2>Marks Management</h2>
        <p>Enter internal (Model 1, Model 2) and external (University) college marks</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'20px', background:'var(--bg-surface-2)', padding:'4px', borderRadius:'var(--radius-md)', width:'fit-content', border:'1px solid var(--border-color)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'7px 20px', borderRadius:'var(--radius-sm)', border:'none', cursor:'pointer', fontSize:'13.5px', fontWeight:'500', transition:'all 0.15s',
              background: tab === t ? 'var(--bg-surface)' : 'transparent',
              color: tab === t ? 'var(--brand-primary)' : 'var(--text-secondary)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            }}>{t}</button>
        ))}
      </div>

      {/* Subject Selector */}
      <div className="card" style={{ marginBottom:'16px' }}>
        <div className="card-body" style={{ display:'flex', gap:'16px', alignItems:'flex-end', flexWrap:'wrap' }}>
          <div className="form-group" style={{ flex:1, minWidth:'280px', marginBottom:0 }}>
            <label className="form-label">Select Subject</label>
            <select className="form-control" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">-- Select Subject --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} – {s.subject_name} (Sem {s.semester_number})</option>)}
            </select>
          </div>
          {selectedSubject && (
            <>
              <button className="btn btn-primary" onClick={handleSaveAll} disabled={saving} style={{display:'flex', alignItems:'center', gap:'6px'}}>
                {saving ? 'Saving...' : <><Save size={16} /> Save All Marks</>}
              </button>
              {tab === 'External Marks' && (
                <button className="btn btn-success" onClick={handleCompute} disabled={computing} style={{display:'flex', alignItems:'center', gap:'6px'}}>
                  {computing ? 'Computing...' : <><Settings size={16} /> Compute Results</>}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info Banner */}
      {tab === 'Internal Marks' && (
        <div style={{ padding:'12px 16px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'var(--radius-md)', marginBottom:'16px', fontSize:'13px', color:'#1d4ed8', display:'flex', gap:'8px', alignItems:'flex-start' }}>
          <span style={{display:'flex'}}><Info size={18} /></span>
          <div>
            <strong>Calculation:</strong> Best of (Model 1, Model 2) × 40% = Internal Total (out of 40). 
            Practical marks are recorded separately.
          </div>
        </div>
      )}
      {tab === 'External Marks' && (
        <div style={{ padding:'12px 16px', background:'#fdf4ff', border:'1px solid #e9d5ff', borderRadius:'var(--radius-md)', marginBottom:'16px', fontSize:'13px', color:'#7c3aed', display:'flex', gap:'8px' }}>
          <span style={{display:'flex'}}><Info size={18} /></span>
          <div><strong>Calculation:</strong> University Marks × 60% = External Total (out of 60). After entering external marks, click "Compute Results" to calculate final scores.</div>
        </div>
      )}

      {/* Marks Table */}
      {!selectedSubject ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Edit size={32} /></div>
            <h3>Select a subject to enter marks</h3>
          </div>
        </div>
      ) : loading ? (
        <div className="loading-center"><span className="spinner"></span></div>
      ) : students.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><GraduationCap size={32} /></div>
            <h3>No students enrolled</h3>
            <p>Add students and enroll them in this subject first</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">{tab} Entry – {subjects.find(s=>s.id==selectedSubject)?.subject_name}</div>
            <span style={{ fontSize:'12px', color:'var(--text-tertiary)' }}>{students.length} students</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Reg. No.</th>
                  <th>Student Name</th>
                  {tab === 'Internal Marks' ? (
                    <>
                      <th style={{ textAlign:'center' }}>Model 1 /100</th>
                      <th style={{ textAlign:'center' }}>Model 2 /100</th>
                      <th style={{ textAlign:'center' }}>Practical /100</th>
                      <th style={{ textAlign:'center' }}>Internal Total /40</th>
                    </>
                  ) : (
                    <>
                      <th style={{ textAlign:'center' }}>University Marks /100</th>
                      <th style={{ textAlign:'center' }}>External Total /60</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.id}>
                    <td style={{ color:'var(--text-tertiary)', fontSize:'12px' }}>{idx+1}</td>
                    <td><code style={{ fontSize:'11px', background:'var(--bg-surface-2)', padding:'2px 5px', borderRadius:'4px', color:'var(--brand-primary)' }}>{s.register_number}</code></td>
                    <td style={{ fontWeight:'500' }}>{s.full_name}</td>
                    {tab === 'Internal Marks' ? (
                      <>
                        {['model1_marks','model2_marks','practical_marks'].map(field => (
                          <td key={field} style={{ padding:'8px' }}>
                            <input
                              type="number" min="0" max="100" step="0.5"
                              value={marksData[s.id]?.[field] ?? ''}
                              onChange={e => updateMark(s.id, field, e.target.value)}
                              style={{ width:'80px', textAlign:'center', padding:'6px 8px', border:'1px solid var(--border-color)', borderRadius:'var(--radius-sm)', background:'var(--bg-surface)', color:'var(--text-primary)', fontSize:'13px' }}
                            />
                          </td>
                        ))}
                        <td style={{ textAlign:'center' }}>
                          <span style={{ fontWeight:'700', color:'var(--brand-primary)', fontSize:'15px' }}>{internalTotal(s)}</span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding:'8px', textAlign:'center' }}>
                          <input
                            type="number" min="0" max="100" step="0.5"
                            value={marksData[s.id]?.marks_obtained ?? ''}
                            onChange={e => updateMark(s.id, 'marks_obtained', e.target.value)}
                            style={{ width:'80px', textAlign:'center', padding:'6px 8px', border:'1px solid var(--border-color)', borderRadius:'var(--radius-sm)', background:'var(--bg-surface)', color:'var(--text-primary)', fontSize:'13px' }}
                          />
                        </td>
                        <td style={{ textAlign:'center' }}>
                          <span style={{ fontWeight:'700', color:'var(--brand-secondary)', fontSize:'15px' }}>{externalTotal(s)}</span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'16px 20px', borderTop:'1px solid var(--border-color)', display:'flex', justifyContent:'flex-end', gap:'12px' }}>
            <button className="btn btn-primary" onClick={handleSaveAll} disabled={saving} style={{display:'flex', alignItems:'center', gap:'6px'}}>
              {saving ? <><span className="spinner" style={{width:'14px',height:'14px',borderWidth:'2px'}}></span> Saving...</> : <><Save size={16} /> Save All Marks</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
