-- ============================================================
-- Examination ERP System - Database Schema
-- Anna University Regulation 2025
-- ============================================================

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL DEFAULT 'Administrator',
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Semesters
CREATE TABLE IF NOT EXISTS semesters (
  id SERIAL PRIMARY KEY,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  semester_number INT NOT NULL,
  academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
  regulation VARCHAR(20) DEFAULT '2025',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(department_id, semester_number, academic_year)
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  semester_id INT REFERENCES semesters(id) ON DELETE CASCADE,
  subject_code VARCHAR(20) UNIQUE NOT NULL,
  subject_name VARCHAR(150) NOT NULL,
  credits INT DEFAULT 3,
  subject_type VARCHAR(20) DEFAULT 'theory' CHECK (subject_type IN ('theory','practical','elective')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Faculty
CREATE TABLE IF NOT EXISTS faculty (
  id SERIAL PRIMARY KEY,
  faculty_id VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  designation VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Faculty-Subject assignment
CREATE TABLE IF NOT EXISTS faculty_subjects (
  id SERIAL PRIMARY KEY,
  faculty_id INT REFERENCES faculty(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE(faculty_id, subject_id)
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  register_number VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  semester_id INT REFERENCES semesters(id) ON DELETE SET NULL,
  date_of_birth DATE,
  phone VARCHAR(15),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Student-Subject enrollment
CREATE TABLE IF NOT EXISTS student_subjects (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE(student_id, subject_id)
);

-- Exam Schedules
CREATE TABLE IF NOT EXISTS exam_schedules (
  id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  session VARCHAR(20) DEFAULT 'FN' CHECK (session IN ('FN','AN')),
  start_time TIME,
  end_time TIME,
  venue VARCHAR(100),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Internal Marks (Model 1, Model 2, Practical)
CREATE TABLE IF NOT EXISTS internal_marks (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  model1_marks NUMERIC(5,2) DEFAULT 0 CHECK (model1_marks >= 0 AND model1_marks <= 100),
  model2_marks NUMERIC(5,2) DEFAULT 0 CHECK (model2_marks >= 0 AND model2_marks <= 100),
  practical_marks NUMERIC(5,2) DEFAULT 0 CHECK (practical_marks >= 0 AND practical_marks <= 100),
  internal_total NUMERIC(5,2) GENERATED ALWAYS AS (
    ROUND(((GREATEST(model1_marks, model2_marks) / 100.0) * 40), 2)
  ) STORED,
  entered_by INT REFERENCES faculty(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- External Marks (University Exam)
CREATE TABLE IF NOT EXISTS external_marks (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(5,2) DEFAULT 0 CHECK (marks_obtained >= 0 AND marks_obtained <= 100),
  external_total NUMERIC(5,2) GENERATED ALWAYS AS (
    ROUND((marks_obtained / 100.0) * 60, 2)
  ) STORED,
  entered_by INT REFERENCES admins(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- Final Results
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  internal_total NUMERIC(5,2) DEFAULT 0,
  external_total NUMERIC(5,2) DEFAULT 0,
  final_score NUMERIC(5,2) GENERATED ALWAYS AS (internal_total + external_total) STORED,
  grade VARCHAR(5),
  pass_fail VARCHAR(10),
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  published_by INT REFERENCES admins(id) ON DELETE SET NULL,
  UNIQUE(student_id, subject_id)
);

-- Course Outcomes
CREATE TABLE IF NOT EXISTS course_outcomes (
  id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  co_number INT NOT NULL CHECK (co_number BETWEEN 1 AND 5),
  description TEXT NOT NULL,
  created_by INT REFERENCES faculty(id) ON DELETE SET NULL,
  UNIQUE(subject_id, co_number)
);

-- CO-PO Mappings
CREATE TABLE IF NOT EXISTS co_po_mappings (
  id SERIAL PRIMARY KEY,
  co_id INT REFERENCES course_outcomes(id) ON DELETE CASCADE,
  po_number INT NOT NULL CHECK (po_number BETWEEN 1 AND 12),
  mapping_value INT NOT NULL CHECK (mapping_value BETWEEN 0 AND 3),
  UNIQUE(co_id, po_number)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_type VARCHAR(20) NOT NULL DEFAULT 'admin',
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_sem ON students(semester_id);
CREATE INDEX IF NOT EXISTS idx_subjects_sem ON subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_internal_marks_student ON internal_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_external_marks_student ON external_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_date ON exam_schedules(exam_date);
