import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getSubjects, getCourseOutcomes, saveCourseOutcome, getCoPo, saveCoPo, getObeAttainment } from '../../api/admin';
import { FlaskConical, Save } from 'lucide-react';

const PO_LABELS = ['PO1','PO2','PO3','PO4','PO5','PO6','PO7','PO8','PO9','PO10','PO11','PO12'];
const PO_DESCRIPTIONS = {
  1: 'PO1: Engineering Knowledge',
  2: 'PO2: Problem Analysis',
  3: 'PO3: Design/Development of Solutions',
  4: 'PO4: Conduct Investigations of Complex Problems',
  5: 'PO5: Modern Tool Usage',
  6: 'PO6: The Engineer and Society',
  7: 'PO7: Environment and Sustainability',
  8: 'PO8: Ethics',
  9: 'PO9: Individual and Team Work',
  10: 'PO10: Communication',
  11: 'PO11: Project Management and Finance',
  12: 'PO12: Life-long Learning'
};
const MAPPING_LABELS = { 0:'—', 1:'Low', 2:'Med', 3:'High' };
const CELL_COLORS = { 0:'obe-cell-0', 1:'obe-cell-1', 2:'obe-cell-2', 3:'obe-cell-3' };

export default function OBEPage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [cos, setCos] = useState([]);
  const [coPoMap, setCoPoMap] = useState([]);
  const [attainment, setAttainment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coForm, setCoForm] = useState({ co_number:1, description:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { getSubjects().then(d => setSubjects(d.subjects)); }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    setLoading(true);
    Promise.all([
      getCourseOutcomes({ subject_id: selectedSubject }),
      getCoPo({ subject_id: selectedSubject }),
      getObeAttainment({ subject_id: selectedSubject })
    ]).then(([cosData, coPoData, attData]) => {
      setCos(cosData.course_outcomes);
      setCoPoMap(coPoData.mappings);
      setAttainment(attData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedSubject]);

  const handleSaveCo = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return toast.error('Select a subject.');
    setSaving(true);
    try {
      await saveCourseOutcome({ ...coForm, subject_id: selectedSubject });
      toast.success('Course outcome saved!');
      getCourseOutcomes({ subject_id: selectedSubject }).then(d => setCos(d.course_outcomes));
      setCoForm({ co_number: coForm.co_number < 5 ? coForm.co_number + 1 : 1, description:'' });
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleCoPoChange = async (coId, poNumber, value) => {
    try {
      await saveCoPo({ co_id: coId, po_number: poNumber, mapping_value: parseInt(value) });
      getCoPo({ subject_id: selectedSubject }).then(d => setCoPoMap(d.mappings));
    } catch (err) { toast.error('Failed to save mapping.'); }
  };

  const getMapping = (coId, poNum) => {
    const m = coPoMap.find(m => m.co_id === coId && m.po_number === poNum);
    return m ? m.mapping_value : 0;
  };

  return (
    <div>
      <div className="page-header">
        <h2>OBE Management</h2>
        <p>Define Course Outcomes (CO) and map to Program Outcomes (PO)</p>
      </div>

      {/* Subject Selector */}
      <div className="card" style={{ marginBottom:'20px' }}>
        <div className="card-body">
          <div style={{ maxWidth:'500px' }}>
            <label className="form-label">Select Subject</label>
            <select className="form-control" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">-- Select Subject --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} – {s.subject_name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selectedSubject ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FlaskConical size={32} /></div>
            <h3>Select a subject to manage OBE</h3>
          </div>
        </div>
      ) : loading ? (
        <div className="loading-center"><span className="spinner"></span></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px' }}>
          {/* CO Definition */}
          <div>
            <div className="card" style={{ marginBottom:'16px' }}>
              <div className="card-header">
                <div className="card-title">Course Outcomes (CO)</div>
              </div>
              <div className="card-body">
                <form onSubmit={handleSaveCo}>
                  <div className="form-group">
                    <label className="form-label">CO Number</label>
                    <select className="form-control" value={coForm.co_number} onChange={e => setCoForm(f=>({...f,co_number:parseInt(e.target.value)}))}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>CO{n}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={3} value={coForm.description} onChange={e => setCoForm(f=>({...f,description:e.target.value}))} placeholder="Upon completion, students will be able to..." required style={{ resize:'vertical' }}></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-full" style={{ justifyContent:'center', display:'flex', alignItems:'center', gap:'6px' }} disabled={saving}>
                    {saving ? 'Saving...' : <><Save size={16} /> Save CO</>}
                  </button>
                </form>
              </div>
            </div>

            {/* Existing COs */}
            <div className="card">
              <div className="card-header"><div className="card-title">Defined COs</div></div>
              <div className="card-body" style={{ padding:'12px' }}>
                {cos.length === 0 ? (
                  <div style={{ textAlign:'center', color:'var(--text-tertiary)', fontSize:'13px', padding:'20px' }}>No COs defined yet</div>
                ) : (
                  cos.map(co => (
                    <div key={co.id} style={{ padding:'10px 12px', background:'var(--bg-surface-2)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-color)', marginBottom:'8px' }}>
                      <div style={{ fontWeight:'600', color:'var(--brand-primary)', fontSize:'12px', marginBottom:'4px' }}>CO{co.co_number}</div>
                      <div style={{ fontSize:'12.5px', color:'var(--text-secondary)', lineHeight:'1.5' }}>{co.description}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* CO-PO Matrix */}
          <div>
            <div className="card" style={{ marginBottom:'16px' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">CO-PO Mapping Matrix</div>
                  <div className="card-subtitle">0=No contribution, 1=Low, 2=Medium, 3=High</div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
                  {Object.entries(MAPPING_LABELS).map(([val, label]) => (
                    <span key={val} className={`badge ${val==='0'?'badge-gray':val==='1'?'badge-warning':val==='2'?'badge-info':'badge-success'}`}>{val} = {label}</span>
                  ))}
                </div>
                {cos.length === 0 ? (
                  <div style={{ textAlign:'center', color:'var(--text-tertiary)', fontSize:'13px', padding:'20px' }}>Define course outcomes first</div>
                ) : (
                  <div className="obe-matrix" style={{ overflowX:'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ textAlign:'left' }}>CO / PO</th>
                          {PO_LABELS.map((po, idx) => (
                            <th key={po} title={PO_DESCRIPTIONS[idx + 1]} style={{ cursor: 'help' }}>{po}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cos.map(co => (
                          <tr key={co.id}>
                            <td style={{ fontWeight:'600', color:'var(--brand-primary)' }}>CO{co.co_number}</td>
                            {PO_LABELS.map((_, poIdx) => {
                              const poNum = poIdx + 1;
                              const val = getMapping(co.id, poNum);
                              return (
                                <td key={poNum} style={{ padding:'4px' }}>
                                  <select
                                    value={val}
                                    onChange={e => handleCoPoChange(co.id, poNum, e.target.value)}
                                    className={`${CELL_COLORS[val]}`}
                                    style={{ width:'52px', textAlign:'center', padding:'4px 2px', border:'1px solid var(--border-color)', borderRadius:'var(--radius-sm)', fontSize:'13px', fontWeight:'700', cursor:'pointer', background:'inherit' }}
                                  >
                                    <option value={0}>—</option>
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                  </select>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Attainment */}
            {attainment && (
              <div className="card">
                <div className="card-header"><div className="card-title">Attainment Summary</div></div>
                <div className="card-body">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                    <div style={{ textAlign:'center', padding:'16px', background:'var(--bg-surface-2)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-color)' }}>
                      <div style={{ fontSize:'28px', fontWeight:'700', color:'var(--brand-primary)' }}>{attainment.student_performance?.total || 0}</div>
                      <div style={{ fontSize:'12px', color:'var(--text-tertiary)', marginTop:'4px' }}>Total Students</div>
                    </div>
                    <div style={{ textAlign:'center', padding:'16px', background:'var(--bg-surface-2)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-color)' }}>
                      <div style={{ fontSize:'28px', fontWeight:'700', color:'var(--brand-success)' }}>{attainment.student_performance?.above_target || 0}</div>
                      <div style={{ fontSize:'12px', color:'var(--text-tertiary)', marginTop:'4px' }}>Above Target (≥50%)</div>
                    </div>
                    <div style={{ textAlign:'center', padding:'16px', background:'var(--bg-surface-2)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-color)' }}>
                      <div style={{ fontSize:'28px', fontWeight:'700', color:'var(--brand-secondary)' }}>{attainment.attainment_level}/3</div>
                      <div style={{ fontSize:'12px', color:'var(--text-tertiary)', marginTop:'4px' }}>Attainment Level</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
