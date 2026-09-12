import React, { useState, useEffect } from 'react';
import { Task, User, TaskStatus } from '../types';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Calendar, 
  User as UserIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Send, 
  HelpCircle,
  FileEdit,
  ShieldCheck
} from 'lucide-react';

interface TaskModalProps {
  taskId: string | null;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ taskId, onClose, onTaskUpdated }) => {
  const { user: currentUser, allUsers } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Transition form state
  const [reviewNotes, setReviewNotes] = useState('');
  const [showNotesPrompt, setShowNotesPrompt] = useState(false);
  const [pendingTargetStatus, setPendingTargetStatus] = useState<TaskStatus | null>(null);

  // Assignment edit state (Manager / Admin)
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [selectedDueDate, setSelectedDueDate] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('MEDIUM');

  const isManagerOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const isAssignedToCurrent = task?.assignedToId === currentUser?.id;

  const loadTask = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTaskById(taskId);
      setTask(data);
      setSelectedAssigneeId(data.assignedToId || '');
      setSelectedDueDate(data.dueDate ? data.dueDate.split('T')[0] : '');
      setSelectedPriority(data.priority || 'MEDIUM');
    } catch (err: any) {
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  if (!taskId) return null;

  const handleInitiateTransition = (status: TaskStatus, requiresNotes = false) => {
    if (requiresNotes) {
      setPendingTargetStatus(status);
      setShowNotesPrompt(true);
      setReviewNotes('');
    } else {
      executeTransition(status);
    }
  };

  const executeTransition = async (targetStatus: TaskStatus, notes?: string) => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);
      await api.updateTaskStatus(taskId, targetStatus, notes);
      setSuccessMsg(`Status updated to ${targetStatus}`);
      setShowNotesPrompt(false);
      await loadTask();
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message || 'Transition failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAssignment = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);
      await api.assignTask(taskId, {
        assignedToId: selectedAssigneeId || null,
        dueDate: selectedDueDate ? new Date(selectedDueDate).toISOString() : null,
        priority: selectedPriority,
      });
      setSuccessMsg('Assignment & deadline updated successfully');
      await loadTask();
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const formatStatus = (s: string) => s.replace(/_/g, ' ');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className={`status-badge status-${task?.status || 'NOT_STARTED'}`}>
                {task ? formatStatus(task.status) : '...'}
              </span>
              <span className={`priority-badge priority-${task?.priority || 'MEDIUM'}`}>
                {task?.priority}
              </span>
            </div>
            <h3>{task?.title || 'Task Details'}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div className="alert-banner alert-banner-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-banner alert-banner-success">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading task details...
            </div>
          ) : task ? (
            <>
              {/* Engagement & Client Context */}
              <div style={{ 
                background: 'rgba(15, 23, 42, 0.4)', 
                padding: '0.85rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Client: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{task.engagement?.client.companyName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Service: </span>
                  <strong>{task.engagement?.serviceType.name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Period: </span>
                  <strong style={{ color: 'var(--accent-primary)' }}>{task.engagement?.period}</strong>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div className="form-group">
                  <label className="form-label">Description / Instructions</label>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{task.description}</p>
                </div>
              )}

              {/* Workflow Actions Based on Role & Current Status */}
              <div style={{ 
                background: 'rgba(99, 102, 241, 0.05)', 
                padding: '1.25rem', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid rgba(99, 102, 241, 0.2)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ color: 'var(--accent-primary)', marginBottom: 0 }}>
                    Workflow Actions
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Acting as: <strong>{currentUser?.name}</strong> ({currentUser?.role})
                  </span>
                </div>

                {/* State Machine Transition Buttons */}
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {/* NOT_STARTED -> IN_PROGRESS */}
                  {task.status === 'NOT_STARTED' && (
                    <button
                      className="btn btn-primary"
                      disabled={actionLoading}
                      onClick={() => handleInitiateTransition('IN_PROGRESS')}
                    >
                      <Clock size={16} />
                      <span>Start Progress</span>
                    </button>
                  )}

                  {/* IN_PROGRESS Transitions */}
                  {task.status === 'IN_PROGRESS' && (
                    <>
                      <button
                        className="btn btn-secondary"
                        disabled={actionLoading}
                        onClick={() => handleInitiateTransition('WAITING_FOR_CLIENT', true)}
                      >
                        <UserIcon size={16} />
                        <span>Wait for Client Info</span>
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={actionLoading}
                        onClick={() => handleInitiateTransition('READY_FOR_REVIEW', true)}
                      >
                        <Send size={16} />
                        <span>Submit Work for Review</span>
                      </button>
                    </>
                  )}

                  {/* WAITING_FOR_CLIENT -> IN_PROGRESS */}
                  {task.status === 'WAITING_FOR_CLIENT' && (
                    <button
                      className="btn btn-primary"
                      disabled={actionLoading}
                      onClick={() => handleInitiateTransition('IN_PROGRESS')}
                    >
                      <RotateCcw size={16} />
                      <span>Client Info Received → Resume</span>
                    </button>
                  )}

                  {/* CHANGES_REQUESTED -> IN_PROGRESS */}
                  {task.status === 'CHANGES_REQUESTED' && (
                    <button
                      className="btn btn-primary"
                      disabled={actionLoading}
                      onClick={() => handleInitiateTransition('IN_PROGRESS')}
                    >
                      <RotateCcw size={16} />
                      <span>Resume Working on Corrections</span>
                    </button>
                  )}

                  {/* READY_FOR_REVIEW: Manager Review Enforcement */}
                  {task.status === 'READY_FOR_REVIEW' && (
                    <>
                      {isManagerOrAdmin ? (
                        <>
                          <button
                            className="btn btn-success"
                            disabled={actionLoading}
                            onClick={() => handleInitiateTransition('COMPLETED', true)}
                          >
                            <ShieldCheck size={16} />
                            <span>Approve & Complete Task</span>
                          </button>
                          <button
                            className="btn btn-danger"
                            disabled={actionLoading}
                            onClick={() => handleInitiateTransition('CHANGES_REQUESTED', true)}
                          >
                            <RotateCcw size={16} />
                            <span>Request Changes / Send Back</span>
                          </button>
                        </>
                      ) : (
                        <div style={{ 
                          background: 'rgba(124, 58, 237, 0.1)', 
                          padding: '0.65rem 0.85rem', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px solid rgba(124, 58, 237, 0.3)',
                          fontSize: '0.8rem',
                          color: '#c084fc',
                          width: '100%'
                        }}>
                          🔒 <strong>Awaiting Manager Review:</strong> Team members cannot approve their own work. Switch to a Manager persona to approve or request changes.
                        </div>
                      )}
                    </>
                  )}

                  {/* COMPLETED State */}
                  {task.status === 'COMPLETED' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ color: 'var(--alert-green)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={18} />
                        <span>Completed {task.completedAt ? `on ${new Date(task.completedAt).toLocaleDateString()}` : ''}</span>
                      </span>
                      {isManagerOrAdmin && (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                          disabled={actionLoading}
                          onClick={() => handleInitiateTransition('IN_PROGRESS')}
                        >
                          Reopen Task
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Optional/Mandatory Transition Notes Input */}
                {showNotesPrompt && pendingTargetStatus && (
                  <div style={{ 
                    marginTop: '1rem', 
                    paddingTop: '1rem', 
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <label className="form-label">
                      {pendingTargetStatus === 'CHANGES_REQUESTED' 
                        ? 'Mandatory Change Request Feedback:' 
                        : pendingTargetStatus === 'COMPLETED'
                        ? 'Approval Note (Optional):'
                        : pendingTargetStatus === 'WAITING_FOR_CLIENT'
                        ? 'Waiting Reason / Document Needed:'
                        : 'Review Submission Note (Optional):'}
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder={
                        pendingTargetStatus === 'CHANGES_REQUESTED'
                          ? 'Specify what needs correction...'
                          : 'Enter review details or reason...'
                      }
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => { setShowNotesPrompt(false); setPendingTargetStatus(null); }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={actionLoading || (pendingTargetStatus === 'CHANGES_REQUESTED' && !reviewNotes.trim())}
                        onClick={() => executeTransition(pendingTargetStatus, reviewNotes)}
                      >
                        Confirm Transition
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment & Deadline (Only Manager/Admin can alter) */}
              <div style={{ 
                background: 'var(--bg-secondary)', 
                padding: '1.25rem', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--border-subtle)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Assignment & Deadline</label>
                  {!isManagerOrAdmin && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      🔒 Managed by engagement leads
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  {/* Assignee */}
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assignee</label>
                    {isManagerOrAdmin ? (
                      <select
                        className="form-select"
                        value={selectedAssigneeId}
                        onChange={(e) => setSelectedAssigneeId(e.target.value)}
                      >
                        <option value="">-- Unassigned --</option>
                        {allUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role.replace('_', ' ')})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ fontSize: '0.85rem', padding: '0.5rem 0', color: 'var(--text-primary)' }}>
                        {task.assignedTo ? `${task.assignedTo.name} (${task.assignedTo.title})` : 'Unassigned'}
                      </div>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Due Date</label>
                    {isManagerOrAdmin ? (
                      <input
                        type="date"
                        className="form-input"
                        value={selectedDueDate}
                        onChange={(e) => setSelectedDueDate(e.target.value)}
                      />
                    ) : (
                      <div style={{ fontSize: '0.85rem', padding: '0.5rem 0', color: 'var(--text-primary)' }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline set'}
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Priority</label>
                    {isManagerOrAdmin ? (
                      <select
                        className="form-select"
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value)}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    ) : (
                      <div style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>
                        <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isManagerOrAdmin && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem' }}
                      disabled={actionLoading}
                      onClick={handleSaveAssignment}
                    >
                      Update Assignment & Deadline
                    </button>
                  </div>
                )}
              </div>

              {/* Audit History Timeline */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.75rem' }}>Audit & Workflow History</label>
                <div className="timeline">
                  {task.auditLogs && task.auditLogs.length > 0 ? (
                    task.auditLogs.map((log) => (
                      <div key={log.id} className="timeline-item">
                        <div className="timeline-meta">
                          {new Date(log.createdAt).toLocaleString()} • {log.changedBy?.name} ({log.changedBy?.role})
                        </div>
                        <div className="timeline-action">
                          {log.action}
                          {log.oldStatus && log.newStatus && (
                            <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
                              ({formatStatus(log.oldStatus)} → {formatStatus(log.newStatus)})
                            </span>
                          )}
                        </div>
                        {log.notes && <div className="timeline-notes">{log.notes}</div>}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No audit history recorded.</div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
