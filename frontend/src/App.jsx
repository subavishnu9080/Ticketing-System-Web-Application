import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, LogOut, RefreshCw, LayoutDashboard } from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import TicketForm from './components/TicketForm';
import TicketDetail from './components/TicketDetail';

const API_BASE = 'http://localhost:5000';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Drawer / Modal States
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Toast Notification Trigger
  const showToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTickets([]);
    setUsers([]);
    localStorage.removeItem('user');
    showToast('Logged out successfully', 'info');
  };

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (priorityFilter) queryParams.append('priority', priorityFilter);
      if (assigneeFilter) queryParams.append('assignee', assigneeFilter);

      const response = await fetch(`${API_BASE}/api/tickets?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tickets');
      }

      setTickets(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser, search, statusFilter, priorityFilter, assigneeFilter, showToast]);

  // Fetch Users (for assignment dropdown)
  const fetchUsers = useCallback(async () => {
    if (!currentUser || currentUser.role === 'user') return;

    try {
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch user list:', err);
    }
  }, [currentUser]);

  // Auto-reload data when filters change or user logs in
  useEffect(() => {
    if (currentUser) {
      fetchTickets();
      fetchUsers();
    }
  }, [currentUser, search, statusFilter, priorityFilter, assigneeFilter, fetchTickets, fetchUsers]);

  // Ticket CRUD Handlers
  const handleTicketCreated = (newTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setShowCreateForm(false);
  };

  const handleTicketUpdated = (updatedTicket) => {
    setTickets((prev) => 
      prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
    );
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action is permanent.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete ticket');
      }

      showToast('Ticket deleted successfully', 'success');
      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
      if (selectedTicketId === ticketId) {
        setSelectedTicketId(null);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!currentUser) {
    return (
      <>
        <Auth onLoginSuccess={handleLoginSuccess} showToast={showToast} />
        {/* Render Toast notifications outside auth */}
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="brand" onClick={() => {
          setSearch('');
          setStatusFilter('');
          setPriorityFilter('');
          setAssigneeFilter('');
        }}>
          <ShieldAlert className="brand-icon" size={26} />
          <span>Demo Ticket</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="user-badge">
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{currentUser.username}</span>
            <span className={`role-chip role-${currentUser.role}`}>{currentUser.role}</span>
          </div>

          <button onClick={fetchTickets} className="btn-icon" title="Sync Data" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin-animation' : ''} />
          </button>

          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem' }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Dashboard statistics section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <LayoutDashboard size={20} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Operational Insights</h2>
        </div>
        <Dashboard tickets={tickets} />

        {/* Ticket List and toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
          <ShieldAlert size={20} style={{ color: 'var(--secondary)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Service Tickets</h2>
        </div>
        
        <TicketList 
          tickets={tickets} 
          users={users}
          currentUser={currentUser}
          onSelectTicket={setSelectedTicketId} 
          onDeleteTicket={handleDeleteTicket}
          onOpenCreateForm={() => setShowCreateForm(true)}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          assigneeFilter={assigneeFilter}
          setAssigneeFilter={setAssigneeFilter}
        />
      </main>

      {/* Ticket Create Form Modal */}
      {showCreateForm && (
        <TicketForm 
          currentUser={currentUser} 
          onClose={() => setShowCreateForm(false)} 
          onSubmitSuccess={handleTicketCreated} 
          showToast={showToast}
        />
      )}

      {/* Ticket Detail Side Drawer */}
      {selectedTicketId && (
        <TicketDetail 
          ticketId={selectedTicketId} 
          currentUser={currentUser} 
          users={users}
          onClose={() => setSelectedTicketId(null)} 
          onTicketUpdated={handleTicketUpdated}
          showToast={showToast}
        />
      )}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
