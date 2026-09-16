import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { X, AlertCircle, ListPlus } from 'lucide-react';

export const NewEngagementModal = ({ onClose, onSuccess }) => {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form fields
  const [clientId, setClientId] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cl, sv] = await Promise.all([api.getClients(), api.getServices()]);
        setClients(cl);
        setServices(sv);
        if (cl.length > 0) setClientId(cl[0].id);
        if (sv.length > 0) {
          setServiceTypeId(sv[0].id);
          updateDefaultsForService(sv[0], cl[0]);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch clients or services');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateDefaultsForService = (service, client) => {
    const clientName = client ? client.companyName : '';
    if (service.isRecurring) {
      const now = new Date();
      let defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (service.frequency === 'YEARLY') defaultPeriod = `${now.getFullYear()}`;
      if (service.frequency === 'QUARTERLY') defaultPeriod = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
      setPeriod(defaultPeriod);
      setTitle(`${service.name} - ${defaultPeriod}${clientName ? ` (${clientName})` : ''}`);
    } else {
      setPeriod('ONE_TIME');
      setTitle(`${service.name}${clientName ? ` (${clientName})` : ''}`);
    }
  };

  const handleClientChange = (cId) => {
    setClientId(cId);
    const client = clients.find((c) => c.id === cId);
    const service = services.find((s) => s.id === serviceTypeId);
    if (service) updateDefaultsForService(service, client);
  };

  const handleServiceChange = (sId) => {
    setServiceTypeId(sId);
    const service = services.find((s) => s.id === sId);
    const client = clients.find((c) => c.id === clientId);
    if (service) updateDefaultsForService(service, client);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await api.createEngagement({
        clientId,
        serviceTypeId,
        title,
        period: period || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create engagement');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s.id === serviceTypeId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Engagement</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert-banner alert-banner-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading form data...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Client Select */}
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select
                      className="form-select"
                      value={clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      required
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Service Type Select */}
                  <div className="form-group">
                    <label className="form-label">Service Type *</label>
                    <select
                      className="form-select"
                      value={serviceTypeId}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      required
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.isRecurring ? s.frequency : 'One-Time'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Engagement Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  {/* Period */}
                  <div className="form-group">
                    <label className="form-label">Period</label>
                    <input
                      type="text"
                      className="form-input"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      placeholder="e.g. 2026-10"
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {selectedService?.isRecurring ? 'Unique per client & period' : 'One-time service'}
                    </span>
                  </div>

                  {/* Start Date */}
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  {/* Target Date */}
                  <div className="form-group">
                    <label className="form-label">Target Completion</label>
                    <input
                      type="date"
                      className="form-input"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Template Tasks Preview */}
                {selectedService && selectedService.taskTemplates && selectedService.taskTemplates.length > 0 && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <ListPlus size={16} color="#818cf8" />
                      <label className="form-label" style={{ marginBottom: 0 }}>
                        Auto-Generated Tasks ({selectedService.taskTemplates.length})
                      </label>
                    </div>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {selectedService.taskTemplates.map((t) => (
                        <li key={t.id} style={{ marginBottom: '0.25rem' }}>
                          <strong>{t.title}</strong> (Due +{t.defaultDeadlineOffsetDays} days)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || loading}>
              {submitting ? 'Creating Engagement & Tasks...' : 'Create Engagement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
