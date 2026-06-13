import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Incident, IncidentSeverity } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/State';
import { getStatusLabel, StatusBadge } from '../components/StatusBadge';
import { useLanguage } from '../i18n/LanguageContext';

type IncidentStatus = 'all' | 'active' | 'resolved';
const severities: Array<'all' | IncidentSeverity> = ['all', 'low', 'medium', 'high', 'critical'];

export function IncidentsPage() {
  const { t, language, formatDate } = useLanguage();
  const { canOperate } = useAuth();
  const [items, setItems] = useState<Incident[]>([]);
  const [severity, setSeverity] = useState<'all' | IncidentSeverity>('all');
  const [status, setStatus] = useState<IncidentStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.incidents()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load incidents'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => items.filter((incident) => {
    const severityMatches = severity === 'all' || incident.severity === severity;
    const statusMatches = status === 'all' || (status === 'active' ? !incident.resolvedAt : !!incident.resolvedAt);
    return severityMatches && statusMatches;
  }), [items, severity, status]);

  const resolve = async (id: number) => {
    try {
      await api.resolveIncident(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <PageHeader title={t('incidents')} />
      <section className="card filters inline-filters">
        <label className="field">
          <span>{t('status')}</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as IncidentStatus)}>
            <option value="all">{t('all')}</option>
            <option value="active">{t('active')}</option>
            <option value="resolved">{t('resolved')}</option>
          </select>
        </label>
        <label className="field">
          <span>{t('severity')}</span>
          <select value={severity} onChange={(event) => setSeverity(event.target.value as 'all' | IncidentSeverity)}>
            {severities.map((item) => <option value={item} key={item}>{item === 'all' ? t('all') : getStatusLabel(language, item)}</option>)}
          </select>
        </label>
      </section>
      <section className="card table-card">
        {filtered.length === 0 ? <EmptyState /> : (
          <table>
            <thead>
              <tr>
                <th>{t('type')}</th>
                <th>{t('severity')}</th>
                <th>{t('description')}</th>
                <th>{t('createdAt')}</th>
                <th>{t('resolvedAt')}</th>
                {canOperate && <th>{t('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((incident) => (
                <tr key={incident.id}>
                  <td>{incident.type.replace('_', ' ')}</td>
                  <td><StatusBadge value={incident.severity} /></td>
                  <td>{incident.description}</td>
                  <td>{formatDate(incident.createdAt)}</td>
                  <td>{formatDate(incident.resolvedAt)}</td>
                  {canOperate && <td>{!incident.resolvedAt && <button className="button small" onClick={() => resolve(incident.id)}>{t('resolve')}</button>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
