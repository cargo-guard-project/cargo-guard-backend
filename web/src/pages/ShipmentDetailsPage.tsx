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
    try {
      await api.updateShipmentStatus(shipmentId, action);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('actionFailed'));
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

  return (
    <>
      <PageHeader
        title={`${t('shipmentDetails')} #${shipment.id}`}
        actions={canOperate && statusActions.length > 0 && (
          <div className="button-row">
            {statusActions.map((action) => (
              <button className="button secondary" key={action} onClick={() => updateStatus(action)}>
                {actionLabels[action]}
              </button>
            ))}
          </div>
        )}
      />
      {actionError && <div className="card inline-error">{actionError}</div>}
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
              <span>{incident.description}</span>
              <StatusBadge value={incident.severity} />
            </div>
          ))}
        </article>
      </section>
    </>
  );
}
