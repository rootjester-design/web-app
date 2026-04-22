-- ═══════════════════════════════════════════════════════
--  MyClassRoom.LK  —  Database Schema + Seed Data
--  Run: mysql -u root -p < database.sql
-- ═══════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS myclassroom_lk
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE myclassroom_lk;

-- ── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,       -- bcrypt hash
  role        ENUM('student','admin') NOT NULL DEFAULT 'student',
  avatar      VARCHAR(255) DEFAULT NULL,
  bio         TEXT DEFAULT NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB;

-- ── Courses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  instructor   VARCHAR(100) NOT NULL,
  thumbnail    VARCHAR(255) DEFAULT NULL,
  category     VARCHAR(80)  DEFAULT 'General',
  level        ENUM('Beginner','Intermediate','Advanced') DEFAULT 'Beginner',
  duration     VARCHAR(40)  DEFAULT NULL,   -- e.g. "12 hours"
  video_url    VARCHAR(255) DEFAULT NULL,
  price        DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  is_published TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_level    (level)
) ENGINE=InnoDB;

-- ── Enrollments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  course_id   INT UNSIGNED NOT NULL,
  progress    TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 0–100
  status      ENUM('active','completed','paused') NOT NULL DEFAULT 'active',
  enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enrollment (user_id, course_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_user   (user_id),
  INDEX idx_course (course_id)
) ENGINE=InnoDB;

-- ── Password Reset Tokens ────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token      VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used       TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
) ENGINE=InnoDB;

-- ════════════════════════════════════════════════════════
--  SEED DATA
-- ════════════════════════════════════════════════════════

-- Admin user  (password: Admin@1234)
INSERT INTO users (full_name, email, password, role, is_verified) VALUES
('Admin User', 'admin@myclassroom.lk',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewP.zJkFbMpE5.yC',
 'admin', 1);

-- Demo student  (password: Student@1234)
INSERT INTO users (full_name, email, password, role, is_verified) VALUES
('Dilanka Silva', 'student@myclassroom.lk',
 '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC0.B7uDjE8n5M0F7F66',
 'student', 1);

-- Courses
INSERT INTO courses (title, description, instructor, category, level, duration, price) VALUES
('Combined Mathematics — A/L Full Course',
 'Master all Combined Maths topics for the Sri Lankan A/L exam. Includes mechanics, pure math, statistics, and past paper walkthroughs.',
 'Mr. Amal Kumarasinghe', 'Mathematics', 'Advanced', '48 hours', 0.00),

('Physics — Mechanics & Modern Physics',
 'Comprehensive A/L Physics covering kinematics, dynamics, waves, electricity, and quantum physics with interactive demonstrations.',
 'Ms. Sanduni Rathnayake', 'Science', 'Advanced', '40 hours', 0.00),

('Biology — Cell Biology & Genetics',
 'Deep dive into cellular biology, DNA, genetics, ecology and evolution. Includes diagram practice and essay techniques.',
 'Dr. Nimal Perera', 'Science', 'Advanced', '36 hours', 0.00),

('ICT — Programming & Web Design',
 'Learn Python programming, database design, HTML/CSS/JS web development and networking fundamentals for A/L ICT.',
 'Mr. Thiran Wickramasinghe', 'Technology', 'Intermediate', '52 hours', 0.00),

('Chemistry — Organic & Physical',
 'Complete O/L and A/L chemistry: atomic structure, bonding, reaction mechanisms, electrochemistry and organic chemistry.',
 'Ms. Kavindi Fernando', 'Science', 'Intermediate', '44 hours', 0.00),

('English Language — O/L Mastery',
 'Build reading comprehension, grammar, writing skills and oral communication for O/L English examinations.',
 'Ms. Priya Mendis', 'Languages', 'Beginner', '28 hours', 0.00);

-- Enroll demo student in first 3 courses
INSERT INTO enrollments (user_id, course_id, progress, status) VALUES
(2, 1, 68, 'active'),
(2, 2, 42, 'active'),
(2, 3, 15, 'active');
