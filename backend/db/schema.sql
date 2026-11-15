-- =====================================================================
-- RattlerTech database schema
-- Five related tables:
--   users            - students, faculty, technicians, admins
--   categories       - type of problem (Wi-Fi, Software, Account Access...)
--   tickets          - support requests (belongs to a user + a category)
--   assignments      - which technician is working a ticket
--   ticket_comments  - conversation / work notes on a ticket
-- =====================================================================

DROP DATABASE IF EXISTS rattlertech;
CREATE DATABASE rattlertech;
USE rattlertech;

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(50)  NOT NULL,
  last_name     VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student', 'faculty', 'technician', 'admin') NOT NULL DEFAULT 'student',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,
  description VARCHAR(255)
);

-- ---------------------------------------------------------------------
-- TICKETS
--   created_by  -> users      (one user has many tickets)
--   category_id -> categories (one category has many tickets)
-- ---------------------------------------------------------------------
CREATE TABLE tickets (
  ticket_id   INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  description TEXT         NOT NULL,
  priority    ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
  status      ENUM('Open', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
  category_id INT NOT NULL,
  created_by  INT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tickets_category FOREIGN KEY (category_id)
    REFERENCES categories(category_id) ON DELETE RESTRICT,
  CONSTRAINT fk_tickets_creator FOREIGN KEY (created_by)
    REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- ASSIGNMENTS
--   One active technician per ticket (UNIQUE ticket_id).
--   Reassigning a ticket updates this row.
-- ---------------------------------------------------------------------
CREATE TABLE assignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id     INT NOT NULL UNIQUE,
  technician_id INT NOT NULL,
  assigned_by   INT NULL,
  assigned_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assign_ticket FOREIGN KEY (ticket_id)
    REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  CONSTRAINT fk_assign_technician FOREIGN KEY (technician_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_assign_by FOREIGN KEY (assigned_by)
    REFERENCES users(user_id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- TICKET COMMENTS
--   one ticket has many comments; each comment is written by a user
-- ---------------------------------------------------------------------
CREATE TABLE ticket_comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id  INT  NOT NULL,
  user_id    INT  NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id)
    REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE
);
