import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { EngagementsPage } from './pages/EngagementsPage';
import { AdminPage } from './pages/AdminPage';
import { TaskModal } from './components/TaskModal';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'tasks' | 'engagements' | 'admin'>('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tasksFilterMode, setTasksFilterMode] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleNavigateToTasksWithFilter = (filter?: string) => {
    if (filter) setTasksFilterMode(filter);
    setCurrentTab('tasks');
  };

  return (
    <div className="app-container">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="main-content">
        {currentTab === 'dashboard' && (
          <DashboardPage
            onSelectTask={(id) => setSelectedTaskId(id)}
            onNavigateToTasks={handleNavigateToTasksWithFilter}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksPage
            initialFilter={tasksFilterMode}
            onSelectTask={(id) => setSelectedTaskId(id)}
            refreshKey={refreshKey}
          />
        )}

        {currentTab === 'engagements' && (
          <EngagementsPage
            onSelectTask={(id) => setSelectedTaskId(id)}
            refreshKey={refreshKey}
            triggerRefresh={triggerRefresh}
          />
        )}

        {currentTab === 'admin' && <AdminPage />}
      </main>

      {/* Global Task Interaction & Workflow Modal */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={() => triggerRefresh()}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
