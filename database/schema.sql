-- ═══════════════════════════════════════════════════════════
-- CAMPUS CONNECT — Oracle SQL Schema
-- Run this in SQL Developer or SQL*Plus
-- ═══════════════════════════════════════════════════════════

-- Drop tables if re-running (order matters due to FK)
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE certificates';   EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE registrations';  EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE events';         EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE users';          EXCEPTION WHEN OTHERS THEN NULL;
END;
/

-- ─── USERS ────────────────────────────────────────────────────
CREATE TABLE users (
  id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       VARCHAR2(100)  NOT NULL,
  username   VARCHAR2(50)   NOT NULL,
  email      VARCHAR2(100)  NOT NULL,
  password   VARCHAR2(255)  NOT NULL,
  role       VARCHAR2(10)   DEFAULT 'student'
               CONSTRAINT chk_role CHECK (role IN ('student','admin')),
  created_at TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_username UNIQUE (username),
  CONSTRAINT uq_email    UNIQUE (email)
);

-- ─── EVENTS ───────────────────────────────────────────────────
CREATE TABLE events (
  id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR2(150)  NOT NULL,
  description CLOB,
  event_date  DATE           NOT NULL,
  event_time  VARCHAR2(5)    NOT NULL,
  category    VARCHAR2(20)   DEFAULT 'Other'
                CONSTRAINT chk_category CHECK (
                  category IN ('Workshop','Hackathon','Seminar','Competition','Cultural','Other')
                ),
  status      VARCHAR2(10)   DEFAULT 'pending'
                CONSTRAINT chk_ev_status CHECK (status IN ('pending','approved','rejected')),
  created_by  NUMBER,
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_user FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ─── REGISTRATIONS ────────────────────────────────────────────
CREATE TABLE registrations (
  id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       NUMBER     NOT NULL,
  event_id      NUMBER     NOT NULL,
  registered_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_reg     UNIQUE (user_id, event_id),
  CONSTRAINT fk_reg_usr FOREIGN KEY (user_id)  REFERENCES users(id),
  CONSTRAINT fk_reg_evt FOREIGN KEY (event_id) REFERENCES events(id)
);

-- ─── CERTIFICATES ─────────────────────────────────────────────
CREATE TABLE certificates (
  id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id   NUMBER      NOT NULL,
  event_id  NUMBER      NOT NULL,
  status    VARCHAR2(10) DEFAULT 'pending'
              CONSTRAINT chk_cert_status CHECK (status IN ('pending','approved','rejected')),
  issued_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cert_usr FOREIGN KEY (user_id)  REFERENCES users(id),
  CONSTRAINT fk_cert_evt FOREIGN KEY (event_id) REFERENCES events(id)
);

-- ─── SEED: Default Admin ───────────────────────────────────────
-- Password is: admin123
-- bcrypt hash generated with saltRounds=10
INSERT INTO users (name, username, email, password, role)
VALUES (
  'Admin User',
  'admin',
  'admin@campus.edu',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
);

-- ─── SEED: Sample Student ─────────────────────────────────────
-- Password is: student123
INSERT INTO users (name, username, email, password, role)
VALUES (
  'John Doe',
  'johndoe',
  'john@campus.edu',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'student'
);

COMMIT;
