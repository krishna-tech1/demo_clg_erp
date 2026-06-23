import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getFacultySubjects, getFacultySubjectStudents, saveFacultyMarks } from '../../api/admin';
import { toast } from 'react-hot-toast';
import { Save, BookOpen, Search, ArrowUpDown } from 'lucide-react';

export default function FacultyMarksEntry() {
  const location = useLocation();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marksState, setMarksState] = useState({}); // studentId -> { model1, model2, practical }
  const [saving, setSaving] = useState(false);

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
    const val = value === '' ? 0 : Math.min(100, Math.max(0, parseFloat(value) || 0));
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
      await saveFacultyMarks({
        student_id: studentId,
        subject_id: parseInt(selectedSubjectId),
        model1_marks: marks.model1,
        model2_marks: marks.model2,
        practical_marks: marks.practical
      });
      toast.success('Marks saved successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
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
      const best = Math.max(m1, m2);
      return ((best / 100.0) * 40).toFixed(2);
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

        <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
        </div>

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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedAndFilteredStudents().map(s => {
                    const studentMarks = marksState[s.student_id] || { model1: 0, model2: 0, practical: 0 };
                    const internalVal = calculateLocalInternal(studentMarks.model1, studentMarks.model2);
                    return (
                      <tr key={s.student_id}>
                        <td style={{ fontWeight: '600' }}>{s.register_number}</td>
                        <td>{s.full_name}</td>
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
}
