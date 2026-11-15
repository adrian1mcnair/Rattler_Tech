# RattlerTech Backend (Node.js / Express / MySQL)

REST API for RattlerTech, the FAMU IT support ticket system. Students and faculty submit tickets. IT staff assign them, set priorities, update status, and leave comments.

## Tech stack
- **Node.js + Express 5**: the web server and routes
- **MySQL**: the database, accessed with `mysql2` through a connection pool
- **bcryptjs**: hashes passwords (plain-text passwords are never stored)
- **cors**: lets the React frontend call the API (needed in Milestone 4)

## Project structure
```
rattlertech-backend/
├── db/
│   ├── schema.sql          # creates the database + 5 related tables
│   └── seed.sql            # sample users, categories, tickets, assignments, comments
├── scripts/initDb.js       # runs schema.sql + seed.sql (npm run db:init)
├── src/
│   ├── server.js           # app entry point
│   ├── config/db.js        # MySQL connection pool
│   ├── middleware/errorHandler.js
│   ├── utils/validation.js # allowed roles/statuses/priorities + helpers
│   └── routes/
│       ├── auth.js         # /api/auth
│       ├── users.js        # /api/users
│       ├── categories.js   # /api/categories
│       ├── tickets.js      # /api/tickets (+ assign + comments)
│       └── stats.js        # /api/stats
├── RattlerTech.postman_collection.json
└── .env.example
```

## Database design

| Table | Purpose | Relationships |
|---|---|---|
| `users` | students, faculty, technicians, admins | — |
| `categories` | Wi-Fi, Software, Account Access, Hardware, Email | — |
| `tickets` | support requests | `created_by` → users, `category_id` → categories |
| `assignments` | technician assigned to each ticket | `ticket_id` → tickets, `technician_id` / `assigned_by` → users |
| `ticket_comments` | updates and messages on a ticket | `ticket_id` → tickets, `user_id` → users |

- One user → many tickets. One category → many tickets. One ticket → many comments. One ticket → one active assignment.
- Deleting a ticket also deletes its assignment and comments (`ON DELETE CASCADE`). A category can't be deleted while tickets still use it (`ON DELETE RESTRICT`).

**Allowed values**
- Roles: `student`, `faculty`, `technician`, `admin`
- Priority: `Low`, `Medium`, `High`, `Critical`
- Status: `Open`, `In Progress`, `Resolved`, `Closed`

## Setup

1. Install [Node.js](https://nodejs.org) (v18+) and MySQL Server.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment file:
   ```bash
   cp .env.example .env      # Windows: copy .env.example .env
   ```
   Put your MySQL username and password in `.env`.
4. Create the database and sample data (**this wipes and recreates `rattlertech`**):
   ```bash
   npm run db:init
   ```
   Or run `db/schema.sql` and then `db/seed.sql` in MySQL Workbench.
5. Start the server:
   ```bash
   npm run dev     # auto-restarts on file changes
   # or
   npm start
   ```
   You should see:
   ```
   Connected to MySQL database: rattlertech
   RattlerTech API running at http://localhost:5001
   ```
6. Open `http://localhost:5001/api/health`. It should return `{"status":"ok","database":"connected"}`.

All sample accounts use the password **`password123`**. Example: `tasha.davis@famu.edu` (technician), `denise.carter@famu.edu` (admin), `jordan.williams@famu.edu` (student).

## API endpoints

Base URL: `http://localhost:5001/api`

### Auth
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | Checks credentials and returns the user |

### Users
| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/users` | — | List users (`?role=technician` to filter) |
| GET | `/users/:id` | — | One user + number of tickets submitted |
| POST | `/users` | `{ first_name, last_name, email, password, role? }` | Register a user |
| PATCH | `/users/:id` | any of `{ first_name, last_name, email, role }` | Update a user |
| DELETE | `/users/:id` | — | Delete a user |

### Categories
| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/categories` | — | List categories with ticket counts |
| POST | `/categories` | `{ name, description? }` | Add a category |
| DELETE | `/categories/:id` | — | Delete an unused category |

### Tickets
| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/tickets` | — | List tickets, most urgent first. Filters: `status`, `priority`, `category_id`, `created_by`, `assigned_to` (id or `none`), `search` |
| GET | `/tickets/:id` | — | One ticket, including its comments |
| POST | `/tickets` | `{ title, description, category_id, created_by, priority? }` | Submit a ticket (status starts `Open`) |
| PATCH | `/tickets/:id` | any of `{ status, priority, title, description, category_id }` | Update a ticket |
| DELETE | `/tickets/:id` | — | Delete a ticket |
| POST | `/tickets/:id/assign` | `{ technician_id, assigned_by? }` | Assign or reassign a technician. An `Open` ticket moves to `In Progress` |
| DELETE | `/tickets/:id/assign` | — | Remove the assignment |
| GET | `/tickets/:id/comments` | — | List comments |
| POST | `/tickets/:id/comments` | `{ user_id, message }` | Add a comment |

### Stats
| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Totals by status and priority, unassigned count, active tickets per technician |

### Example ticket response
```json
{
  "ticket_id": 4,
  "title": "Classroom projector not displaying",
  "description": "Projector in room 210 powers on but shows no input from the podium PC.",
  "priority": "High",
  "status": "In Progress",
  "category_id": 4,
  "category": "Hardware",
  "created_by": 3,
  "created_by_name": "Marcus Johnson",
  "assigned_to": 5,
  "assigned_to_name": "Kevin Thomas",
  "assigned_at": "2026-11-15 11:37:19",
  "created_at": "2026-11-15 11:37:19",
  "updated_at": "2026-11-15 11:37:19"
}
```

### Errors
Errors come back as JSON in the form `{ "error": "message" }` with a matching status code:
`400` invalid or missing data, `401` bad login, `404` not found, `409` duplicate or still in use, `500` server error.

## Testing / demo
Import `RattlerTech.postman_collection.json` into Postman (or the Thunder Client VS Code extension). All requests use the `baseUrl` variable (`http://localhost:5001/api`). Run `npm run db:init` before a demo to reset the sample data.

## Milestone 4 notes (connecting the frontend)
- CORS is already enabled, so the React app can call `http://localhost:5001/api/...` directly.
- The frontend should use the field names shown above (snake_case).
- `/auth/login` only checks the password right now. Session tokens (JWT) and role-based route protection can be added when the frontend is connected.
