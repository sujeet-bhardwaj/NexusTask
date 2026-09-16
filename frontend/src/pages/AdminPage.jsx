import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  FileText, 
  Users, 
  Plus, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

export const AdminPage = () => {
  const { user, allUsers } = useAuth();
  const [activeTab, setActiveTab] = useState('clients');

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // New Client Form
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // New Service Form
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('ONE_TIME');
  const [templateRows, setTemplateRows] = useState([
    { title: 'Initial Consultation & KYC', offsetDays: 3 },
    { title: 'Execution & Filing', offsetDays: 10 },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cl, sv] = await Promise.all([api.getClients(), api.getServices()]);
      setClients(cl);
      setServices(sv);
    } catch (err) {
      setError(err.message || 'Failed to load catalog data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await api.createClient({
        name: clientName,
        companyName,
        email: clientEmail,
        phone: clientPhone || undefined,
        notes: clientNotes || undefined,
      });
      setSuccess('Client created successfully!');
      setShowClientModal(false);
      setClientName('');
      setCompanyName('');
      setClientEmail('');
      setClientPhone('');
      setClientNotes('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create client');
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await api.createService({
        name: serviceName,
        description: serviceDesc || undefined,
        isRecurring,
        frequency,
        taskTemplates: templateRows.map((t, idx) => ({
          title: t.title,
          orderIndex: idx,
          defaultDeadlineOffsetDays: Number(t.offsetDays) || 7,
        })),
      });
      setSuccess('Service Type & Task Templates created successfully!');
      setShowServiceModal(false);
      setServiceName('');
      setServiceDesc('');
      setIsRecurring(false);
      setFrequency('ONE_TIME');
      setTemplateRows([
        { title: 'Initial Consultation & KYC', offsetDays: 3 },
        { title: 'Execution & Filing', offsetDays: 10 },
      ]);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create service type');
    }
  };

  const addTemplateRow = () => {
    setTemplateRows([...templateRows, { title: '', offsetDays: 7 }]);
  };

  const removeTemplateRow = (index) => {
    setTemplateRows(templateRows.filter((_, i) => i !== index));
  };

  const updateTemplateRow = (index, field, val) => {
    const updated = [...templateRows];
    updated[index] = { ...updated[index], [field]: val };
    setTemplateRows(updated);
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          <h2>Administrative Management & Service Catalog</h2>
          <p>Configure clients, service offerings, task templates, and user organization roles</p>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-banner-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert-banner alert-banner-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Admin Subtabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'clients' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('clients')}
        >
          <Building2 size={16} />
          <span>Clients Directory ({clients.length})</span>
        </button>

        <button
          className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('services')}
        >
          <FileText size={16} />
          <span>Services & Templates ({services.length})</span>
        </button>

        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>Team Members & Roles ({allUsers.length})</span>
        </button>
      </div>

      {/* TAB 1: CLIENTS */}
      {activeTab === 'clients' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Registered Corporate Clients</h3>
            <button className="btn btn-primary" onClick={() => setShowClientModal(true)}>
              <Plus size={16} />
              <span>Add Client</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {clients.map((c) => (
              <div key={c.id} className="engagement-card">
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{c.companyName}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Contact: <strong>{c.name}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email: {c.email}</div>
                  {c.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone: {c.phone}</div>}
                  {c.notes && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      "{c.notes}"
                    </p>
                  )}
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                  Active Engagements: {c._count?.engagements || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES & TEMPLATES */}
      {activeTab === 'services' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Service Offerings & Task Template Blueprints</h3>
            {user?.role === 'ADMIN' && (
              <button className="btn btn-primary" onClick={() => setShowServiceModal(true)}>
                <Plus size={16} />
                <span>Create Service Type</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {services.map((svc) => (
              <div key={svc.id} className="engagement-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{svc.name}</h4>
                      <span className="status-badge status-IN_PROGRESS" style={{ fontSize: '0.7rem' }}>
                        {svc.isRecurring ? `${svc.frequency} RECURRING` : 'ONE-TIME'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {svc.description}
                    </p>
                  </div>
                </div>

                {/* Templates list */}
                <div style={{ marginTop: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                    Auto-Instantiated Task Templates ({svc.taskTemplates?.length || 0})
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {svc.taskTemplates?.map((tmpl, idx) => (
                      <div
                        key={tmpl.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(15, 23, 42, 0.4)',
                          padding: '0.5rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            #{idx + 1}
                          </span>
                          <strong style={{ color: 'var(--text-primary)' }}>{tmpl.title}</strong>
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          Default Deadline: +{tmpl.defaultDeadlineOffsetDays} days
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USERS & ROLES */}
      {activeTab === 'users' && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h3>Team Directory & Security Roles</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Server-side permissions strictly enforce authorization for each role.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {allUsers.map((u) => (
              <div key={u.id} className="engagement-card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="user-avatar" style={{ width: 44, height: 44 }} />
                  ) : (
                    <div className="assignee-avatar" style={{ width: 44, height: 44, fontSize: '1rem' }}>
                      {u.name[0]}
                    </div>
                  )}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{u.name}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`status-badge status-${u.role === 'ADMIN' ? 'COMPLETED' : u.role === 'MANAGER' ? 'READY_FOR_REVIEW' : 'IN_PROGRESS'}`} style={{ fontSize: '0.68rem' }}>
                    {u.role.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Default pass: password123</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      {showClientModal && (
        <div className="modal-overlay" onClick={() => setShowClientModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Client</h3>
              <button className="modal-close" onClick={() => setShowClientModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateClient}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Primary Contact Person *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="contact@acme.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Notes</label>
                  <textarea
                    className="form-textarea"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="Industry details, special compliance requirements..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowClientModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SERVICE MODAL */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Service Offering & Task Templates</h3>
              <button className="modal-close" onClick={() => setShowServiceModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateService}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Service Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g. Quarterly Payroll Tax Filing"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                    placeholder="Service scope and deliverables..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Recurring Service?</label>
                    <select
                      className="form-select"
                      value={isRecurring ? 'yes' : 'no'}
                      onChange={(e) => {
                        const rec = e.target.value === 'yes';
                        setIsRecurring(rec);
                        if (!rec) setFrequency('ONE_TIME');
                        else setFrequency('MONTHLY');
                      }}
                    >
                      <option value="no">No (One-Time Service)</option>
                      <option value="yes">Yes (Recurring)</option>
                    </select>
                  </div>
                  {isRecurring && (
                    <div className="form-group">
                      <label className="form-label">Frequency *</label>
                      <select
                        className="form-select"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Template task items */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Task Blueprint Templates
                    </label>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={addTemplateRow}>
                      + Add Task Blueprint
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {templateRows.map((row, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Task title..."
                          value={row.title}
                          onChange={(e) => updateTemplateRow(idx, 'title', e.target.value)}
                          required
                        />
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: '120px' }}
                          title="Offset days from start date"
                          placeholder="Days"
                          value={row.offsetDays}
                          onChange={(e) => updateTemplateRow(idx, 'offsetDays', parseInt(e.target.value, 10))}
                          required
                        />
                        {templateRows.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '0.5rem 0.65rem' }}
                            onClick={() => removeTemplateRow(idx)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Service & Blueprints
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
