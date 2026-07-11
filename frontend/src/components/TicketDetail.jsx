import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, User, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export default function TicketDetail({ ticketId, currentUser, users, onClose, onTicketUpdated, showToast }) {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [commenting, setCommenting] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch ticket details');
      }

      setTicket(data.ticket);
      setComments(data.comments || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [ticketId, currentUser.token, showToast]);

  useEffect(() => {
    if (ticketId) {
      fetchDetails();
    }
  }, [ticketId, fetchDetails]);

  const handleUpdateField = async (field, value) => {
    if (!ticket) return;
    
    setUpdating(true);
    try {
      const bodyPayload = {};
      if (field === 'assignee') {
        bodyPayload.assignee = value === '' ? 'unassigned' : value;
      } else {
        bodyPayload[field] = value;
      }

      const response = await fetch(`${API_BASE}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update ticket');
      }

      setTicket(data);
      onTicketUpdated(data);
      showToast(`Updated ticket ${field} successfully!`, 'success');
      
      // Auto-post an audit log comment
      await postAuditComment(`Updated ${field} to: ${field === 'assignee' ? (data.assignee?.username || 'Unassigned') : value}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const postAuditComment = async (text) => {
    try {
      const response = await fetch(`${API_BASE}/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ comment: `[Activity Log] ${text}` })
      });
      if (response.ok) {
        const commentData = await response.json();
        setComments(prev => [...prev, commentData]);
      }
    } catch (err) {
      console.error('Failed to create activity log comment:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommenting(true);
    try {
      const response = await fetch(`${API_BASE}/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ comment: newComment })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add comment');
      }

      setComments(prev => [...prev, data]);
      setNewComment('');
      showToast('Comment added successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="drawer-overlay" onClick={onClose}>
        <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="value">Loading details...</div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="drawer-overlay" onClick={onClose}>
        <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <AlertCircle size={48} style={{ color: 'var(--priority-high)', marginBottom: '1rem' }} />
          <h3>Failed to load ticket</h3>
          <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: '1rem' }}>Close</button>
        </div>
      </div>
    );
  }

  const isStaff = currentUser && (currentUser.role === 'agent' || currentUser.role === 'admin');

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '90%' }}>
            <span className="ticket-category-tag">{ticket.category}</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, wordBreak: 'break-word' }}>{ticket.title}</h2>
          </div>
          <button onClick={onClose} className="drawer-close">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="detail-section">
            <h4>Description</h4>
            <div className="detail-description">{ticket.description}</div>
          </div>

          <div className="detail-meta-grid">
            <div className="meta-box">
              <span>Status</span>
              {isStaff ? (
                <select 
                  className="input-field" 
                  style={{ padding: '0.25rem 0.5rem', height: '32px', fontSize: '0.85rem' }}
                  value={ticket.status}
                  onChange={(e) => handleUpdateField('status', e.target.value)}
                  disabled={updating}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              ) : (
                <span className={`badge badge-status-${ticket.status}`} style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>
                  {ticket.status}
                </span>
              )}
            </div>

            <div className="meta-box">
              <span>Priority</span>
              {isStaff ? (
                <select 
                  className="input-field" 
                  style={{ padding: '0.25rem 0.5rem', height: '32px', fontSize: '0.85rem' }}
                  value={ticket.priority}
                  onChange={(e) => handleUpdateField('priority', e.target.value)}
                  disabled={updating}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <span className={`badge badge-priority-${ticket.priority}`} style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>
                  {ticket.priority}
                </span>
              )}
            </div>

            <div className="meta-box">
              <span>Assignee</span>
              {isStaff ? (
                <select 
                  className="input-field" 
                  style={{ padding: '0.25rem 0.5rem', height: '32px', fontSize: '0.85rem' }}
                  value={ticket.assignee?._id || ''}
                  onChange={(e) => handleUpdateField('assignee', e.target.value)}
                  disabled={updating}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.username} ({u.role})</option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: ticket.assignee ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {ticket.assignee ? ticket.assignee.username : 'Unassigned'}
                </span>
              )}
            </div>

            <div className="meta-box">
              <span>Meta Details</span>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <User size={12} />
                  <span>Creator: <strong>{ticket.createdBy?.username}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={12} />
                  <span>Date: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="comments-section">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={16} />
              Comments & History ({comments.length})
            </h4>
            
            <div className="comments-timeline">
              {comments.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                  No updates or comments yet.
                </p>
              ) : (
                comments.map(c => {
                  const isAuditLog = c.comment.startsWith('[Activity Log]');
                  const cleanComment = isAuditLog ? c.comment.replace('[Activity Log] ', '') : c.comment;

                  return (
                    <div 
                      key={c._id} 
                      className="comment-card"
                      style={isAuditLog ? { borderLeft: '3px solid var(--secondary)', background: 'rgba(6, 182, 212, 0.02)' } : {}}
                    >
                      <div className="comment-header">
                        <span className="comment-author" style={isAuditLog ? { color: 'var(--secondary)' } : {}}>
                          {isAuditLog ? 'System Activity' : c.author?.username}
                        </span>
                        <span>{new Date(c.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="comment-text" style={isAuditLog ? { color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' } : {}}>
                        {cleanComment}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleAddComment} className="comment-form">
              <input 
                type="text" 
                className="comment-input" 
                placeholder="Type your message or status update..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={commenting}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={commenting}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
