import React, { useState } from 'react';
import { Search, Trash2, Filter, AlertCircle, Plus, Eye, User as UserIcon, Calendar } from 'lucide-react';

export default function TicketList({ 
  tickets, 
  users, 
  currentUser, 
  onSelectTicket, 
  onDeleteTicket, 
  onOpenCreateForm,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter
}) {
  const getStatusBadgeClass = (status) => {
    return `badge badge-status-${status}`;
  };

  const getPriorityBadgeClass = (priority) => {
    return `badge badge-priority-${priority}`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isAdmin = currentUser && currentUser.role === 'admin';

  return (
    <div>
      <div className="toolbar">
        <div className="search-filter-group">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search tickets by title/description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select 
              className="input-field" 
              style={{ width: 'auto', paddingLeft: '1rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select 
              className="input-field" 
              style={{ width: 'auto', paddingLeft: '1rem' }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            {currentUser && currentUser.role !== 'user' && (
              <select 
                className="input-field" 
                style={{ width: 'auto', paddingLeft: '1rem' }}
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.username} ({u.role})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <button 
          onClick={onOpenCreateForm} 
          className="btn btn-primary"
        >
          <Plus size={18} />
          New Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" />
          <h3>No tickets found</h3>
          <p>Try clearing your search query or adjusting your filters, or create a new ticket to get started.</p>
        </div>
      ) : (
        <div className="tickets-grid">
          {tickets.map((ticket) => (
            <div 
              key={ticket._id} 
              className="ticket-card"
              onClick={() => onSelectTicket(ticket._id)}
            >
              <div className="ticket-header">
                <div className="ticket-title-area">
                  <span className="ticket-category-tag">{ticket.category || 'General'}</span>
                  <h3 className="ticket-title">{ticket.title}</h3>
                </div>
                <div className="ticket-badges">
                  <span className={getStatusBadgeClass(ticket.status)}>
                    {ticket.status}
                  </span>
                  <span className={getPriorityBadgeClass(ticket.priority)}>
                    {ticket.priority} priority
                  </span>
                </div>
              </div>

              <p className="ticket-description">{ticket.description}</p>

              <div className="ticket-footer">
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div className="ticket-author-info">
                    <UserIcon size={14} />
                    <span>Created by: <strong>{ticket.createdBy?.username || 'System'}</strong></span>
                  </div>
                  <div className="ticket-assignee-info">
                    <UserIcon size={14} style={{ color: ticket.assignee ? 'var(--secondary)' : 'var(--text-muted)' }} />
                    <span>
                      Assignee:{' '}
                      <strong>
                        {ticket.assignee ? ticket.assignee.username : 'Unassigned'}
                      </strong>
                    </span>
                  </div>
                  <div className="ticket-author-info">
                    <Calendar size={14} />
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => onSelectTicket(ticket._id)} 
                    className="btn-icon" 
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => onDeleteTicket(ticket._id)} 
                      className="btn-icon" 
                      style={{ color: '#ef4444' }} 
                      title="Delete Ticket"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
