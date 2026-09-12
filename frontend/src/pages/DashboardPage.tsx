import React, { useState, useEffect } from 'react';
import { DashboardMetrics, Task } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MetricsCards } from '../components/MetricsCards';
import { 
  AlertTriangle, 
  Clock, 
  Eye, 
  UserX, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface DashboardPageProps {
  onSelectTask: (taskId: string) => void;
  onNavigateToTasks: (filter?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  onSelectTask, 
  onNavigateToTasks 
}) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [reviewTasks, setReviewTasks] = useState<Task[]>([]);
  const [waitingClientTasks, setWaitingClientTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.getMetrics('global');
      setMetrics(data.metrics);
      setRecentActivity(data.recentActivity || []);

      // Load specific highlighted tasks
      const [overdueAndToday, readyReview, waitingClient] = await Promise.all([
        api.getTasks({ filterMode: 'overdue' }),
        api.getTasks({ status: 'READY_FOR_REVIEW' }),
        api.getTasks({ status: 'WAITING_FOR_CLIENT' }),
      ]);

      setUrgentTasks(overdueAndToday.slice(0, 5));
      setReviewTasks(readyReview.slice(0, 5));
      setWaitingClientTasks(waitingClient.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const formatStatus = (s: string) => s.replace(/_/g, ' ');

  return (
    <div>
      {/* Welcome Banner */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title">
          <h2>Welcome back, {user?.name}</h2>
          <p>
            {user?.role === 'ADMIN' && 'System Administrator Portal — Full visibility across all clients and engagements.'}
            {user?.role === 'MANAGER' && 'Engagement Manager Command Center — Review pending submissions and track deadlines.'}
            {user?.role === 'TEAM_MEMBER' && 'Specialist Workspace — Update task progress, request client info, and submit for review.'}
          </p>
        </div>
      </div>

      {/* 5 Core Required KPI Cards */}
      <MetricsCards
        metrics={metrics}
        onSelectFilter={(filter) => onNavigateToTasks(filter)}
      />

      {/* Main Grid: Urgent Tasks + Review Queue + Live Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* Section 1: Urgent & Overdue Action Items */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  background: 'var(--alert-red-bg)', 
                  padding: '0.4rem', 
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--alert-red)' 
                }}>
                  <AlertTriangle size={18} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Overdue & Critical Deadlines</h3>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                onClick={() => onNavigateToTasks('overdue')}
              >
                View All
              </button>
            </div>

            {urgentTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                🎉 No overdue tasks! All assignments are on track.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {urgentTasks.map((t) => (
                  <div 
                    key={t.id} 
                    className="task-item"
                    style={{ padding: '0.75rem 1rem' }}
                    onClick={() => onSelectTask(t.id)}
                  >
                    <div className="task-main">
                      <div className="task-title-row">
                        <span className="task-title" style={{ fontSize: '0.875rem' }}>{t.title}</span>
                        <span className={`status-badge status-${t.status}`} style={{ fontSize: '0.7rem' }}>
                          {formatStatus(t.status)}
                        </span>
                      </div>
                      <div className="task-meta">
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {t.engagement?.client.companyName}
                        </span>
                        <span className="meta-item meta-overdue">
                          <Clock size={13} />
                          {t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : 'No date'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Assignee: <strong>{t.assignedTo?.name || 'Unassigned'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Review Queue (Manager Review Approvals) */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  background: 'var(--alert-purple-bg)', 
                  padding: '0.4rem', 
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--alert-purple)' 
                }}>
                  <Eye size={18} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Awaiting Manager Review</h3>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                onClick={() => onNavigateToTasks('readyReview')}
              >
                View All ({metrics?.waitingForReview || 0})
              </button>
            </div>

            {reviewTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No tasks currently waiting for review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {reviewTasks.map((t) => (
                  <div 
                    key={t.id} 
                    className="task-item"
                    style={{ padding: '0.75rem 1rem', borderColor: 'rgba(124, 58, 237, 0.4)' }}
                    onClick={() => onSelectTask(t.id)}
                  >
                    <div className="task-main">
                      <div className="task-title-row">
                        <span className="task-title" style={{ fontSize: '0.875rem' }}>{t.title}</span>
                        <span className="status-badge status-READY_FOR_REVIEW" style={{ fontSize: '0.7rem' }}>
                          Ready for Review
                        </span>
                      </div>
                      <div className="task-meta">
                        <span>{t.engagement?.client.companyName}</span>
                        <span>Submitted by: <strong>{t.assignedTo?.name || 'Team'}</strong></span>
                      </div>
                    </div>
                    {isManagerOrAdmin ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                        Review →
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Pending Mgr
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Tasks Waiting for Client Information */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  background: 'var(--alert-blue-bg)', 
                  padding: '0.4rem', 
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--alert-blue)' 
                }}>
                  <UserX size={18} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Waiting for Client Information</h3>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                onClick={() => onNavigateToTasks('waitingClient')}
              >
                View All ({metrics?.waitingForClient || 0})
              </button>
            </div>

            {waitingClientTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No tasks blocked on client information.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {waitingClientTasks.map((t) => (
                  <div 
                    key={t.id} 
                    className="task-item"
                    style={{ padding: '0.75rem 1rem' }}
                    onClick={() => onSelectTask(t.id)}
                  >
                    <div className="task-main">
                      <div className="task-title-row">
                        <span className="task-title" style={{ fontSize: '0.875rem' }}>{t.title}</span>
                        <span className="status-badge status-WAITING_FOR_CLIENT" style={{ fontSize: '0.7rem' }}>
                          Waiting Client
                        </span>
                      </div>
                      <div className="task-meta">
                        <span>{t.engagement?.client.companyName}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Owner: <strong>{t.assignedTo?.name || 'Unassigned'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Recent Audit Activity Stream */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ 
              background: 'rgba(99, 102, 241, 0.1)', 
              padding: '0.4rem', 
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-primary)' 
            }}>
              <Activity size={18} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Live Audit & History Stream</h3>
          </div>

          <div className="timeline" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {recentActivity.map((act) => (
              <div key={act.id} className="timeline-item">
                <div className="timeline-meta">
                  {new Date(act.createdAt).toLocaleTimeString()} • {act.changedBy?.name} ({act.changedBy?.role})
                </div>
                <div className="timeline-action">
                  {act.action} on <em>{act.task?.title}</em>
                </div>
                {act.notes && <div className="timeline-notes">{act.notes}</div>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
