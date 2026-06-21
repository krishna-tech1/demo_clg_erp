import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getExamSchedules, createExamSchedule, updateExamSchedule, deleteExamSchedule, publishExamSchedule, getSubjects } from '../../api/admin';
import { Calendar, Plus, Edit, Trash2, CheckCircle, Clock, Send, X, Sun, Moon } from 'lucide-react';

export default function ExamSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ subject_id:'', exam_date:'', session:'FN', start_time:'', end_time:'', venue:'' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getExamSchedules(), getSubjects()])
      .then(([s, sub]) => { setSchedules(s.schedules); setSubjects(sub.subjects); })
      .catch(() => toast.error('Failed to load.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ subject_id:'', exam_date:'', session:'FN', start_time:'', end_time:'', venue:'' }); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ subject_id:s.subject_id, exam_date:s.exam_date?.split('T')[0]||'', session:s.session, start_time:s.start_time||'', end_time:s.end_time||'', venue:s.venue||'' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await updateExamSchedule(editing.id, form); toast.success('Schedule updated.'); }
      else { await createExamSchedule(form); toast.success('Exam scheduled!'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam schedule?')) return;
    try { await deleteExamSchedule(id); toast.success('Deleted.'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const handlePublish = async (id) => {
    try { await publishExamSchedule(id); toast.success('Schedule published!'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const grouped = schedules.reduce((acc, s) => {
    const date = s.exam_date?.split('T')[0] || 'Unknown';
    if (!acc[date]) acc[date] = [];
    acc[date].push(s);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h2>Exam Schedule Management</h2>
        <p>Create and publish examination timetable</p>
      </div>

      <div className="page-actions">
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <div style={{ padding:'8px 14px', background:'var(--bg-surface)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', fontSize:'13px', display:'flex', alignItems:'center', gap:'12px' }}>
            <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Calendar size={14} /> Total: <strong>{schedules.length}</strong></span> <span style={{color:'var(--border-color)'}}>|</span> 
            <span style={{display:'flex', alignItems:'center', gap:'4px'}}><CheckCircle size={14} /> Published: <strong style={{ color:'var(--brand-success)' }}>{schedules.filter(s=>s.is_published).length}</strong></span> <span style={{color:'var(--border-color)'}}>|</span>
            <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Clock size={14} /> Pending: <strong style={{ color:'var(--brand-warning)' }}>{schedules.filter(s=>!s.is_published).length}</strong></span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{display:'flex', alignItems:'center', gap:'6px'}}><Plus size={16} /> Add Exam</button>
      </div>

      {loading ? (
        <div className="loading-center"><span className="spinner"></span></div>
      ) : schedules.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Calendar size={32} /></div>
            <h3>No exam schedules yet</h3>
            <p>Add exam schedules to create the timetable</p>
          </div>
        </div>
      ) : (
        Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([date, daySchedules]) => (
          <div key={date} className="card" style={{ marginBottom:'16px' }}>
            <div className="card-header">
              <div>
                <div className="card-title">
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}><Calendar size={18} /> {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
                </div>
                <div className="card-subtitle">{daySchedules.length} exam(s) scheduled</div>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Session</th>
                    <th>Time</th>
                    <th>Venue</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {daySchedules.map(s => (
                    <tr key={s.id}>
                      <td><code style={{ fontSize:'12px', background:'var(--bg-surface-2)', padding:'2px 6px', borderRadius:'4px', color:'var(--brand-primary)' }}>{s.subject_code}</code></td>
                      <td style={{ fontWeight:'500' }}>{s.subject_name}</td>
                      <td><span className={`badge ${s.session==='FN'?'badge-info':'badge-purple'}`} style={{display:'inline-flex', alignItems:'center', gap:'4px'}}>{s.session === 'FN' ? <><Sun size={12}/> FN</> : <><Moon size={12}/> AN</>}</span></td>
                      <td style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{s.start_time || '--'}  {s.end_time ? `– ${s.end_time}` : ''}</td>
                      <td style={{ color:'var(--text-secondary)' }}>{s.venue || '—'}</td>
                      <td style={{ fontSize:'12px', color:'var(--text-tertiary)' }}>{s.department_name}</td>
                      <td>
                        <span className={`badge ${s.is_published ? 'badge-success' : 'badge-warning'}`} style={{display:'inline-flex', alignItems:'center', gap:'4px'}}>
                          {s.is_published ? <><CheckCircle size={12}/> Published</> : <><Clock size={12}/> Draft</>}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:'6px' }}>
                          {!s.is_published && (
                            <button className="btn btn-success btn-sm" onClick={() => handlePublish(s.id)} title="Publish"><Send size={14} /></button>
                          )}
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}><Edit size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title" style={{display:'flex', alignItems:'center', gap:'8px'}}>{editing ? <><Edit size={18}/> Edit Exam</> : <><Plus size={18}/> Schedule Exam</>}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <select className="form-control" value={form.subject_id} onChange={e => setForm(f=>({...f,subject_id:e.target.value}))} required>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} – {s.subject_name}</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Exam Date *</label>
                    <input className="form-control" type="date" value={form.exam_date} onChange={e => setForm(f=>({...f,exam_date:e.target.value}))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session</label>
                    <select className="form-control" value={form.session} onChange={e => setForm(f=>({...f,session:e.target.value}))}>
                      <option value="FN">FN (Forenoon)</option>
                      <option value="AN">AN (Afternoon)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input className="form-control" type="time" value={form.start_time} onChange={e => setForm(f=>({...f,start_time:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input className="form-control" type="time" value={form.end_time} onChange={e => setForm(f=>({...f,end_time:e.target.value}))} />
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label className="form-label">Venue / Hall</label>
                    <input className="form-control" value={form.venue} onChange={e => setForm(f=>({...f,venue:e.target.value}))} placeholder="e.g. Block A – Hall 101" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Schedule')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
