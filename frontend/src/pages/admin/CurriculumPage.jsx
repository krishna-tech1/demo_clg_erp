import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getSemesters, createSemester, deleteSemester,
  getSubjects, createSubject, updateSubject, deleteSubject
} from '../../api/admin';
import { Plus, Building, Calendar, BookOpen, Edit, Trash2, X } from 'lucide-react';

const TABS = ['Departments', 'Semesters'];

export default function CurriculumPage() {
  const [tab, setTab] = useState('Departments');
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Drill-down selection states
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [selectedSemId, setSelectedSemId] = useState(null);

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
    try { 
      await deleteSemester(id); 
      toast.success('Deleted.'); 
      if (selectedSemId === id) setSelectedSemId(null);
      loadSems(); 
    }
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

      {/* Semesters Tab (Drill-Down Explorer) */}
      {!loading && tab === 'Semesters' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '20px', alignItems: 'stretch' }}>
          {/* Column 1: Departments */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 20px' }}>
              <div className="card-title" style={{ fontSize: '15px' }}>1. Departments ({departments.length})</div>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '450px', overflowY: 'auto' }}>
              {departments.map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDeptId(d.id);
                    setSelectedSemId(null);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: selectedDeptId === d.id ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                    background: selectedDeptId === d.id ? 'var(--bg-active)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s'
                  }}
                >
                  <span className="badge badge-info" style={{ marginBottom: '6px' }}>{d.code}</span>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>{d.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Semesters */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ fontSize: '15px' }}>2. Semesters</div>
              {selectedDeptId && (
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => {
                    setSemForm({ department_id: selectedDeptId.toString(), semester_number: '', academic_year: '2025-2026', regulation: '2025' });
                    setShowSemModal(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={12} /> Add
                </button>
              )}
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '450px', overflowY: 'auto' }}>
              {!selectedDeptId ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Select a department to view semesters.</p>
              ) : semesters.filter(s => s.department_id === selectedDeptId).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginBottom: '10px' }}>No semesters found.</p>
                </div>
              ) : (
                semesters
                  .filter(s => s.department_id === selectedDeptId)
                  .map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSemId(s.id)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        border: selectedSemId === s.id ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                        background: selectedSemId === s.id ? 'var(--bg-active)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Semester {s.semester_number}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Regulation: {s.regulation} | {s.academic_year}</div>
                      </div>
                      <button 
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 6px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          delSem(s.id);
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Column 3: Subjects */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ fontSize: '15px' }}>3. Subjects</div>
              {selectedSemId && (
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => {
                    setEditingSub(null);
                    setSubForm({ semester_id: selectedSemId.toString(), subject_code: '', subject_name: '', credits: 3, subject_type: 'theory' });
                    setShowSubModal(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={12} /> Add
                </button>
              )}
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '450px', overflowY: 'auto' }}>
              {!selectedSemId ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Select a semester to view subjects.</p>
              ) : subjects.filter(sub => sub.semester_id === selectedSemId).length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No subjects found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {subjects
                    .filter(sub => sub.semester_id === selectedSemId)
                    .map(sub => (
                      <div
                        key={sub.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          background: 'var(--bg-surface-2)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <code style={{ fontSize: '11px', background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', color: 'var(--brand-primary)', fontWeight: '600' }}>
                              {sub.subject_code}
                            </code>
                            <span className={`badge ${sub.subject_type === 'practical' ? 'badge-success' : sub.subject_type === 'elective' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                              {sub.subject_type}
                            </span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{sub.subject_name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Credits: {sub.credits}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ padding: '4px 6px' }}
                            onClick={() => {
                              setEditingSub(sub);
                              setSubForm({ semester_id: sub.semester_id, subject_code: sub.subject_code, subject_name: sub.subject_name, credits: sub.credits, subject_type: sub.subject_type });
                              setShowSubModal(true);
                            }}
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            style={{ padding: '4px 6px' }}
                            onClick={() => delSub(sub.id, sub.subject_code)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
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
