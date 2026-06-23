import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getSemesters, createSemester, deleteSemester,
  getSubjects, createSubject, updateSubject, deleteSubject
} from '../../api/admin';
import { Plus, Building, Calendar, BookOpen, Edit, Trash2, X } from 'lucide-react';

const TABS = ['Departments', 'Semesters', 'Subjects'];

export default function CurriculumPage() {
  const [tab, setTab] = useState('Departments');
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showSemModal, setShowSemModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [editingSub, setEditingSub] = useState(null);

  const [deptForm, setDeptForm] = useState({ name:'', code:'' });
  const [semForm, setSemForm] = useState({ department_id:'', semester_number:'', academic_year:'2025-2026', regulation:'2025' });
  const [subForm, setSubForm] = useState({ semester_id:'', subject_code:'', subject_name:'', credits:3, subject_type:'theory' });
  const [saving, setSaving] = useState(false);
  
  const [subSortBy, setSubSortBy] = useState('subject_code');
  const [subSortOrder, setSubSortOrder] = useState('asc');

  const loadDepts = () => getDepartments().then(d => setDepartments(d.departments));
  const loadSems = () => getSemesters().then(d => setSemesters(d.semesters));
  const loadSubs = () => getSubjects({ sort_by: subSortBy, sort_order: subSortOrder }).then(d => setSubjects(d.subjects));

  useEffect(() => {
    if (tab === 'Subjects') {
      loadSubs();
    }
  }, [subSortBy, subSortOrder]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadDepts(), loadSems(), loadSubs()]).finally(() => setLoading(false));
  }, []);

  // Department handlers
  const saveDept = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingDept) { await updateDepartment(editingDept.id, deptForm); toast.success('Department updated.'); }
      else { await createDepartment(deptForm); toast.success('Department added!'); }
      setShowDeptModal(false); loadDepts();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };
  const delDept = async (id, name) => {
    if (!window.confirm(`Delete department "${name}"?`)) return;
    try { await deleteDepartment(id); toast.success('Deleted.'); loadDepts(); }
    catch (err) { toast.error(err.message); }
  };

  // Semester handlers
  const saveSem = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createSemester(semForm); toast.success('Semester created!'); setShowSemModal(false); loadSems(); }
    catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };
  const delSem = async (id) => {
    if (!window.confirm('Delete this semester?')) return;
    try { await deleteSemester(id); toast.success('Deleted.'); loadSems(); }
    catch (err) { toast.error(err.message); }
  };

  // Subject handlers
  const saveSub = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingSub) { await updateSubject(editingSub.id, subForm); toast.success('Subject updated.'); }
      else { await createSubject(subForm); toast.success('Subject added!'); }
      setShowSubModal(false); loadSubs();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };
  const delSub = async (id, code) => {
    if (!window.confirm(`Delete subject "${code}"?`)) return;
    try { await deleteSubject(id); toast.success('Deleted.'); loadSubs(); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Curriculum Management</h2>
        <p>Manage departments, semesters, and subjects</p>
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

      {loading && <div className="loading-center"><span className="spinner"></span></div>}

      {/* Departments Tab */}
      {!loading && tab === 'Departments' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Departments ({departments.length})</div>
            <button className="btn btn-primary" onClick={() => { setEditingDept(null); setDeptForm({name:'',code:''}); setShowDeptModal(true); }} style={{display:'flex', alignItems:'center', gap:'6px'}}><Plus size={16} /> Add Department</button>
          </div>
          <div className="table-container">
            {departments.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon"><Building size={32} /></div><h3>No departments</h3></div>
            ) : (
              <table>
                <thead><tr><th>#</th><th>Code</th><th>Name</th><th>Actions</th></tr></thead>
                <tbody>
                  {departments.map((d, i) => (
                    <tr key={d.id}>
                      <td style={{ color:'var(--text-tertiary)' }}>{i+1}</td>
                      <td><span className="badge badge-info">{d.code}</span></td>
                      <td style={{ fontWeight:'500' }}>{d.name}</td>
                      <td>
                        <div style={{ display:'flex', gap:'6px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEditingDept(d); setDeptForm({name:d.name,code:d.code}); setShowDeptModal(true); }}><Edit size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => delDept(d.id, d.name)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Semesters Tab */}
      {!loading && tab === 'Semesters' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Semesters ({semesters.length})</div>
            <button className="btn btn-primary" onClick={() => { setSemForm({department_id:'',semester_number:'',academic_year:'2025-2026',regulation:'2025'}); setShowSemModal(true); }} style={{display:'flex', alignItems:'center', gap:'6px'}}><Plus size={16} /> Add Semester</button>
          </div>
          <div className="table-container">
            {semesters.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon"><Calendar size={32} /></div><h3>No semesters</h3></div>
            ) : (
              <table>
                <thead><tr><th>#</th><th>Department</th><th>Semester</th><th>Academic Year</th><th>Regulation</th><th>Actions</th></tr></thead>
                <tbody>
                  {semesters.map((s, i) => (
                    <tr key={s.id}>
                      <td style={{ color:'var(--text-tertiary)' }}>{i+1}</td>
                      <td><span className="badge badge-info">{s.department_name}</span></td>
                      <td style={{ fontWeight:'600', color:'var(--brand-primary)' }}>Semester {s.semester_number}</td>
                      <td style={{ color:'var(--text-secondary)' }}>{s.academic_year}</td>
                      <td><span className="badge badge-purple">AU-{s.regulation}</span></td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => delSem(s.id)}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Subjects Tab */}
      {!loading && tab === 'Subjects' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Subjects ({subjects.length})</div>
            <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
              <select className="form-control" style={{ width:'140px' }} value={subSortBy} onChange={e => setSubSortBy(e.target.value)}>
                <option value="subject_code">Subject Code</option>
                <option value="subject_name">Subject Name</option>
                <option value="credits">Credits</option>
                <option value="subject_type">Type</option>
              </select>
              <select className="form-control" style={{ width:'130px' }} value={subSortOrder} onChange={e => setSubSortOrder(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button className="btn btn-primary" onClick={() => { setEditingSub(null); setSubForm({semester_id:'',subject_code:'',subject_name:'',credits:3,subject_type:'theory'}); setShowSubModal(true); }} style={{display:'flex', alignItems:'center', gap:'6px'}}><Plus size={16} /> Add Subject</button>
            </div>
          </div>
          <div className="table-container">
            {subjects.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon"><BookOpen size={32} /></div><h3>No subjects</h3></div>
            ) : (
              <table>
                <thead><tr><th>#</th><th>Code</th><th>Subject Name</th><th>Type</th><th>Credits</th><th>Semester</th><th>Department</th><th>Actions</th></tr></thead>
                <tbody>
                  {subjects.map((s, i) => (
                    <tr key={s.id}>
                      <td style={{ color:'var(--text-tertiary)' }}>{i+1}</td>
                      <td><code style={{ fontSize:'12px', background:'var(--bg-surface-2)', padding:'2px 6px', borderRadius:'4px', color:'var(--brand-primary)' }}>{s.subject_code}</code></td>
                      <td style={{ fontWeight:'500' }}>{s.subject_name}</td>
                      <td><span className={`badge ${s.subject_type==='practical'?'badge-success':s.subject_type==='elective'?'badge-warning':'badge-info'}`}>{s.subject_type}</span></td>
                      <td style={{ textAlign:'center', fontWeight:'600', color:'var(--brand-secondary)' }}>{s.credits}</td>
                      <td style={{ color:'var(--text-secondary)' }}>Sem {s.semester_number}</td>
                      <td style={{ color:'var(--text-tertiary)', fontSize:'12px' }}>{s.department_name}</td>
                      <td>
                        <div style={{ display:'flex', gap:'6px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEditingSub(s); setSubForm({semester_id:s.semester_id,subject_code:s.subject_code,subject_name:s.subject_name,credits:s.credits,subject_type:s.subject_type}); setShowSubModal(true); }}><Edit size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => delSub(s.id, s.subject_code)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDeptModal && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setShowDeptModal(false)}>
          <div className="modal" style={{ maxWidth:'400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingDept ? 'Edit Department' : 'Add Department'}</h3>
              <button className="btn-icon" onClick={() => setShowDeptModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={saveDept}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input className="form-control" value={deptForm.name} onChange={e => setDeptForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Computer Science and Engineering" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Department Code *</label>
                  <input className="form-control" value={deptForm.code} onChange={e => setDeptForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="e.g. CSE" required maxLength={10} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeptModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Semester Modal */}
      {showSemModal && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setShowSemModal(false)}>
          <div className="modal" style={{ maxWidth:'420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Semester</h3>
              <button className="btn-icon" onClick={() => setShowSemModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={saveSem}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-control" value={semForm.department_id} onChange={e => setSemForm(f=>({...f,department_id:e.target.value}))} required>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Semester Number *</label>
                    <select className="form-control" value={semForm.semester_number} onChange={e => setSemForm(f=>({...f,semester_number:e.target.value}))} required>
                      <option value="">Select</option>
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Regulation</label>
                    <input className="form-control" value={semForm.regulation} onChange={e => setSemForm(f=>({...f,regulation:e.target.value}))} placeholder="2025" />
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label className="form-label">Academic Year</label>
                    <input className="form-control" value={semForm.academic_year} onChange={e => setSemForm(f=>({...f,academic_year:e.target.value}))} placeholder="2025-2026" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSemModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Semester'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {showSubModal && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setShowSubModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingSub ? 'Edit Subject' : 'Add Subject'}</h3>
              <button className="btn-icon" onClick={() => setShowSubModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={saveSub}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select className="form-control" value={subForm.semester_id} onChange={e => setSubForm(f=>({...f,semester_id:e.target.value}))} required>
                    <option value="">Select Semester</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.department_name} – Sem {s.semester_number} ({s.academic_year})</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Subject Code *</label>
                    <input className="form-control" value={subForm.subject_code} onChange={e => setSubForm(f=>({...f,subject_code:e.target.value.toUpperCase()}))} placeholder="e.g. CS3351" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credits</label>
                    <select className="form-control" value={subForm.credits} onChange={e => setSubForm(f=>({...f,credits:parseInt(e.target.value)}))}>
                      {[1,2,3,4,5].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label className="form-label">Subject Name *</label>
                    <input className="form-control" value={subForm.subject_name} onChange={e => setSubForm(f=>({...f,subject_name:e.target.value}))} placeholder="e.g. Data Structures" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject Type</label>
                    <select className="form-control" value={subForm.subject_type} onChange={e => setSubForm(f=>({...f,subject_type:e.target.value}))}>
                      <option value="theory">Theory</option>
                      <option value="practical">Practical</option>
                      <option value="elective">Elective</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editingSub ? 'Update' : 'Add Subject')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
