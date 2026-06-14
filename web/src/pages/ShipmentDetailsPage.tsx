import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Incident, Shipment, TelemetryRecord } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/State';
import { StatusBadge } from '../components/StatusBadge';
import { useLanguage } from '../i18n/LanguageContext';

export function ShipmentDetailsPage() {
  const { id } = useParams();
  const shipmentId = Number(id);
  const { canOperate } = useAuth();
  const { t, formatDate } = useLanguage();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [requestingTelemetry, setRequestingTelemetry] = useState(false);
  const [resolvingIncidentId, setResolvingIncidentId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [shipmentData, incidentData, telemetryData] = await Promise.all([
        api.shipment(shipmentId),
        api.shipmentIncidents(shipmentId),
        api.shipmentTelemetry(shipmentId, 25),
      ]);
      setShipment(shipmentData);
      setIncidents(incidentData);
      setTelemetry(telemetryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shipment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [shipmentId]);

  const updateStatus = async (action: 'start' | 'complete' | 'cancel') => {
    setActionError('');
    setActionSuccess('');
    try {
      await api.updateShipmentStatus(shipmentId, action);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('actionFailed'));
    }
  };

  const requestTelemetry = async () => {
    setActionError('');
    setActionSuccess('');
    setRequestingTelemetry(true);
    try {
      await api.requestShipmentTelemetry(shipmentId);
      await load();
      setActionSuccess(t('telemetryReceived'));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('requestTelemetryFailed'));
    } finally {
      setRequestingTelemetry(false);
    }
  };

  const resolveIncident = async (incidentId: number) => {
    setActionError('');
    setActionSuccess('');
    setResolvingIncidentId(incidentId);
    try {
      await api.resolveIncident(incidentId);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setResolvingIncidentId(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!shipment) return <EmptyState />;

  const statusActions = shipment.status === 'planned'
    ? ['start', 'cancel'] as const
    : shipment.status === 'in_progress'
      ? ['complete', 'cancel'] as const
      : [];

  const actionLabels = {
    start: t('start'),
    complete: t('complete'),
    cancel: t('cancel'),
  };
  const canRequestTelemetry = shipment.status === 'in_progress';

  return (
    <>
      <PageHeader
        title={`${t('shipmentDetails')} #${shipment.id}`}
        actions={canOperate && (
          <div className="page-action-stack">
            <div className="button-row">
              {statusActions.map((action) => (
                <button className="button secondary" key={action} onClick={() => updateStatus(action)}>
                  {actionLabels[action]}
                </button>
              ))}
              <button
                className="button"
                disabled={!canRequestTelemetry || requestingTelemetry}
                onClick={requestTelemetry}
                type="button"
              >
                {requestingTelemetry ? `${t('loading')}...` : t('requestTelemetry')}
              </button>
            </div>
            {!canRequestTelemetry && <small className="muted">{t('telemetryActiveOnly')}</small>}
          </div>
        )}
      />
      {actionError && <div className="card inline-error">{actionError}</div>}
      {actionSuccess && <div className="card inline-success">{actionSuccess}</div>}
      <section className="grid two">
        <article className="card">
          <h2>{t('route')}</h2>
          <p><strong>{shipment.origin}</strong>{' -> '}<strong>{shipment.destination}</strong></p>
          <p><StatusBadge value={shipment.status} /></p>
          <p>{formatDate(shipment.startDate)} - {formatDate(shipment.endDate)}</p>
          <p>{shipment.notes}</p>
        </article>
        <article className="card">
          <h2>{t('cargo')} / {t('container')}</h2>
          <p>{shipment.cargo?.name} ({shipment.cargo?.type})</p>
          <p>{t('temperature')}: {shipment.cargo?.temperatureMin} - {shipment.cargo?.temperatureMax} C</p>
          <p>{t('humidity')}: {shipment.cargo?.humidityMin} - {shipment.cargo?.humidityMax}%</p>
          <p>{shipment.container?.name} / {shipment.container?.serialNumber}</p>
        </article>
      </section>
      <section className="grid two">
        <article className="card">
          <h2>{t('latestTelemetry')}</h2>
          {telemetry.length === 0 ? <EmptyState /> : telemetry.slice(0, 8).map((record) => (
            <div className="row-card" key={record.id}>
              <span>{formatDate(record.timestamp)}</span>
              <strong>{record.temperature} C</strong>
              <strong>{record.humidity}%</strong>
            </div>
          ))}
        </article>
        <article className="card">
          <h2>{t('incidents')}</h2>
          {incidents.length === 0 ? <EmptyState /> : incidents.map((incident) => (
            <div className="row-card" key={incident.id}>
              <div className="context-line">
                <strong>{incident.description}</strong>
                <span className="muted">{formatDate(incident.createdAt)}</span>
                {incident.resolvedAt && <span className="muted">{t('resolvedAt')}: {formatDate(incident.resolvedAt)}</span>}
              </div>
              <div className="button-row">
                <StatusBadge value={incident.severity} />
                {canOperate && !incident.resolvedAt && (
                  <button
                    className="button small"
                    disabled={resolvingIncidentId === incident.id}
                    onClick={() => resolveIncident(incident.id)}
                    type="button"
                  >
                    {resolvingIncidentId === incident.id ? `${t('loading')}...` : t('resolve')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </article>
      </section>
    </>
  );
}
