-- =====================================================================
-- RattlerTech sample data
-- Every seeded user's password is: password123
-- =====================================================================
USE rattlertech;

INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES
  ('Jordan',  'Williams', 'jordan.williams@famu.edu', '$2b$10$f1Y7uCxByRGknsZGIPAcZeDjme4tnGYCV23GDYU60xAp7tfLdkdKO', 'student'),
  ('Aaliyah', 'Brown',    'aaliyah.brown@famu.edu',   '$2b$10$f1Y7uCxByRGknsZGIPAcZeDjme4tnGYCV23GDYU60xAp7tfLdkdKO', 'student'),
  ('Marcus',  'Johnson',  'marcus.johnson@famu.edu',  '$2b$10$f1Y7uCxByRGknsZGIPAcZeDjme4tnGYCV23GDYU60xAp7tfLdkdKO', 'faculty'),
  ('Tasha',   'Davis',    'tasha.davis@famu.edu',     '$2b$10$f1Y7uCxByRGknsZGIPAcZeDjme4tnGYCV23GDYU60xAp7tfLdkdKO', 'technician'),
  ('Kevin',   'Thomas',   'kevin.thomas@famu.edu',    '$2b$10$f1Y7uCxByRGknsZGIPAcZeDjme4tnGYCV23GDYU60xAp7tfLdkdKO', 'technician'),
  ('Denise',  'Carter',   'denise.carter@famu.edu',   '$2b$10$f1Y7uCxByRGknsZGIPAcZeDjme4tnGYCV23GDYU60xAp7tfLdkdKO', 'admin');

INSERT INTO categories (name, description) VALUES
  ('Wi-Fi',          'Campus wireless and network connectivity'),
  ('Software',       'Installed applications, licenses and software errors'),
  ('Account Access', 'Login, password resets, iRattler and Canvas access'),
  ('Hardware',       'Lab computers, printers, projectors and devices'),
  ('Email',          'FAMU email and Outlook problems');

INSERT INTO tickets (title, description, priority, status, category_id, created_by) VALUES
  ('Cannot connect to FAMU Wi-Fi in Coleman Library',
   'My laptop sees the network but fails to authenticate on the 3rd floor.',
   'High', 'Open', 1, 1),
  ('MATLAB license error in Benjamin Banneker lab',
   'MATLAB says the license server is unavailable on lab machine #14.',
   'Medium', 'In Progress', 2, 2),
  ('Locked out of iRattler account',
   'Too many failed login attempts and the reset link is not arriving.',
   'Critical', 'Open', 3, 1),
  ('Classroom projector not displaying',
   'Projector in room 210 powers on but shows no input from the podium PC.',
   'High', 'In Progress', 4, 3),
  ('Outlook not syncing on phone',
   'FAMU email stopped syncing on my iPhone after a password change.',
   'Low', 'Resolved', 5, 2);

INSERT INTO assignments (ticket_id, technician_id, assigned_by) VALUES
  (2, 4, 6),
  (4, 5, 6),
  (5, 4, 6);

INSERT INTO ticket_comments (ticket_id, user_id, message) VALUES
  (2, 4, 'Restarting the license service on the lab server. Will update shortly.'),
  (4, 5, 'Replacing the HDMI cable at the podium this afternoon.'),
  (4, 3, 'Thank you - I have a class there at 2 PM.'),
  (5, 4, 'Removed and re-added the account on the device. Sync is working now.'),
  (5, 2, 'Confirmed, it is working. Thanks!');
