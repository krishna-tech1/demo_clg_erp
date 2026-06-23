import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getAuditLogs } from '../../api/admin';
import { ClipboardList, Calendar, Lock, Edit, Search, RefreshCw } from 'lucide-react';

const ACTION_COLORS = {
  'LOGIN': 'badge-info',
  'CREATE_STUDENT': 'badge-success',
  'UPDATE_STUDENT': 'badge-purple',
  'DELETE_STUDENT': 'badge-danger',
  'CREATE_FACULTY': 'badge-success',
  'UPDATE_FACULTY': 'badge-purple',
  'DELETE_FACULTY': 'badge-danger',
  'CREATE_DEPARTMENT': 'badge-success',
  'CREATE_SEMESTER': 'badge-success',
  'CREATE_SUBJECT': 'badge-success',
  'PUBLISH_EXAM_SCHEDULE': 'badge-warning',
  'ENTER_INTERNAL_MARKS': 'badge-info',
  'ENTER_EXTERNAL_MARKS': 'badge-info',
  'COMPUTE_RESULTS': 'badge-purple',
  'PUBLISH_RESULTS': 'badge-warning',
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const LIMIT = 25;

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT, sort_by: sortBy, sort_order: sortOrder };
    if (filterAction) params.action = filterAction;
    getAuditLogs(params)
      .then(d => { setLogs(d.logs); setTotal(d.total); })
      .catch(() => toast.error('Failed to load audit logs.'))
      .finally(() => setLoading(false));
  }, [page, filterAction, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  const filteredLogs = search
    ? logs.filter(l => l.action?.toLowerCase().includes(search.toLowerCase()) || l.details?.toLowerCase().includes(search.toLowerCase()))
    : logs;

  const formatRelative = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString('en-IN');
  };

  return (
    <div>
      <div className="page-header">
        <h2>Audit Trail</h2>
        <p>Track all admin actions and system events for accountability</p>
      </div>

      {/* Summary Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'12px', marginBottom:'20px' }}>
        {[
          { label:'Total Events', value: total, icon: ClipboardList, color:'blue' },
          { label:'Today', value: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length, icon: Calendar, color:'green' },
          { label:'Login Events', value: logs.filter(l => l.action === 'LOGIN').length, icon: Lock, color:'purple' },
          { label:'Data Changes', value: logs.filter(l => ['CREATE','UPDATE','DELETE'].some(a => l.action?.includes(a))).length, icon: Edit, color:'orange' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding:'14px' }}>
            <div className={`stat-icon ${s.color}`} style={{ width:'38px', height:'38px', display:'flex', alignItems:'center', justifyContent:'center' }}><s.icon size={20} /></div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize:'22px' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filters-row">
            <div className="search-bar">
              <span className="search-icon"><Search size={16} /></span>
              <input className="form-control" placeholder="Filter by action or details..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ width:'200px' }} value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}>
              <option value="">All Actions</option>
              {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="form-control" style={{ width:'150px' }} value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
              <option value="created_at">Timestamp</option>
              <option value="action">Action</option>
            </select>
            <select className="form-control" style={{ width:'130px' }} value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPage(1); }}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load} style={{display:'flex', alignItems:'center', gap:'6px'}}><RefreshCw size={14} /> Refresh</button>
        </div>

        {loading ? (
          <div className="loading-center"><span className="spinner"></span></div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={32} /></div>
            <h3>No audit logs found</h3>
            <p>Perform actions to see them recorded here</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>User Type</th>
                  <th>Timestamp</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr key={log.id}>
                    <td style={{ color:'var(--text-tertiary)', fontSize:'11px' }}>{(page-1)*LIMIT + idx + 1}</td>
                    <td>
                      <span className={`badge ${ACTION_COLORS[log.action] || 'badge-gray'}`} style={{ fontSize:'11px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      {log.entity_type && (
                        <span className="badge badge-gray" style={{ fontSize:'11px' }}>{log.entity_type}</span>
                      )}
                      {log.entity_id && <span style={{ fontSize:'11px', color:'var(--text-tertiary)', marginLeft:'4px' }}>#{log.entity_id}</span>}
                    </td>
                    <td style={{ color:'var(--text-secondary)', fontSize:'12.5px', maxWidth:'280px' }} className="truncate">
                      {log.details || '—'}
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize:'11px' }}>{log.user_type}</span>
                    </td>
                    <td style={{ color:'var(--text-tertiary)', fontSize:'11px', whiteSpace:'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit' })}
                    </td>
                    <td style={{ color:'var(--text-tertiary)', fontSize:'11px', whiteSpace:'nowrap' }}>
                      {formatRelative(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>←</button>
            {Array.from({length: Math.min(totalPages, 7)}, (_, i) => i+1).map(p => (
              <button key={p} className={`page-btn${page===p?' active':''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            {totalPages > 7 && <span style={{ color:'var(--text-tertiary)', padding:'0 8px' }}>... {totalPages}</span>}
            <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>→</button>
            <span style={{ fontSize:'12px', color:'var(--text-tertiary)' }}>{total} total</span>
          </div>
        )}
      </div>
    </div>
  );
}
