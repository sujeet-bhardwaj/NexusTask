import React from 'react';
import { DashboardMetrics } from '../types';
import { 
  FolderKanban, 
  AlertTriangle, 
  Clock, 
  UserX, 
  Eye,
  CheckCircle2
} from 'lucide-react';

interface MetricsCardsProps {
  metrics: DashboardMetrics | null;
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ 
  metrics, 
  activeFilter, 
  onSelectFilter 
}) => {
  if (!metrics) return null;

  return (
    <div className="metrics-grid">
      {/* 1. Open Tasks */}
      <div 
        className={`metric-card card-open ${activeFilter === 'open' ? 'active-filter' : ''}`}
        onClick={() => onSelectFilter && onSelectFilter('open')}
        title="Filter by Open Tasks"
      >
        <div className="metric-header">
          <span className="metric-title">Open Tasks</span>
          <div className="metric-icon-box">
            <FolderKanban size={20} />
          </div>
        </div>
        <div className="metric-val">{metrics.openTasks}</div>
        <div className="metric-subtext">Active work in pipeline</div>
      </div>

      {/* 2. Overdue Tasks */}
      <div 
        className={`metric-card card-overdue ${activeFilter === 'overdue' ? 'active-filter' : ''}`}
        onClick={() => onSelectFilter && onSelectFilter('overdue')}
        title="Filter by Overdue Tasks"
      >
        <div className="metric-header">
          <span className="metric-title">Overdue Tasks</span>
          <div className="metric-icon-box">
            <AlertTriangle size={20} />
          </div>
        </div>
        <div className="metric-val">{metrics.overdueTasks}</div>
        <div className="metric-subtext" style={{ color: '#fca5a5' }}>
          {metrics.overdueTasks > 0 ? 'Requires immediate action' : 'All deadlines met'}
        </div>
      </div>

      {/* 3. Tasks Due Today */}
      <div 
        className={`metric-card card-due-today ${activeFilter === 'dueToday' ? 'active-filter' : ''}`}
        onClick={() => onSelectFilter && onSelectFilter('dueToday')}
        title="Filter by Tasks Due Today"
      >
        <div className="metric-header">
          <span className="metric-title">Tasks Due Today</span>
          <div className="metric-icon-box">
            <Clock size={20} />
          </div>
        </div>
        <div className="metric-val">{metrics.dueTodayTasks}</div>
        <div className="metric-subtext" style={{ color: '#fde68a' }}>Due before end of day</div>
      </div>

      {/* 4. Tasks Waiting for Client */}
      <div 
        className={`metric-card card-waiting-client ${activeFilter === 'waitingClient' ? 'active-filter' : ''}`}
        onClick={() => onSelectFilter && onSelectFilter('waitingClient')}
        title="Filter by Waiting for Client"
      >
        <div className="metric-header">
          <span className="metric-title">Waiting for Client</span>
          <div className="metric-icon-box">
            <UserX size={20} />
          </div>
        </div>
        <div className="metric-val">{metrics.waitingForClient}</div>
        <div className="metric-subtext" style={{ color: '#93c5fd' }}>Pending client inputs / docs</div>
      </div>

      {/* 5. Tasks Waiting for Review */}
      <div 
        className={`metric-card card-waiting-review ${activeFilter === 'readyReview' ? 'active-filter' : ''}`}
        onClick={() => onSelectFilter && onSelectFilter('readyReview')}
        title="Filter by Ready for Review"
      >
        <div className="metric-header">
          <span className="metric-title">Waiting for Review</span>
          <div className="metric-icon-box">
            <Eye size={20} />
          </div>
        </div>
        <div className="metric-val">{metrics.waitingForReview}</div>
        <div className="metric-subtext" style={{ color: '#d8b4fe' }}>Awaiting manager approval</div>
      </div>
    </div>
  );
};
