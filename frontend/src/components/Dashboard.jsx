import React from 'react';
import { Layers, CircleDot, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Dashboard({ tickets }) {
  const total = tickets.length;
  const open = tickets.filter(t => t.status === 'open').length;
  const inProgress = tickets.filter(t => t.status === 'in-progress').length;
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const highPriority = tickets.filter(t => t.priority === 'high' && t.status !== 'closed' && t.status !== 'resolved').length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const cards = [
    {
      title: 'Total Tickets',
      value: total,
      icon: <Layers size={24} />,
      color: '#8b5cf6',
      accentVar: 'rgba(139, 92, 246, 0.2)'
    },
    {
      title: 'Open Tickets',
      value: open,
      icon: <CircleDot size={24} />,
      color: '#3b82f6',
      accentVar: 'rgba(59, 130, 246, 0.2)'
    },
    {
      title: 'In Progress',
      value: inProgress,
      icon: <Clock size={24} />,
      color: '#eab308',
      accentVar: 'rgba(234, 179, 8, 0.2)'
    },
    {
      title: 'Resolved / Closed',
      value: resolved,
      icon: <CheckCircle2 size={24} />,
      color: '#10b981',
      accentVar: 'rgba(16, 185, 129, 0.2)'
    },
    {
      title: 'Active High Priority',
      value: highPriority,
      icon: <AlertTriangle size={24} />,
      color: '#ef4444',
      accentVar: 'rgba(239, 68, 68, 0.2)'
    }
  ];

  return (
    <div>
      <div className="dashboard-grid">
        {cards.map((card, idx) => (
          <div 
            key={idx} 
            className="metric-card" 
            style={{ 
              '--accent': card.color, 
              '--primary-glow': card.accentVar 
            }}
          >
            <div className="metric-icon-wrapper">
              {card.icon}
            </div>
            <div className="metric-details">
              <h3>{card.title}</h3>
              <div className="value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div 
          className="metric-card" 
          style={{ 
            marginBottom: '2rem', 
            '--accent': '#06b6d4', 
            '--primary-glow': 'rgba(6, 182, 212, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resolution Progress
            </h3>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#06b6d4' }}>{resolutionRate}% Completed</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${resolutionRate}%`, 
                background: 'linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)',
                borderRadius: '4px',
                transition: 'width 0.5s ease-out'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
