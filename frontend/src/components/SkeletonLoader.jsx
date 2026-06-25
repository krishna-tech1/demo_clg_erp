import React from 'react';

export default function SkeletonLoader({ type = 'table', count = 5 }) {
  if (type === 'table') {
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {[...Array(5)].map((_, i) => (
                <th key={i}><div className="skeleton skeleton-text" style={{ width: '70px', height: '14px' }}></div></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(count)].map((_, rIdx) => (
              <tr key={rIdx}>
                {[...Array(5)].map((_, cIdx) => (
                  <td key={cIdx}><div className="skeleton skeleton-text" style={{ width: cIdx === 0 ? '30px' : cIdx === 2 ? '150px' : '90px' }}></div></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div>
        <div className="stats-grid">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="stat-card">
              <div className="skeleton skeleton-avatar" style={{ width: '40px', height: '40px' }}></div>
              <div className="stat-info" style={{ width: '60%', marginLeft: '12px' }}>
                <div className="skeleton skeleton-title" style={{ width: '45px', height: '24px', marginBottom: '8px' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div className="skeleton-card" style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="skeleton skeleton-avatar" style={{ width: '120px', height: '120px' }}></div>
          </div>
          <div className="skeleton-card" style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', padding: '20px' }}>
            <div className="skeleton skeleton-title" style={{ width: '120px' }}></div>
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="skeleton skeleton-text" style={{ width: '100%', height: '36px' }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {[...Array(count)].map((_, idx) => (
          <div key={idx} className="skeleton-card" style={{ height: '140px' }}>
            <div className="skeleton skeleton-title" style={{ width: '150px', marginBottom: '12px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '90%', marginBottom: '8px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'timetable') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {[...Array(count)].map((_, idx) => (
          <div key={idx} className="skeleton-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '70%' }}>
              <div className="skeleton skeleton-avatar"></div>
              <div style={{ width: '80%' }}>
                <div className="skeleton skeleton-title" style={{ width: '120px', marginBottom: '6px' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div className="skeleton skeleton-badge"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'obe') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Left Form Card Skeleton */}
        <div className="skeleton-card" style={{ padding: '20px' }}>
          <div className="skeleton skeleton-title" style={{ width: '140px', marginBottom: '16px' }}></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div className="skeleton skeleton-text" style={{ width: '40px', height: '24px' }}></div>
              <div className="skeleton skeleton-text" style={{ flex: 1, height: '28px' }}></div>
            </div>
          ))}
          <div className="skeleton skeleton-button" style={{ width: '100%', height: '36px', marginTop: '16px' }}></div>
        </div>
        {/* Right Mapping Grid Card Skeleton */}
        <div className="skeleton-card" style={{ padding: '20px' }}>
          <div className="skeleton skeleton-title" style={{ width: '180px', marginBottom: '16px' }}></div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>CO</th>
                  {[...Array(12)].map((_, i) => (
                    <th key={i}><div className="skeleton skeleton-text" style={{ width: '20px' }}></div></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, rIdx) => (
                  <tr key={rIdx}>
                    <td><div className="skeleton skeleton-text" style={{ width: '20px' }}></div></td>
                    {[...Array(12)].map((_, cIdx) => (
                      <td key={cIdx} style={{ padding: '8px' }}><div className="skeleton skeleton-badge" style={{ width: '24px', height: '24px' }}></div></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-card" style={{ padding: '20px' }}>
      <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: '16px' }}></div>
      <div className="skeleton skeleton-text" style={{ marginBottom: '12px' }}></div>
      <div className="skeleton skeleton-text" style={{ marginBottom: '12px' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
    </div>
  );
}
