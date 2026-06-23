import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  getFacultySubjects, 
  getFacultySubjectCos, 
  saveFacultyCo, 
  getFacultySubjectCoPo, 
  saveFacultyCoPo, 
  getFacultyObeReports 
} from '../../api/admin';
import { toast } from 'react-hot-toast';
import { Save, HelpCircle, FileText } from 'lucide-react';

export default function FacultyObe() {
  const location = useLocation();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [cos, setCos] = useState([]);
  const [coDescriptions, setCoDescriptions] = useState({
    1: '', 2: '', 3: '', 4: '', 5: ''
  });
  const [coPoGrid, setCoPoGrid] = useState({}); // coId -> { poNumber: value }
  const [loading, setLoading] = useState(false);
  const [savingCo, setSavingCo] = useState(false);
  const [savingMapping, setSavingMapping] = useState(false);
  
  // Attainment Reports
  const [reports, setReports] = useState([]);

  useEffect(() => {
    getFacultySubjects()
      .then(data => {
        setSubjects(data.subjects || []);
        const stateSubjectId = location.state?.selectedSubjectId;
        if (stateSubjectId) {
          setSelectedSubjectId(stateSubjectId);
        } else if (data.subjects && data.subjects.length > 0) {
          setSelectedSubjectId(data.subjects[0].id.toString());
        }
      })
      .catch(err => toast.error('Failed to load assigned subjects.'));

    // Load reports
    getFacultyObeReports()
      .then(data => setReports(data.attainment || []))
      .catch(err => console.error(err));
  }, [location.state]);

  useEffect(() => {
    if (!selectedSubjectId) return;
    setLoading(true);
    
    // Load COs and CO-PO mappings for subject
    Promise.all([
      getFacultySubjectCos(selectedSubjectId),
      getFacultySubjectCoPo(selectedSubjectId)
    ])
      .then(([cosData, copoData]) => {
        const loadedCos = cosData.cos || [];
        setCos(loadedCos);

        // Populate descriptions state
        const descriptions = { 1: '', 2: '', 3: '', 4: '', 5: '' };
        loadedCos.forEach(c => {
          descriptions[c.co_number] = c.description;
        });
        setCoDescriptions(descriptions);

        // Populate CO-PO grid
        const grid = {};
        // Initialize grid for loaded COs
        loadedCos.forEach(c => {
          grid[c.id] = {};
          for (let p = 1; p <= 12; p++) {
            grid[c.id][p] = 0; // default 0
          }
        });
        // Populate actual values
        copoData.mappings.forEach(m => {
          if (grid[m.co_id]) {
            grid[m.co_id][m.po_number] = m.mapping_value;
          }
        });
        setCoPoGrid(grid);
        setLoading(false);
      })
      .catch(err => {
        toast.error('Failed to load OBE details.');
        setLoading(false);
      });
  }, [selectedSubjectId]);

  const handleCoDescriptionChange = (coNum, val) => {
    setCoDescriptions(prev => ({ ...prev, [coNum]: val }));
  };

  const handleSaveCo = async (coNum) => {
    const desc = coDescriptions[coNum];
    if (!desc) return toast.error(`Please enter a description for CO${coNum}.`);
    
    setSavingCo(true);
    try {
      const data = await saveFacultyCo({
        subject_id: parseInt(selectedSubjectId),
        co_number: coNum,
        description: desc
      });
      toast.success(`CO${coNum} saved successfully.`);
      
      // Update COs list state so mapping grid updates
      const updatedCos = [...cos];
      const index = updatedCos.findIndex(c => c.co_number === coNum);
      if (index > -1) {
        updatedCos[index] = data.co;
      } else {
        updatedCos.push(data.co);
      }
      setCos(updatedCos);
      
      // Initialize grid row for new CO
      if (!coPoGrid[data.co.id]) {
        setCoPoGrid(prev => {
          const updated = { ...prev };
          updated[data.co.id] = {};
          for (let p = 1; p <= 12; p++) {
            updated[data.co.id][p] = 0;
          }
          return updated;
        });
      }
    } catch (err) {
      toast.error('Failed to save CO.');
    } finally {
      setSavingCo(false);
    }
  };

  const handleMappingChange = (coId, poNum, val) => {
    setCoPoGrid(prev => ({
      ...prev,
      [coId]: {
        ...prev[coId],
        [poNum]: parseInt(val)
      }
    }));
  };

  const handleSaveMapping = async (coId, poNum) => {
    const val = coPoGrid[coId]?.[poNum] || 0;
    setSavingMapping(true);
    try {
      await saveFacultyCoPo({
        co_id: coId,
        po_number: poNum,
        mapping_value: val
      });
      toast.success('Mapping value updated.');
    } catch (err) {
      toast.error('Failed to save mapping.');
    } finally {
      setSavingMapping(false);
    }
  };

  const selectedSubjectInfo = subjects.find(s => s.id.toString() === selectedSubjectId.toString());

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
          Outcome Based Education (OBE)
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13.5px' }}>
          Define Course Outcomes (CO) and map them to Program Outcomes (PO) for accreditation.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
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
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner"></span>
        </div>
      ) : selectedSubjectId ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Define COs */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
              1. Define Course Outcomes (CO)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3, 4, 5].map(coNum => (
                <div key={coNum} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ minWidth: '60px', fontWeight: '700', color: 'var(--brand-primary)' }}>
                    CO {coNum}
                  </div>
                  <input
                    className="form-control"
                    type="text"
                    placeholder={`Define outcomes for Course Outcome ${coNum}`}
                    value={coDescriptions[coNum]}
                    onChange={e => handleCoDescriptionChange(coNum, e.target.value)}
                  />
                  <button
                    onClick={() => handleSaveCo(coNum)}
                    className="btn btn-primary btn-sm"
                    disabled={savingCo}
                  >
                    <Save size={14} /> Save
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Mapping Grid */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">2. CO-PO Mapping Matrix</span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Scale: 0 = No Mapping | 1 = Low | 2 = Medium | 3 = High
              </p>
              {cos.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  Define and save at least one Course Outcome (CO) above to enable the mapping grid.
                </p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>CO</th>
                        <th>Description</th>
                        {[...Array(12).keys()].map(i => (
                          <th key={i + 1} style={{ textAlign: 'center' }}>PO {i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cos.map(co => (
                        <tr key={co.id}>
                          <td style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>CO {co.co_number}</td>
                          <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={co.description}>
                            {co.description}
                          </td>
                          {[...Array(12).keys()].map(i => {
                            const poNum = i + 1;
                            const gridVal = coPoGrid[co.id]?.[poNum] || 0;
                            return (
                              <td key={poNum} style={{ textAlign: 'center' }}>
                                <select
                                  value={gridVal}
                                  onChange={e => handleMappingChange(co.id, poNum, e.target.value)}
                                  onBlur={() => handleSaveMapping(co.id, poNum)}
                                  style={{
                                    padding: '4px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    fontWeight: gridVal > 0 ? '600' : '400',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <option value="0">0</option>
                                  <option value="1">1</option>
                                  <option value="2">2</option>
                                  <option value="3">3</option>
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

          {/* Section 3: OBE Reports Summary */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">3. OBE Attainment Report</span>
            </div>
            <div className="card-body">
              {reports.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  No mapping data exists for your assigned subjects.
                </p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>CO</th>
                        <th>PO</th>
                        <th>Mapping Scale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.subject_code} - {r.subject_name}</td>
                          <td style={{ fontWeight: '600' }}>CO {r.co_number}</td>
                          <td style={{ fontWeight: '600' }}>PO {r.po_number}</td>
                          <td>
                            <span className={`badge ${r.mapping_value === 3 ? 'badge-success' : (r.mapping_value === 2 ? 'badge-warning' : 'badge-info')}`}>
                              {r.mapping_value} - {r.mapping_value === 3 ? 'High' : (r.mapping_value === 2 ? 'Medium' : 'Low')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>Please select a subject to manage OBE COs & PO mappings.</p>
        </div>
      )}
    </div>
  );
}
