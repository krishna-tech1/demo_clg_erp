const BASE_URL = import.meta.env.VITE_API_URL || '/api';


const getToken = () => localStorage.getItem('app_user_token') || localStorage.getItem('app_admin_token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
};

// Auth
export const adminLogin = (username, password) =>
  fetch(`${BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then(handleResponse);

export const userLogin = (username, password, role) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  }).then(handleResponse);


// Dashboard
export const getDashboardStats = () =>
  fetch(`${BASE_URL}/admin/dashboard/stats`, { headers: authHeaders() }).then(handleResponse);

// Students
export const getStudents = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/students?${qs}`, { headers: authHeaders() }).then(handleResponse);
};
export const createStudent = (data) =>
  fetch(`${BASE_URL}/admin/students`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const updateStudent = (id, data) =>
  fetch(`${BASE_URL}/admin/students/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const deleteStudent = (id) =>
  fetch(`${BASE_URL}/admin/students/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse);

// Faculty
export const getFaculty = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/faculty?${qs}`, { headers: authHeaders() }).then(handleResponse);
};
export const createFaculty = (data) =>
  fetch(`${BASE_URL}/admin/faculty`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const updateFaculty = (id, data) =>
  fetch(`${BASE_URL}/admin/faculty/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const deleteFaculty = (id) =>
  fetch(`${BASE_URL}/admin/faculty/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse);
export const getFacultySubjectsForAdmin = (facultyId) =>
  fetch(`${BASE_URL}/admin/faculty/${facultyId}/subjects`, { headers: authHeaders() }).then(handleResponse);
export const assignSubjectToFaculty = (facultyId, subjectId) =>
  fetch(`${BASE_URL}/admin/faculty/${facultyId}/subjects`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ subject_id: subjectId }) }).then(handleResponse);
export const unassignSubjectFromFaculty = (facultyId, subjectId) =>
  fetch(`${BASE_URL}/admin/faculty/${facultyId}/subjects/${subjectId}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse);

// Curriculum
export const getDepartments = () =>
  fetch(`${BASE_URL}/admin/curriculum/departments`, { headers: authHeaders() }).then(handleResponse);
export const createDepartment = (data) =>
  fetch(`${BASE_URL}/admin/curriculum/departments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const updateDepartment = (id, data) =>
  fetch(`${BASE_URL}/admin/curriculum/departments/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const deleteDepartment = (id) =>
  fetch(`${BASE_URL}/admin/curriculum/departments/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse);

export const getSemesters = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/curriculum/semesters?${qs}`, { headers: authHeaders() }).then(handleResponse);
};
export const createSemester = (data) =>
  fetch(`${BASE_URL}/admin/curriculum/semesters`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const deleteSemester = (id) =>
  fetch(`${BASE_URL}/admin/curriculum/semesters/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse);

export const getSubjects = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/curriculum/subjects?${qs}`, { headers: authHeaders() }).then(handleResponse);
};
export const createSubject = (data) =>
  fetch(`${BASE_URL}/admin/curriculum/subjects`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const updateSubject = (id, data) =>
  fetch(`${BASE_URL}/admin/curriculum/subjects/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const deleteSubject = (id) =>
  fetch(`${BASE_URL}/admin/curriculum/subjects/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse);

// Exam Schedules
export const getExamSchedules = () =>
  fetch(`${BASE_URL}/admin/exam-schedules`, { headers: authHeaders() }).then(handleResponse);
export const createExamSchedule = (data) =>
  fetch(`${BASE_URL}/admin/exam-schedules`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const updateExamSchedule = (id, data) =>
  fetch(`${BASE_URL}/admin/exam-schedules/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const deleteExamSchedule = (id) =>
  fetch(`${BASE_URL}/admin/exam-schedules/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse);
export const publishExamSchedule = (id) =>
  fetch(`${BASE_URL}/admin/exam-schedules/${id}/publish`, { method: 'PUT', headers: authHeaders() }).then(handleResponse);
export const publishAllSchedules = () =>
  fetch(`${BASE_URL}/admin/exam-schedules/publish-all`, { method: 'PUT', headers: authHeaders() }).then(handleResponse);

// Marks
export const getInternalMarks = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/marks/internal?${qs}`, { headers: authHeaders() }).then(handleResponse);
};
export const saveInternalMarks = (data) =>
  fetch(`${BASE_URL}/admin/marks/internal`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const getExternalMarks = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/marks/external?${qs}`, { headers: authHeaders() }).then(handleResponse);
};
export const saveExternalMarks = (data) =>
  fetch(`${BASE_URL}/admin/marks/external`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const computeResults = (data) =>
  fetch(`${BASE_URL}/admin/marks/compute-results`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);

// Results
export const getResults = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/results?${qs}`, { headers: authHeaders() }).then(handleResponse);
};
export const publishResults = (data) =>
  fetch(`${BASE_URL}/admin/results/publish`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const getResultsSummary = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/results/summary?${qs}`, { headers: authHeaders() }).then(handleResponse);
};
export const getHallTicket = (studentId) =>
  fetch(`${BASE_URL}/admin/results/hall-ticket/${studentId}`, { headers: authHeaders() }).then(handleResponse);

// OBE
export const getCourseOutcomes = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/obe/cos?${qs}`, { headers: authHeaders() }).then(handleResponse);
};
export const saveCourseOutcome = (data) =>
  fetch(`${BASE_URL}/admin/obe/cos`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const getCoPo = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/obe/co-po?${qs}`, { headers: authHeaders() }).then(handleResponse);
};
export const saveCoPo = (data) =>
  fetch(`${BASE_URL}/admin/obe/co-po`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const getObeAttainment = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/obe/attainment?${qs}`, { headers: authHeaders() }).then(handleResponse);
};

// Audit
export const getAuditLogs = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/audit?${qs}`, { headers: authHeaders() }).then(handleResponse);
};

// Faculty Portal API calls
export const getFacultySubjects = () =>
  fetch(`${BASE_URL}/faculty/subjects`, { headers: authHeaders() }).then(handleResponse);

export const getFacultySubjectStudents = (subjectId) =>
  fetch(`${BASE_URL}/faculty/subjects/${subjectId}/students`, { headers: authHeaders() }).then(handleResponse);

export const saveFacultyMarks = (data) =>
  fetch(`${BASE_URL}/faculty/marks`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);

export const getFacultySubjectCos = (subjectId) =>
  fetch(`${BASE_URL}/faculty/subjects/${subjectId}/cos`, { headers: authHeaders() }).then(handleResponse);

export const saveFacultyCo = (data) =>
  fetch(`${BASE_URL}/faculty/cos`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);

export const getFacultySubjectCoPo = (subjectId) =>
  fetch(`${BASE_URL}/faculty/subjects/${subjectId}/co-po`, { headers: authHeaders() }).then(handleResponse);

export const saveFacultyCoPo = (data) =>
  fetch(`${BASE_URL}/faculty/co-po`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);

export const getFacultyObeReports = () =>
  fetch(`${BASE_URL}/faculty/obe/attainment`, { headers: authHeaders() }).then(handleResponse);

// Student Portal API calls
export const getStudentProfile = () =>
  fetch(`${BASE_URL}/student/profile`, { headers: authHeaders() }).then(handleResponse);

export const getStudentHallTicket = () =>
  fetch(`${BASE_URL}/student/hall-ticket`, { headers: authHeaders() }).then(handleResponse);

export const getStudentResults = () =>
  fetch(`${BASE_URL}/student/results`, { headers: authHeaders() }).then(handleResponse);

