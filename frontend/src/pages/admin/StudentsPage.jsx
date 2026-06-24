import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getStudents, createStudent, updateStudent, deleteStudent, getDepartments, getSemesters } from '../../api/admin';
import { Search, Plus, GraduationCap, Edit, Trash2, X, Download, Upload } from 'lucide-react';
import { exportToExcel, importFromExcel } from '../../utils/excelHelper';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ register_number:'', full_name:'', email:'', password:'', department_id:'', semester_id:'', date_of_birth:'', phone:'' });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT, sort_by: sortBy, sort_order: sortOrder };
    if (search) params.search = search;
    if (filterDept) params.department_id = filterDept;
    getStudents(params)
      .then(d => { setStudents(d.students); setTotal(d.total); })
      .catch(() => toast.error('Failed to load students.'))
      .finally(() => setLoading(false));
  }, [search, filterDept, sortBy, sortOrder, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getDepartments().then(d => setDepartments(d.departments));
  }, []);
  useEffect(() => {
    if (form.department_id) getSemesters({ department_id: form.department_id }).then(d => setSemesters(d.semesters));
  }, [form.department_id]);

  const openAdd = () => {
    setEditing(null);
    setForm({ register_number:'', full_name:'', email:'', password:'', department_id:'', semester_id:'', date_of_birth:'', phone:'' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ register_number:s.register_number, full_name:s.full_name, email:s.email, password:'', department_id:s.department_id||'', semester_id:s.semester_id||'', date_of_birth:s.date_of_birth?.split('T')[0]||'', phone:s.phone||'' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateStudent(editing.id, form);
        toast.success('Student updated.');
      } else {
        await createStudent(form);
        toast.success('Student added successfully!');
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
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    try {
      await deleteStudent(id);
      toast.success('Student deleted.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    const dataToExport = students.map(s => ({
      'Register Number': s.register_number,
      'Full Name': s.full_name,
      'Email': s.email,
      'Phone': s.phone || '',
      'Department Code': s.dept_code || '',
      'Semester': s.semester_number || '',
      'Date of Birth': s.date_of_birth?.split('T')[0] || ''
    }));
    exportToExcel(dataToExport, 'Students_List', 'Students');
    toast.success('Students exported successfully.');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const loadingToast = toast.loading('Importing students from Excel...');
    try {
      const rows = await importFromExcel(file);
      if (rows.length === 0) {
        toast.error('No rows found in Excel sheet.', { id: loadingToast });
        return;
      }
      
      let importedCount = 0;
      let errorCount = 0;
      
      for (const row of rows) {
        const regNo = row['Register Number'] || row['register_number'] || row['Reg No'] || row['register_no'];
        const fullName = row['Full Name'] || row['full_name'] || row['Name'] || row['name'];
        const email = row['Email'] || row['email'];
        const phone = row['Phone'] || row['phone'] || '';
        const deptCode = row['Department Code'] || row['department_code'] || row['Department'] || '';
        const semNo = row['Semester'] || row['semester_number'] || row['sem'] || '';
        const dob = row['Date of Birth'] || row['date_of_birth'] || row['DOB'] || '';
        
        if (!regNo || !fullName || !email) {
          errorCount++;
          continue;
        }

        const dept = departments.find(d => d.code === deptCode.toString().toUpperCase() || d.name === deptCode);
        const deptId = dept ? dept.id : '';
        
        let semId = '';
        if (deptId && semNo) {
          const sems = await getSemesters({ department_id: deptId });
          const sem = sems.semesters.find(s => s.semester_number === parseInt(semNo));
          if (sem) semId = sem.id;
        }
        
        try {
          await createStudent({
            register_number: regNo.toString(),
            full_name: fullName,
            email,
            phone: phone.toString(),
            department_id: deptId,
            semester_id: semId,
            date_of_birth: dob ? dob.toString().split('T')[0] : null,
            password: regNo.toString()
          });
          importedCount++;
        } catch (err) {
          errorCount++;
        }
      }
      toast.success(`Imported ${importedCount} students.${errorCount > 0 ? ` Failed to import ${errorCount} rows.` : ''}`, { id: loadingToast });
      load();
    } catch (err) {
      toast.error('Failed to import Excel file.', { id: loadingToast });
    }
    e.target.value = ''; // Reset file input
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="page-header">
        <h2>Student Management</h2>
        <p>Manage student profiles and enrollments</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filters-row">
            <div className="search-bar">
              <span className="search-icon"><Search size={16} /></span>
              <input className="form-control" placeholder="Search name or reg. no..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="form-control" style={{ width:'180px' }} value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
            </select>
            <select className="form-control" style={{ width:'150px' }} value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
              <option value="created_at">Date Added</option>
              <option value="full_name">Name</option>
              <option value="register_number">Register No.</option>
              <option value="department_name">Department</option>
            </select>
            <select className="form-control" style={{ width:'130px' }} value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPage(1); }}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0 }}>
              <Upload size={16} /> Import Excel
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImport} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={16} /> Export Excel
            </button>
            <button id="add-student-btn" className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Add Student
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><span className="spinner"></span></div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><GraduationCap size={32} /></div>
            <h3>No students found</h3>
            <p>Add students or adjust your search/filter</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Register No.</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.id}>
                    <td style={{ color:'var(--text-tertiary)', fontSize:'12px' }}>{(page-1)*LIMIT + idx + 1}</td>
                    <td><code style={{ fontSize:'12px', background:'var(--bg-surface-2)', padding:'2px 6px', borderRadius:'4px', color:'var(--brand-primary)' }}>{s.register_number}</code></td>
                    <td style={{ fontWeight:'500' }}>{s.full_name}</td>
                    <td><span className="badge badge-info">{s.dept_code || s.department_name || '—'}</span></td>
                    <td style={{ color:'var(--text-secondary)' }}>Sem {s.semester_number || '—'}</td>
                    <td style={{ color:'var(--text-secondary)', fontSize:'12px' }}>{s.email}</td>
                    <td style={{ color:'var(--text-tertiary)', fontSize:'12px' }}>{s.phone || '—'}</td>
                    <td>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}><Edit size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id, s.full_name)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}>←</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i+1).map(p => (
              <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>→</button>
            <span style={{ fontSize:'12px', color:'var(--text-tertiary)' }}>Total: {total}</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title" style={{display:'flex', alignItems:'center', gap:'8px'}}>
                {editing ? <><Edit size={18} /> Edit Student</> : <><Plus size={18} /> Add Student</>}
              </h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Register Number *</label>
                    <input className="form-control" value={form.register_number} onChange={e => setForm(f=>({...f, register_number:e.target.value}))} placeholder="e.g. 312722205001" required disabled={!!editing} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" value={form.full_name} onChange={e => setForm(f=>({...f, full_name:e.target.value}))} placeholder="Student full name" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-control" type="email" value={form.email} onChange={e => setForm(f=>({...f, email:e.target.value}))} placeholder="student@email.com" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm(f=>({...f, phone:e.target.value}))} placeholder="Mobile number" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-control" value={form.department_id} onChange={e => setForm(f=>({...f, department_id:e.target.value, semester_id:''}))}>
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select className="form-control" value={form.semester_id} onChange={e => setForm(f=>({...f, semester_id:e.target.value}))}>
                      <option value="">Select Semester</option>
                      {semesters.map(s => <option key={s.id} value={s.id}>Semester {s.semester_number} ({s.academic_year})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input className="form-control" type="date" value={form.date_of_birth} onChange={e => setForm(f=>({...f, date_of_birth:e.target.value}))} />
                  </div>
                  {!editing && (
                    <div className="form-group">
                      <label className="form-label">Password (default: Reg. No.)</label>
                      <input className="form-control" type="password" value={form.password} onChange={e => setForm(f=>({...f, password:e.target.value}))} placeholder="Leave blank to use reg no." />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:'14px',height:'14px',borderWidth:'2px'}}></span> Saving...</> : (editing ? 'Update Student' : 'Add Student')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
