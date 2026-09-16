import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Clock, 
  Layers
} from 'lucide-react';

export const TasksPage = ({ 
  initialFilter, 
  onSelectTask,
  refreshKey 
}) => {
  const { user, allUsers } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterMode, setFilterMode] = useState(initialFilter || 'all');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  useEffect(() => {
    if (initialFilter) {
      setFilterMode(initialFilter);
    }
  }, [initialFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (assigneeFilter) params.assignedToId = assigneeFilter;
      if (filterMode && filterMode !== 'all') params.filterMode = filterMode;

      const data = await api.getTasks(params);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [search, statusFilter, filterMode, assigneeFilter, user, refreshKey]);

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return new Date(task.dueDate) < startOfToday;
  };

  const isDueToday = (task) => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const d = new Date(task.dueDate);
    return d >= startOfToday && d <= endOfToday;
  };

  const formatStatus = (s) => (s ? s.replace(/_/g, ' ') : '');

  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          <h2>Tasks & Workflow Engine</h2>
          <p>Strict workflow state enforcement, assignments, review loops, and deadline tracking</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by task title, description, client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Mode Presets */}
        <select
          className="filter-select"
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
        >
          <option value="all">All Tasks</option>
          <option value="mine">Assigned to Me</option>
          <option value="overdue">Overdue Tasks</option>
          <option value="dueToday">Due Today</option>
          <option value="waitingClient">Waiting for Client</option>
          <option value="readyReview">Ready for Review</option>
        </select>

        {/* Status Filter */}
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_FOR_CLIENT">Waiting for Client</option>
          <option value="READY_FOR_REVIEW">Ready for Review</option>
          <option value="CHANGES_REQUESTED">Changes Requested</option>
          <option value="COMPLETED">Completed</option>
        </select>

        {/* Assignee Filter */}
        <select
          className="filter-select"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">All Assignees</option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        {(search || statusFilter || filterMode !== 'all' || assigneeFilter) && (
          <button
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setFilterMode('all');
              setAssigneeFilter('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Task Count Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <span>Showing <strong>{tasks.length}</strong> tasks</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Click on any task to view history and perform allowed workflow transitions
        </span>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <Layers size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
          <h3>No tasks match the selected filters</h3>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
            Try adjusting your search criteria or resetting filters.
          </p>
        </div>
      ) : (
        <div className="tasks-container">
          {tasks.map((task) => {
            const overdue = isOverdue(task);
            const dueToday = isDueToday(task);

            return (
              <div
                key={task.id}
                className="task-item"
                onClick={() => onSelectTask(task.id)}
              >
                <div className="task-main">
                  <div className="task-title-row">
                    <span className="task-title">{task.title}</span>
                    <span className={`status-badge status-${task.status}`}>
                      {formatStatus(task.status)}
                    </span>
                    <span className={`priority-badge priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="task-meta">
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {task.engagement?.client?.companyName}
                    </span>
                    <span>
                      {task.engagement?.serviceType?.name} ({task.engagement?.period})
                    </span>

                    {task.dueDate && (
                      <span className={`meta-item ${overdue ? 'meta-overdue' : dueToday ? 'meta-due-today' : ''}`}>
                        <Clock size={13} />
                        {overdue ? `OVERDUE (${new Date(task.dueDate).toLocaleDateString()})` :
                         dueToday ? 'DUE TODAY' :
                         `Due ${new Date(task.dueDate).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Assignee pill */}
                <div className="task-assignee">
                  {task.assignedTo ? (
                    <>
                      <div className="assignee-avatar">
                        {task.assignedTo.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="assignee-info">
                        <span className="assignee-name">{task.assignedTo.name}</span>
                        <span className="assignee-title">{task.assignedTo.title}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Unassigned
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
