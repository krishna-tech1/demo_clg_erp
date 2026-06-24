import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Admin Imports
import AdminLayout from './components/admin/AdminLayout';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import StudentsPage from './pages/admin/StudentsPage';
import FacultyPage from './pages/admin/FacultyPage';
import CurriculumPage from './pages/admin/CurriculumPage';
import ExamSchedulePage from './pages/admin/ExamSchedulePage';
import ResultsPage from './pages/admin/ResultsPage';
import HallTicketsPage from './pages/admin/HallTicketsPage';
import OBEPage from './pages/admin/OBEPage';
import ReportsPage from './pages/admin/ReportsPage';
import AuditPage from './pages/admin/AuditPage';

// Faculty Imports
import FacultyLayout from './components/faculty/FacultyLayout';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyMarksEntry from './pages/faculty/FacultyMarksEntry';
import FacultyObe from './pages/faculty/FacultyObe';

// Student Imports
import StudentLayout from './components/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentHallTicket from './pages/student/StudentHallTicket';
import StudentResults from './pages/student/StudentResults';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentInternalMarks from './pages/student/StudentInternalMarks';

import './index.css';

// Role-based Protected Route Wrapper
function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-app)' }}>
      <div style={{ textAlign:'center' }}>
        <span className="spinner" style={{ width:'40px', height:'40px', borderWidth:'3px' }}></span>
        <p style={{ marginTop:'16px', color:'var(--text-tertiary)', fontSize:'14px' }}>Loading...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRole && user?.role !== allowedRole) {
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
    if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Admin Pages Layout Wrapper
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

// Faculty Pages Layout Wrapper
function FacultyPages() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <FacultyLayout collapsed={collapsed} setCollapsed={setCollapsed}>
      <Routes>
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="marks" element={<FacultyMarksEntry />} />
        <Route path="obe" element={<FacultyObe />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </FacultyLayout>
  );
}

// Student Pages Layout Wrapper
function StudentPages() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <StudentLayout collapsed={collapsed} setCollapsed={setCollapsed}>
      <Routes>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="hall-ticket" element={<StudentHallTicket />} />
        <Route path="internal-marks" element={<StudentInternalMarks />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </StudentLayout>
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRole="admin">
                <AdminPages />
              </ProtectedRoute>
            } />
            
            <Route path="/faculty/*" element={
              <ProtectedRoute allowedRole="faculty">
                <FacultyPages />
              </ProtectedRoute>
            } />
            
            <Route path="/student/*" element={
              <ProtectedRoute allowedRole="student">
                <StudentPages />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

