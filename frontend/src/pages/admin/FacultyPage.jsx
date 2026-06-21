import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getFaculty, createFaculty, updateFaculty, deleteFaculty, getDepartments } from '../../api/admin';
import { Search, UserPlus, Users, Edit, Trash2, X } from 'lucide-react';

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ faculty_id:'', full_name:'', email:'', password:'', department_id:'', designation:'' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (filterDept) params.department_id = filterDept;
    getFaculty(params)
      .then(d => setFaculty(d.faculty))
      .catch(() => toast.error('Failed to load faculty.'))
      .finally(() => setLoading(false));
  }, [search, filterDept]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getDepartments().then(d => setDepartments(d.departments)); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ faculty_id:'', full_name:'', email:'', password:'', department_id:'', designation:'' });
    setShowModal(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({ faculty_id:f.faculty_id, full_name:f.full_name, email:f.email, password:'', department_id:f.department_id||'', designation:f.designation||'' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateFaculty(editing.id, form);
        toast.success('Faculty updated.');
      } else {
        await createFaculty(form);
        toast.success('Faculty added!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete faculty "${name}"?`)) return;
    try {
      await deleteFaculty(id);
      toast.success('Faculty deleted.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Senior Lecturer'];

  return (
    <div>
      <div className="page-header">
        <h2>Faculty Management</h2>
        <p>Manage faculty profiles and subject assignments</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filters-row">
            <div className="search-bar">
              <span className="search-icon"><Search size={16} /></span>
              <input className="form-control" placeholder="Search name or faculty ID..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ width:'180px' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
            </select>
          </div>
          <button id="add-faculty-btn" className="btn btn-primary" onClick={openAdd} style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <UserPlus size={16} /> Add Faculty
          </button>
        </div>

        {loading ? (
          <div className="loading-center"><span className="spinner"></span></div>
        ) : faculty.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={32} /></div>
            <h3>No faculty found</h3>
            <p>Add faculty members to get started</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Faculty ID</th>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((f, idx) => (
                  <tr key={f.id}>
                    <td style={{ color:'var(--text-tertiary)', fontSize:'12px' }}>{idx + 1}</td>
                    <td><code style={{ fontSize:'12px', background:'var(--bg-surface-2)', padding:'2px 6px', borderRadius:'4px', color:'var(--brand-secondary)' }}>{f.faculty_id}</code></td>
                    <td style={{ fontWeight:'500' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'13px', fontWeight:'700', flexShrink:0 }}>
                          {f.full_name.charAt(0)}
                        </div>
                        {f.full_name}
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{f.designation || '—'}</span></td>
                    <td><span className="badge badge-info">{f.department_name || '—'}</span></td>
                    <td style={{ color:'var(--text-secondary)', fontSize:'12px' }}>{f.email}</td>
                    <td>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}><Edit size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id, f.full_name)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title" style={{display:'flex', alignItems:'center', gap:'8px'}}>
                {editing ? <><Edit size={18} /> Edit Faculty</> : <><UserPlus size={18} /> Add Faculty</>}
              </h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Faculty ID *</label>
                    <input className="form-control" value={form.faculty_id} onChange={e => setForm(f=>({...f, faculty_id:e.target.value}))} placeholder="e.g. FAC001" required disabled={!!editing} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" value={form.full_name} onChange={e => setForm(f=>({...f, full_name:e.target.value}))} placeholder="Dr. Faculty Name" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-control" type="email" value={form.email} onChange={e => setForm(f=>({...f, email:e.target.value}))} placeholder="faculty@college.edu" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <select className="form-control" value={form.designation} onChange={e => setForm(f=>({...f, designation:e.target.value}))}>
                      <option value="">Select Designation</option>
                      {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-control" value={form.department_id} onChange={e => setForm(f=>({...f, department_id:e.target.value}))}>
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  {!editing && (
                    <div className="form-group">
                      <label className="form-label">Password (default: Faculty ID)</label>
                      <input className="form-control" type="password" value={form.password} onChange={e => setForm(f=>({...f, password:e.target.value}))} placeholder="Leave blank to use faculty ID" />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:'14px',height:'14px',borderWidth:'2px'}}></span> Saving...</> : (editing ? 'Update' : 'Add Faculty')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
