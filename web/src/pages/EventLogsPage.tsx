import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { EventLog } from '../api/types';
import { RoleGate } from '../components/RoleGate';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/State';
import { useLanguage } from '../i18n/LanguageContext';

export function EventLogsPage() {
  const { t, locale, formatDate } = useLanguage();
  const [items, setItems] = useState<EventLog[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.eventLogs()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load event logs'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return items
      .filter((event) => !normalized || [event.action, event.entityType, event.user?.email].some((value) => value?.toLocaleLowerCase().includes(normalized)))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '', locale));
  }, [items, locale, query]);

  return (
    <RoleGate allow={['admin']}>
      <PageHeader title={t('eventLogs')} />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <section className="card filters">
            <input placeholder={t('search')} value={query} onChange={(event) => setQuery(event.target.value)} />
          </section>
          <section className="card table-card">
            {filtered.length === 0 ? <EmptyState /> : (
              <table>
                <thead>
                  <tr>
                    <th>{t('createdAt')}</th>
                    <th>{t('actions')}</th>
                    <th>{t('type')}</th>
                    <th>{t('user')}</th>
                    <th>{t('details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr key={event.id}>
                      <td>{formatDate(event.createdAt)}</td>
                      <td>{event.action}</td>
                      <td>{event.entityType} #{event.entityId}</td>
                      <td>{event.user?.email || event.userId || '-'}</td>
                      <td><code>{JSON.stringify(event.details || {})}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </RoleGate>
  );
}
