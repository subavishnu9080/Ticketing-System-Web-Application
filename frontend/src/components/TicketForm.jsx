import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export default function TicketForm({ currentUser, onClose, onSubmitSuccess, showToast }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('open');
  const [category, setCategory] = useState('General');
  const [suggesting, setSuggesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAiSuggest = async () => {
    if (!description.trim()) {
      showToast('Please type a description first so the AI can analyze it!', 'info');
      return;
    }

    setSuggesting(true);
    try {
      const response = await fetch(`${API_BASE}/api/tickets/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ description })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Auto-suggestion failed');
      }

      if (data.priority) setPriority(data.priority);
      if (data.category) setCategory(data.category);
      showToast(`AI Suggested: Priority -> ${data.priority}, Category -> ${data.category}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Title and description are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ title, description, priority, category, status })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create ticket');
      }

      showToast('Ticket created successfully!', 'success');
      onSubmitSuccess(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isStaff = currentUser && (currentUser.role === 'agent' || currentUser.role === 'admin');

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Raise Support Ticket</h2>
          <button onClick={onClose} className="drawer-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="ticket-title-input">Ticket Title</label>
              <input 
                id="ticket-title-input"
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="e.g. Printer offline on 3rd floor" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ticket-description-input">Description</label>
              <textarea 
                id="ticket-description-input"
                className="input-field" 
                placeholder="Explain the technical issue or service request..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <button 
              type="button" 
              className="ai-suggest-badge"
              onClick={handleAiSuggest}
              disabled={suggesting}
            >
              <Sparkles size={14} />
              {suggesting ? 'Analyzing with AI...' : 'Auto-Suggest Priority & Category'}
            </button>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ticket-priority-select">Priority</label>
                <select 
                  id="ticket-priority-select"
                  className="input-field" 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ticket-category-select">Category</label>
                <select 
                  id="ticket-category-select"
                  className="input-field" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Network">Network</option>
                  <option value="Access & Security">Access & Security</option>
                  <option value="Database">Database</option>
                  <option value="Billing">Billing</option>
                </select>
              </div>
            </div>

            {isStaff && (
              <div className="form-group">
                <label htmlFor="ticket-status-select">Initial Status</label>
                <select 
                  id="ticket-status-select"
                  className="input-field" 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}

            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Create Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
