import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { NewEngagementModal } from '../components/NewEngagementModal';
import { 
  Briefcase, 
  Plus, 
  Repeat, 
  CheckCircle2, 
  AlertCircle, 
  Calendar
} from 'lucide-react';

export const EngagementsPage = ({ 
  onSelectTask, 
  refreshKey,
  triggerRefresh 
}) => {
  const { user } = useAuth();
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState(null);

  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const loadEngagements = async () => {
    try {
      setLoading(true);
      const data = await api.getEngagements();
      setEngagements(data);
    } catch (err) {
      console.error('Failed to load engagements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngagements();
  }, [refreshKey]);

  const handleGenerateNextPeriod = async (engagement) => {
    try {
      setActionLoadingId(engagement.id);
      setMessage(null);
      const res = await api.generateNextPeriod(engagement.id);
      setMessage({
        text: `Successfully generated next period engagement for ${res.period} with ${res.tasks?.length || 0} tasks!`,
        isError: false,
      });
      await loadEngagements();
      triggerRefresh();
    } catch (err) {
      setMessage({
        text: err.message || 'Failed to generate next period',
        isError: true,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <h2>Engagements & Recurring Services</h2>
          <p>Client engagements, automated template instantiation, and recurring period roll-overs</p>
        </div>
        {isManagerOrAdmin && (
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            <Plus size={16} />
            <span>New Engagement</span>
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {message && (
        <div className={`alert-banner ${message.isError ? 'alert-banner-error' : 'alert-banner-success'}`}>
          {message.isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Engagements Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading engagements...
        </div>
      ) : engagements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No engagements found. Click "New Engagement" to create one.
        </div>
      ) : (
        <div className="engagements-grid">
          {engagements.map((eng) => {
            const totalTasks = eng.tasks?.length || 0;
            const completedTasks = eng.tasks?.filter((t) => t.status === 'COMPLETED').length || 0;
            const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const isRecurring = eng.serviceType?.isRecurring;

            return (
              <div key={eng.id} className="engagement-card">
                <div>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {eng.client?.companyName}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                        {eng.title}
                      </h3>
                    </div>
                    <span className={`status-badge status-${eng.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'}`}>
                      {eng.status}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.785rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} />
                      <span>Period: <strong>{eng.period}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Briefcase size={14} />
                      <span>{isRecurring ? `${eng.serviceType?.frequency} Recurring` : 'One-time'}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Progress: {completedTasks} of {totalTasks} tasks</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{progressPercent}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>

                  {/* Tasks Preview List */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {eng.tasks?.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.35rem 0.5rem',
                          background: 'rgba(15, 23, 42, 0.4)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                        onClick={() => onSelectTask(t.id)}
                      >
                        <span style={{ color: t.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {t.title}
                        </span>
                        <span className={`status-badge status-${t.status}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Footer */}
                {isRecurring && isManagerOrAdmin && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                      disabled={actionLoadingId === eng.id}
                      onClick={() => handleGenerateNextPeriod(eng)}
                      title="Generate the next recurring period and copy task templates automatically"
                    >
                      <Repeat size={14} />
                      <span>
                        {actionLoadingId === eng.id ? 'Generating...' : 'Generate Next Period'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Engagement Modal */}
      {showNewModal && (
        <NewEngagementModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false);
            loadEngagements();
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
};
