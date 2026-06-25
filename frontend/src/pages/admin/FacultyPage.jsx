import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getFaculty, createFaculty, updateFaculty, deleteFaculty, getDepartments, getFacultySubjectsForAdmin, assignSubjectToFaculty, unassignSubjectFromFaculty, getSubjects } from '../../api/admin';
import { Search, UserPlus, Users, Edit, Trash2, X, BookOpen, Plus, Download, Upload } from 'lucide-react';
import { exportToExcel, importFromExcel } from '../../utils/excelHelper';

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ faculty_id:'', full_name:'', email:'', password:'', department_id:'', designation:'' });
  const [saving, setSaving] = useState(false);

  // Subject assignment states
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [subjectToAssign, setSubjectToAssign] = useState('');
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const load = useCallback((isInitial = false) => {
    setLoading(true);
    const params = { sort_by: sortBy, sort_order: sortOrder };
    if (search) params.search = search;
    if (filterDept) params.department_id = filterDept;

    if (isInitial) {
      Promise.all([
        getFaculty(params),
        getDepartments(),
        getSubjects()
      ])
        .then(([facData, deptsData, subsData]) => {
          setFaculty(facData.faculty);
          setDepartments(deptsData.departments);
          setAllSubjects(subsData.subjects || []);
        })
        .catch(() => toast.error('Failed to load initial data.'))
        .finally(() => {
          setLoading(false);
          setIsFirstLoad(false);
        });
    } else {
      if (isFirstLoad) return;
      getFaculty(params)
        .then(d => setFaculty(d.faculty))
        .catch(() => toast.error('Failed to load faculty.'))
        .finally(() => setLoading(false));
    }
  }, [search, filterDept, sortBy, sortOrder, isFirstLoad]);

  useEffect(() => {
    load(true);
  }, []);

  useEffect(() => {
    if (!isFirstLoad) {
      load(false);
    }
  }, [load, isFirstLoad]);

  const openManageSubjects = async (f) => {
    setSelectedFaculty(f);
    setSubjectsLoading(true);
    setShowSubjectsModal(true);
    setSubjectToAssign('');
    try {
      const data = await getFacultySubjectsForAdmin(f.id);
      setAssignedSubjects(data.subjects || []);
      const allSubData = await getSubjects();
      setAllSubjects(allSubData.subjects || []);
    } catch (err) {
      toast.error('Failed to load faculty subjects.');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleAssignSubject = async (e) => {
    e.preventDefault();
    if (!subjectToAssign) return;
    try {
      await assignSubjectToFaculty(selectedFaculty.id, parseInt(subjectToAssign));
      toast.success('Subject assigned successfully.');
      const data = await getFacultySubjectsForAdmin(selectedFaculty.id);
      setAssignedSubjects(data.subjects || []);
      const allSubData = await getSubjects();
      setAllSubjects(allSubData.subjects || []);
      setSubjectToAssign('');
    } catch (err) {
      toast.error(err.message || 'Failed to assign subject.');
    }
  };

  const handleUnassignSubject = async (subjectId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Unassign Subject',
      message: 'Are you sure you want to unassign this subject?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await unassignSubjectFromFaculty(selectedFaculty.id, subjectId);
          toast.success('Subject unassigned successfully.');
          const data = await getFacultySubjectsForAdmin(selectedFaculty.id);
          setAssignedSubjects(data.subjects || []);
          const allSubData = await getSubjects();
          setAllSubjects(allSubData.subjects || []);
        } catch (err) {
          toast.error(err.message || 'Failed to unassign subject.');
        }
      }
    });
  };

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
    setConfirmModal({
      isOpen: true,
      title: 'Delete Faculty',
      message: `Delete faculty "${name}"?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteFaculty(id);
          toast.success('Faculty deleted.');
          load();
        } catch (err) {
          toast.error(err.message);
        }
      }
    });
  };

  const handleExport = () => {
    const dataToExport = faculty.map(f => ({
      'Faculty ID': f.faculty_id,
      'Full Name': f.full_name,
      'Email': f.email,
      'Designation': f.designation || '',
      'Department Code': f.dept_code || ''
    }));
    exportToExcel(dataToExport, 'Faculty_List', 'Faculty');
    toast.success('Faculty list exported successfully.');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const loadingToast = toast.loading('Importing faculty from Excel...');
    try {
      const rows = await importFromExcel(file);
      if (rows.length === 0) {
        toast.error('No rows found in Excel sheet.', { id: loadingToast });
        return;
      }
      
      let importedCount = 0;
      let errorCount = 0;
      
      for (const row of rows) {
        const facId = row['Faculty ID'] || row['faculty_id'] || row['ID'] || row['id'];
        const fullName = row['Full Name'] || row['full_name'] || row['Name'] || row['name'];
        const email = row['Email'] || row['email'];
        const designation = row['Designation'] || row['designation'] || '';
        const deptCode = row['Department Code'] || row['department_code'] || row['Department'] || '';
        
        if (!facId || !fullName || !email) {
          errorCount++;
          continue;
        }

        const dept = departments.find(d => d.code === deptCode.toString().toUpperCase() || d.name === deptCode);
        const deptId = dept ? dept.id : '';
        
        try {
          await createFaculty({
            faculty_id: facId.toString(),
            full_name: fullName,
            email,
            designation,
            department_id: deptId,
            password: facId.toString()
          });
          importedCount++;
        } catch (err) {
          errorCount++;
        }
      }
      toast.success(`Imported ${importedCount} faculty members.${errorCount > 0 ? ` Failed ${errorCount} rows.` : ''}`, { id: loadingToast });
      load();
    } catch (err) {
      toast.error('Failed to import Excel file.', { id: loadingToast });
    }
    e.target.value = ''; // Reset file input
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
            <select className="form-control" style={{ width:'150px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="created_at">Date Added</option>
              <option value="full_name">Name</option>
              <option value="faculty_id">Faculty ID</option>
              <option value="department_name">Department</option>
              <option value="designation">Designation</option>
            </select>
            <select className="form-control" style={{ width:'130px' }} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
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
            <button id="add-faculty-btn" className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={16} /> Add Faculty
            </button>
          </div>
        </div>

        {loading ? (
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
                {[...Array(6)].map((_, idx) => (
                  <tr key={idx}>
                    <td><div className="skeleton skeleton-text" style={{ width: '20px' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="skeleton skeleton-avatar"></div>
                        <div className="skeleton skeleton-text" style={{ width: '120px' }}></div>
                      </div>
                    </td>
                    <td><div className="skeleton skeleton-badge" style={{ width: '100px' }}></div></td>
                    <td><div className="skeleton skeleton-badge" style={{ width: '60px' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '160px' }}></div></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div className="skeleton skeleton-button" style={{ width: '32px' }}></div>
                        <div className="skeleton skeleton-button" style={{ width: '80px' }}></div>
                        <div className="skeleton skeleton-button" style={{ width: '32px' }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)} title="Edit Profile"><Edit size={14} /></button>
                        <button className="btn btn-info btn-sm" style={{ display:'flex', alignItems:'center', gap:'4px' }} onClick={() => openManageSubjects(f)} title="Manage Subjects"><BookOpen size={14} /> Subjects</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id, f.full_name)} title="Delete Faculty"><Trash2 size={14} /></button>
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
      {showSubjectsModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowSubjectsModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <BookOpen size={18} /> Manage Subjects: {selectedFaculty?.full_name}
              </h3>
              <button className="btn-icon" onClick={() => setShowSubjectsModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAssignSubject} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Assign New Subject</label>
                  <select 
                    className="form-control" 
                    value={subjectToAssign} 
                    onChange={e => setSubjectToAssign(e.target.value)}
                    required
                  >
                    <option value="">-- Select Subject --</option>
                    {allSubjects
                      .filter(sub => !sub.is_assigned)
                      .map(sub => (
                        <option key={sub.id} value={sub.id}>
                          [{sub.subject_code}] {sub.subject_name} (Sem {sub.semester_number} - {sub.department_name})
                        </option>
                      ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '42px' }}>
                  <Plus size={16} /> Assign
                </button>
              </form>

              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>Assigned Subjects</h4>
              {subjectsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  <span className="spinner"></span>
                </div>
              ) : assignedSubjects.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No subjects assigned to this faculty member yet.</p>
              ) : (
                <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Subject Name</th>
                        <th>Sem</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedSubjects.map(sub => (
                        <tr key={sub.id}>
                          <td><code style={{ fontSize: '11px', background: 'var(--bg-surface-2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--brand-primary)' }}>{sub.subject_code}</code></td>
                          <td style={{ fontWeight: '500', fontSize: '13px' }}>{sub.subject_name}</td>
                          <td style={{ fontSize: '13px' }}>Sem {sub.semester_number}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              type="button" 
                              className="btn btn-danger btn-sm" 
                              onClick={() => handleUnassignSubject(sub.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowSubjectsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{confirmModal.title}</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>{confirmModal.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmModal.onConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
