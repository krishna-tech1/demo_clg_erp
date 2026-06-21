import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import AdminLayout from './components/admin/AdminLayout';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import StudentsPage from './pages/admin/StudentsPage';
import FacultyPage from './pages/admin/FacultyPage';
import CurriculumPage from './pages/admin/CurriculumPage';
import ExamSchedulePage from './pages/admin/ExamSchedulePage';
import MarksPage from './pages/admin/MarksPage';
import ResultsPage from './pages/admin/ResultsPage';
import HallTicketsPage from './pages/admin/HallTicketsPage';
import OBEPage from './pages/admin/OBEPage';
import ReportsPage from './pages/admin/ReportsPage';
import AuditPage from './pages/admin/AuditPage';

import './index.css';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-app)' }}>
      <div style={{ textAlign:'center' }}>
        <span className="spinner" style={{ width:'40px', height:'40px', borderWidth:'3px' }}></span>
        <p style={{ marginTop:'16px', color:'var(--text-tertiary)', fontSize:'14px' }}>Loading...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

// Admin pages wrapper with layout
function AdminPages() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <AdminLayout collapsed={collapsed} setCollapsed={setCollapsed}>
      <Routes>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="faculty" element={<FacultyPage />} />
        <Route path="curriculum" element={<CurriculumPage />} />
        <Route path="exam-schedule" element={<ExamSchedulePage />} />
        <Route path="marks" element={<MarksPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="hall-tickets" element={<HallTicketsPage />} />
        <Route path="obe" element={<OBEPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                fontSize: '13.5px',
                boxShadow: 'var(--shadow-lg)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Routes>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/*" element={
              <ProtectedRoute>
                <AdminPages />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
