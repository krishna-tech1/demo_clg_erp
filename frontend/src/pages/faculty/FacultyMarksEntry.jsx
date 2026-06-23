import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getFacultySubjects, getFacultySubjectStudents, saveFacultyMarks, saveFacultyExternalMarks, facultyComputeResults } from '../../api/admin';
import { toast } from 'react-hot-toast';
import { Save, BookOpen, Search, ArrowUpDown, Info, Settings } from 'lucide-react';

const TABS = ['Internal Marks', 'External Marks'];

export default function FacultyMarksEntry() {
  const location = useLocation();
  const [tab, setTab] = useState('Internal Marks');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marksState, setMarksState] = useState({}); // studentId -> { model1, model2, practical, external }
  const [saving, setSaving] = useState(false);
  const [computing, setComputing] = useState(false);

  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('register_number');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    getFacultySubjects()
      .then(data => {
        setSubjects(data.subjects || []);
        // Determine initial selected subject
        const stateSubjectId = location.state?.selectedSubjectId;
        if (stateSubjectId) {
          setSelectedSubjectId(stateSubjectId);
        } else if (data.subjects && data.subjects.length > 0) {
          setSelectedSubjectId(data.subjects[0].id.toString());
        }
      })
      .catch(err => toast.error('Failed to load assigned subjects.'));
  }, [location.state]);

  useEffect(() => {
    if (!selectedSubjectId) return;
    setLoading(true);
    getFacultySubjectStudents(selectedSubjectId)
      .then(data => {
        setStudents(data.students || []);
        // Initialize editing state
        const initialMarks = {};
        data.students.forEach(s => {
          initialMarks[s.student_id] = {
            model1: s.model1_marks !== null ? parseFloat(s.model1_marks) : 0,
            model2: s.model2_marks !== null ? parseFloat(s.model2_marks) : 0,
            practical: s.practical_marks !== null ? parseFloat(s.practical_marks) : 0,
            external: s.external_marks_obtained !== null ? parseFloat(s.external_marks_obtained) : 0,
          };
        });
        setMarksState(initialMarks);
        setLoading(false);
      })
      .catch(err => {
        toast.error('Failed to load students list.');
        setLoading(false);
      });
  }, [selectedSubjectId]);

  const handleMarkChange = (studentId, field, value) => {
    let val = value;
    if (value !== '') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        if (parsed > 100) val = 100;
        if (parsed < 0) val = 0;
      }
    }
    setMarksState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: val
      }
    }));
  };

  const handleSaveMarks = async (studentId) => {
    const marks = marksState[studentId];
    if (!marks) return;
    
    setSaving(true);
    try {
      if (tab === 'Internal Marks') {
        await saveFacultyMarks({
          student_id: studentId,
          subject_id: parseInt(selectedSubjectId),
          model1_marks: parseFloat(marks.model1) || 0,
          model2_marks: parseFloat(marks.model2) || 0,
          practical_marks: parseFloat(marks.practical) || 0
        });
      } else {
        await saveFacultyExternalMarks({
          student_id: studentId,
          subject_id: parseInt(selectedSubjectId),
          marks_obtained: parseFloat(marks.external) || 0
        });
      }
      toast.success('Marks saved successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllMarks = async () => {
    if (!selectedSubjectId) return;
    setSaving(true);
    try {
      for (const s of students) {
        const marks = marksState[s.student_id];
        if (!marks) continue;
        if (tab === 'Internal Marks') {
          await saveFacultyMarks({
            student_id: s.student_id,
            subject_id: parseInt(selectedSubjectId),
            model1_marks: parseFloat(marks.model1) || 0,
            model2_marks: parseFloat(marks.model2) || 0,
            practical_marks: parseFloat(marks.practical) || 0
          });
        } else {
          await saveFacultyExternalMarks({
            student_id: s.student_id,
            subject_id: parseInt(selectedSubjectId),
            marks_obtained: parseFloat(marks.external) || 0
          });
        }
      }
      toast.success('All student marks saved successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to save all marks.');
    } finally {
      setSaving(false);
    }
  };

  const handleCompute = async () => {
    if (!selectedSubjectId) return toast.error('Select a subject first.');
    setComputing(true);
    try {
      const res = await facultyComputeResults({ subject_id: parseInt(selectedSubjectId) });
      toast.success(res.message);
      // Refresh students and marks
      setLoading(true);
      const data = await getFacultySubjectStudents(selectedSubjectId);
      setStudents(data.students || []);
      const initialMarks = {};
      data.students.forEach(s => {
        initialMarks[s.student_id] = {
          model1: s.model1_marks !== null ? parseFloat(s.model1_marks) : 0,
          model2: s.model2_marks !== null ? parseFloat(s.model2_marks) : 0,
          practical: s.practical_marks !== null ? parseFloat(s.practical_marks) : 0,
          external: s.external_marks_obtained !== null ? parseFloat(s.external_marks_obtained) : 0,
        };
      });
      setMarksState(initialMarks);
    } catch (err) {
      toast.error(err.message || 'Failed to compute results.');
    } finally {
      setComputing(false);
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortedAndFilteredStudents = () => {
    let filtered = students.filter(s => 
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.register_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'register_number') {
        valA = a.register_number;
        valB = b.register_number;
      } else if (sortBy === 'full_name') {
        valA = a.full_name.toLowerCase();
        valB = b.full_name.toLowerCase();
      } else if (sortBy === 'model1') {
        valA = marksState[a.student_id]?.model1 ?? 0;
        valB = marksState[b.student_id]?.model1 ?? 0;
      } else if (sortBy === 'model2') {
        valA = marksState[a.student_id]?.model2 ?? 0;
        valB = marksState[b.student_id]?.model2 ?? 0;
      } else if (sortBy === 'practical') {
        valA = marksState[a.student_id]?.practical ?? 0;
        valB = marksState[b.student_id]?.practical ?? 0;
      } else if (sortBy === 'external') {
        valA = marksState[a.student_id]?.external ?? 0;
        valB = marksState[b.student_id]?.external ?? 0;
      } else if (sortBy === 'internal') {
        const bestA = Math.max(marksState[a.student_id]?.model1 ?? 0, marksState[a.student_id]?.model2 ?? 0);
        valA = ((bestA / 100.0) * 40);
        const bestB = Math.max(marksState[b.student_id]?.model1 ?? 0, marksState[b.student_id]?.model2 ?? 0);
        valB = ((bestB / 100.0) * 40);
      } else {
        return 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const selectedSubjectInfo = subjects.find(s => s.id.toString() === selectedSubjectId.toString());

  // Calculates standard internal component: 40% of best of Model 1 / 2
  const calculateLocalInternal = (m1, m2) => {
    const val1 = parseFloat(m1) || 0;
    const val2 = parseFloat(m2) || 0;
    const best = Math.max(val1, val2);
    return ((best / 100.0) * 40).toFixed(2);
  };

  const calculateLocalExternalTotal = (externalScore) => {
    const score = parseFloat(externalScore) || 0;
    return ((score / 100.0) * 60).toFixed(2);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
          Marks Entry
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13.5px' }}>
          Enter and update internal examination and practical assessment marks.
        </p>
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

      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <label className="form-label">Select Subject</label>
              <select
                className="form-control"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
                ))}
              </select>
            </div>
            {selectedSubjectInfo && (
              <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Type:</strong> {selectedSubjectInfo.subject_type.toUpperCase()} | 
                <strong> Semester:</strong> {selectedSubjectInfo.semester_number} | 
                <strong> Credits:</strong> {selectedSubjectInfo.credits}
              </div>
            )}
          </div>
          {selectedSubjectId && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={handleSaveAllMarks} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={16} /> Save All Marks
              </button>
              {tab === 'External Marks' && (
                <button className="btn btn-success" onClick={handleCompute} disabled={computing} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {computing ? 'Computing...' : <><Settings size={16} /> Compute Results</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Formulas Banners */}
      {tab === 'Internal Marks' ? (
        <div style={{ padding:'12px 16px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'var(--radius-md)', marginBottom:'24px', fontSize:'13px', color:'#1d4ed8', display:'flex', gap:'8px', alignItems:'flex-start' }}>
          <Info size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Internal Calculation Formula:</strong> Best of (Model Exam 1, Model Exam 2) × 40% = Internal Total (out of 40). Practical marks are recorded separately.
          </div>
        </div>
      ) : (
        <div style={{ padding:'12px 16px', background:'#fdf4ff', border:'1px solid #e9d5ff', borderRadius:'var(--radius-md)', marginBottom:'24px', fontSize:'13px', color:'#7c3aed', display:'flex', gap:'8px', alignItems:'flex-start' }}>
          <Info size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>External Calculation Formula:</strong> University Exam Marks × 60% = External Total (out of 60). After entering external marks, click "Compute Results" to compute final grades.
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner"></span>
        </div>
      ) : selectedSubjectId && students.length === 0 ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>No students enrolled in this subject.</p>
        </div>
      ) : selectedSubjectId ? (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <span className="card-title">Enrolled Students ({getSortedAndFilteredStudents().length})</span>
            <div className="search-bar" style={{ maxWidth: '300px', margin: 0 }}>
              <span className="search-icon"><Search size={16} /></span>
              <input 
                className="form-control" 
                placeholder="Search name or reg no..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('register_number')}>
                      Reg Number <ArrowUpDown size={12} style={{ opacity: sortBy === 'register_number' ? 1 : 0.4 }} />
                    </div>
                  </th>
                  <th>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('full_name')}>
                      Student Name <ArrowUpDown size={12} style={{ opacity: sortBy === 'full_name' ? 1 : 0.4 }} />
                    </div>
                  </th>
                  {tab === 'Internal Marks' ? (
                    <>
                      <th>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('model1')}>
                          Model Exam 1 (100) <ArrowUpDown size={12} style={{ opacity: sortBy === 'model1' ? 1 : 0.4 }} />
                        </div>
                      </th>
                      <th>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('model2')}>
                          Model Exam 2 (100) <ArrowUpDown size={12} style={{ opacity: sortBy === 'model2' ? 1 : 0.4 }} />
                        </div>
                      </th>
                      <th>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('practical')}>
                          Practical (100) <ArrowUpDown size={12} style={{ opacity: sortBy === 'practical' ? 1 : 0.4 }} />
                        </div>
                      </th>
                      <th>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('internal')}>
                          Calc Internal (40) <ArrowUpDown size={12} style={{ opacity: sortBy === 'internal' ? 1 : 0.4 }} />
                        </div>
                      </th>
                    </>
                  ) : (
                    <>
                      <th>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('external')}>
                          University Marks (100) <ArrowUpDown size={12} style={{ opacity: sortBy === 'external' ? 1 : 0.4 }} />
                        </div>
                      </th>
                      <th>
                        <div>Calc External (60)</div>
                      </th>
                    </>
                  )}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {getSortedAndFilteredStudents().map(s => {
                  const studentMarks = marksState[s.student_id] || { model1: 0, model2: 0, practical: 0, external: 0 };
                  const internalVal = calculateLocalInternal(studentMarks.model1, studentMarks.model2);
                  const externalVal = calculateLocalExternalTotal(studentMarks.external);

                  return (
                    <tr key={s.student_id}>
                      <td style={{ fontWeight: '600' }}>{s.register_number}</td>
                      <td>{s.full_name}</td>
                      {tab === 'Internal Marks' ? (
                        <>
                          <td>
                            <input
                              className="form-control"
                              type="number"
                              value={studentMarks.model1}
                              onChange={e => handleMarkChange(s.student_id, 'model1', e.target.value)}
                              style={{ width: '90px' }}
                              min="0"
                              max="100"
                            />
                          </td>
                          <td>
                            <input
                              className="form-control"
                              type="number"
                              value={studentMarks.model2}
                              onChange={e => handleMarkChange(s.student_id, 'model2', e.target.value)}
                              style={{ width: '90px' }}
                              min="0"
                              max="100"
                            />
                          </td>
                          <td>
                            <input
                              className="form-control"
                              type="number"
                              value={studentMarks.practical}
                              onChange={e => handleMarkChange(s.student_id, 'practical', e.target.value)}
                              style={{ width: '90px' }}
                              min="0"
                              max="100"
                              disabled={selectedSubjectInfo?.subject_type !== 'practical'}
                            />
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>
                            {internalVal}
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <input
                              className="form-control"
                              type="number"
                              value={studentMarks.external}
                              onChange={e => handleMarkChange(s.student_id, 'external', e.target.value)}
                              style={{ width: '120px' }}
                              min="0"
                              max="100"
                            />
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--brand-secondary)' }}>
                            {externalVal}
                          </td>
                        </>
                      )}
                      <td>
                        <button
                          onClick={() => handleSaveMarks(s.student_id)}
                          className="btn btn-success btn-sm"
                          disabled={saving}
                        >
                          <Save size={14} /> Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>Please select a subject above to enter marks.</p>
        </div>
      )}
    </div>
  );
}
