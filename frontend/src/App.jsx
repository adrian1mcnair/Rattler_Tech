
import { useState } from 'react'
import './App.css'

function App() {
  const [page, setPage] = useState('dashboard')
  const [tickets, setTickets] = useState([
    {
      id: 1001,
      title: 'Campus Wi-Fi not connecting',
      category: 'Network',
      priority: 'High',
      status: 'Open'
    },
    {
      id: 1002,
      title: 'Microsoft Office installation issue',
      category: 'Software',
      priority: 'Medium',
      status: 'In Progress'
    },
    {
      id: 1003,
      title: 'Password reset assistance',
      category: 'Account Access',
      priority: 'Low',
      status: 'Resolved'
    }
  ])

  const [form, setForm] = useState({
    title: '',
    category: 'Network',
    priority: 'Medium',
    description: ''
  })

  const openTickets = tickets.filter(t => t.status === 'Open').length
  const progressTickets = tickets.filter(t => t.status === 'In Progress').length
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length

  function submitTicket(e) {
    e.preventDefault()

    if (!form.title.trim() || !form.description.trim()) {
      alert('Please complete all required fields.')
      return
    }

    const newTicket = {
      ...form,
      id: Math.max(1000, ...tickets.map(t => t.id)) + 1,
      status: 'Open'
    }

    setTickets([...tickets, newTicket])
    setForm({
      title: '',
      category: 'Network',
      priority: 'Medium',
      description: ''
    })
    setPage('tickets')
  }

  function updateTicket(id, field, value) {
    setTickets(tickets.map(ticket =>
      ticket.id === id ? { ...ticket, [field]: value } : ticket
    ))
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>RattlerTech</h2>
            <p>FAMU IT Help Desk</p>
          </div>
        </div>

        <nav>
          <button
            className={page === 'dashboard' ? 'active' : ''}
            onClick={() => setPage('dashboard')}
          >
            Dashboard
          </button>

          <button
            className={page === 'submit' ? 'active' : ''}
            onClick={() => setPage('submit')}
          >
            Submit Ticket
          </button>

          <button
            className={page === 'tickets' ? 'active' : ''}
            onClick={() => setPage('tickets')}
          >
            My Tickets
          </button>

          <button
            className={page === 'staff' ? 'active' : ''}
            onClick={() => setPage('staff')}
          >
            IT Staff Dashboard
          </button>
        </nav>

        <div className="sidebar-footer">
          Florida A&M University
          <span>Frontend Demo</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Florida A&M University</p>
            <h1>
              {page === 'dashboard' && 'Help Desk Dashboard'}
              {page === 'submit' && 'Submit a Support Ticket'}
              {page === 'tickets' && 'My Support Tickets'}
              {page === 'staff' && 'IT Staff Dashboard'}
            </h1>
          </div>
          <span className="demo-badge">Demo Mode</span>
        </header>

        {page === 'dashboard' && (
          <>
            <div className="welcome">
              <h2>Welcome to RattlerTech!</h2>
              <p>
                Your central hub for reporting and tracking
                technology support requests at FAMU.
              </p>
              <button onClick={() => setPage('submit')}>
                + Create New Ticket
              </button>
            </div>

            <div className="stats">
              <div className="stat-card">
                <p>Total Tickets</p>
                <h2>{tickets.length}</h2>
              </div>
              <div className="stat-card">
                <p>Open Tickets</p>
                <h2>{openTickets}</h2>
              </div>
              <div className="stat-card">
                <p>In Progress</p>
                <h2>{progressTickets}</h2>
              </div>
              <div className="stat-card">
                <p>Resolved</p>
                <h2>{resolvedTickets}</h2>
              </div>
            </div>

            <div className="panel">
              <h2>Recent Support Requests</h2>
              <TicketTable tickets={tickets.slice(-5).reverse()} />
            </div>
          </>
        )}

        {page === 'submit' && (
          <div className="panel form-panel">
            <h2>Report a Technical Issue</h2>
            <p className="muted">
              Provide details so the IT team can assist you.
            </p>

            <form onSubmit={submitTicket}>
              <label htmlFor="title">Issue Title</label>
              <input
                id="title"
                required
                value={form.title}
                placeholder="Example: Unable to connect to Wi-Fi"
                onChange={e => setForm({
                  ...form, title: e.target.value
                })}
              />

              <label htmlFor="category">Issue Category</label>
              <select
                id="category"
                value={form.category}
                onChange={e => setForm({
                  ...form, category: e.target.value
                })}
              >
                <option>Network</option>
                <option>Software</option>
                <option>Hardware</option>
                <option>Account Access</option>
                <option>Other</option>
              </select>

              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={form.priority}
                onChange={e => setForm({
                  ...form, priority: e.target.value
                })}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                required
                rows="5"
                value={form.description}
                placeholder="Describe your technical issue..."
                onChange={e => setForm({
                  ...form, description: e.target.value
                })}
              />

              <button type="submit" className="primary-btn">
                Submit Support Ticket
              </button>
            </form>
          </div>
        )}

        {page === 'tickets' && (
          <div className="panel">
            <div className="section-heading">
              <h2>Support Ticket History</h2>
              <button onClick={() => setPage('submit')}>
                + New Ticket
              </button>
            </div>
            <TicketTable tickets={tickets} />
          </div>
        )}

        {page === 'staff' && (
          <div className="panel">
            <h2>Manage Support Tickets</h2>
            <p className="muted">
              Update ticket priorities, assignments and statuses.
            </p>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Issue</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td>#{ticket.id}</td>
                      <td>{ticket.title}</td>
                      <td>
                        <select
                          value={ticket.priority}
                          onChange={e => updateTicket(
                            ticket.id, 'priority', e.target.value
                          )}
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={ticket.assignedTo || 'Unassigned'}
                          onChange={e => updateTicket(
                            ticket.id, 'assignedTo', e.target.value
                          )}
                        >
                          <option>Unassigned</option>
                          <option>Technician A</option>
                          <option>Technician B</option>
                          <option>Technician C</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={ticket.status}
                          onChange={e => updateTicket(
                            ticket.id, 'status', e.target.value
                          )}
                        >
                          <option>Open</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function TicketTable({ tickets }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Issue</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.id}>
              <td>#{ticket.id}</td>
              <td>{ticket.title}</td>
              <td>{ticket.category}</td>
              <td>
                <span className={`priority ${ticket.priority.toLowerCase()}`}>
                  {ticket.priority}
                </span>
              </td>
              <td>
                <span className={`status ${ticket.status.toLowerCase().replace(' ', '-')}`}>
                  {ticket.status}
                </span>
              </td>
            </tr>
          ))}
          {tickets.length === 0 && (
            <tr>
              <td colSpan="5">No tickets available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default App
  