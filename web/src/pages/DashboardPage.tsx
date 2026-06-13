import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Container, Incident, Shipment } from '../api/types';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/State';
import { StatusBadge } from '../components/StatusBadge';
import { useLanguage } from '../i18n/LanguageContext';

export function DashboardPage() {
  const { t, formatDate } = useLanguage();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [shipmentData, containerData, incidentData] = await Promise.all([
          api.shipments(),
          api.containers(),
          api.incidents(),
        ]);
        if (!cancelled) {
          setShipments(shipmentData);
          setContainers(containerData);
          setIncidents(incidentData);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeIncidents = useMemo(() => incidents.filter((incident) => !incident.resolvedAt), [incidents]);
  const latestTelemetry = useMemo(() => containers
    .filter((container) => container.lastTemperature !== undefined || container.lastHumidity !== undefined || container.lastUpdatedAt)
    .sort((a, b) => (b.lastUpdatedAt || '').localeCompare(a.lastUpdatedAt || ''))
    .slice(0, 5), [containers]);

  const shipmentForContainer = (containerId: number) => shipments
    .find((shipment) => shipment.containerId === containerId && shipment.status === 'in_progress')
    || shipments.find((shipment) => shipment.containerId === containerId);

  const shipmentForIncident = (incident: Incident) => incident.shipment || shipments.find((shipment) => shipment.id === incident.shipmentId);
  const routeLabel = (shipment?: Shipment) => shipment ? `${shipment.origin} -> ${shipment.destination}` : '-';
  const incidentContextLabel = (incident: Incident, shipment?: Shipment) => {
    const parts = [
      shipment ? `${shipment.origin} -> ${shipment.destination}` : incident.shipmentId ? `Shipment #${incident.shipmentId}` : '',
      shipment?.cargo?.name,
      shipment?.container?.name || shipment?.container?.serialNumber,
    ].filter((part): part is string => Boolean(part && part.trim()));

    return parts.join(' - ');
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <PageHeader title={t('dashboard')} subtitle={t('dashboardSubtitle')} />
      <section className="stat-grid">
        <article className="stat-card">
          <span>{t('activeShipments')}</span>
          <strong>{shipments.filter((shipment) => shipment.status === 'in_progress').length}</strong>
        </article>
        <article className="stat-card">
          <span>{t('totalContainers')}</span>
          <strong>{containers.length}</strong>
        </article>
        <article className="stat-card">
          <span>{t('activeIncidents')}</span>
          <strong>{activeIncidents.length}</strong>
        </article>
      </section>
      <section className="grid two">
        <article className="card">
          <h2>{t('latestTelemetry')}</h2>
          {latestTelemetry.length > 0 ? (
            <div className="stack">
              {latestTelemetry.map((container) => {
                const shipment = shipmentForContainer(container.id);
                const content = (
                  <>
                    <span className="context-line">
                      <strong>{container.name}</strong>
                      <small>{routeLabel(shipment)}</small>
                    </span>
                    <span>
                      <strong>{container.lastTemperature ?? '-'} C / {container.lastHumidity ?? '-'}%</strong>
                      <br />
                      <small>{formatDate(container.lastUpdatedAt)}</small>
                    </span>
                  </>
                );

                return shipment ? (
                  <Link className="row-card context-link" key={container.id} to={`/shipments/${shipment.id}`}>
                    {content}
                  </Link>
                ) : (
                  <div className="row-card" key={container.id}>{content}</div>
                );
              })}
            </div>
          ) : (
            <EmptyState />
          )}
        </article>
        <article className="card">
          <h2>{t('incidents')}</h2>
          <div className="stack">
            {activeIncidents.slice(0, 5).map((incident) => (
              (() => {
                const shipment = shipmentForIncident(incident);
                const context = incidentContextLabel(incident, shipment);
                const content = (
                  <>
                    <span className="context-line">
                      <strong>{incident.description}</strong>
                      {context && <small>{context}</small>}
                    </span>
                    <StatusBadge value={incident.severity} />
                  </>
                );

                return shipment ? (
                  <Link className="row-card context-link" key={incident.id} to={`/shipments/${shipment.id}`}>
                    {content}
                  </Link>
                ) : (
                  <Link className="row-card context-link" key={incident.id} to="/incidents">
                    {content}
                  </Link>
                );
              })()
            ))}
            {activeIncidents.length === 0 && <EmptyState />}
          </div>
        </article>
      </section>
    </>
  );
}
