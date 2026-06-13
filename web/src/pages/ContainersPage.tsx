import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Container, ContainerStatus } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/State';
import { getStatusLabel, StatusBadge } from '../components/StatusBadge';
import { useLanguage } from '../i18n/LanguageContext';

const statuses: ContainerStatus[] = ['available', 'in_use', 'maintenance', 'retired'];
const emptyContainer: Partial<Container> = { serialNumber: '', name: '', status: 'available' };

export function ContainersPage() {
  const { t, language, locale, formatDate } = useLanguage();
  const { canOperate } = useAuth();
  const [items, setItems] = useState<Container[]>([]);
  const [form, setForm] = useState<Partial<Container>>(emptyContainer);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.containers()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load containers'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const sorted = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name, locale)), [items, locale]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.saveContainer(form);
      setForm(emptyContainer);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  const deleteContainer = async (container: Container) => {
    if (!window.confirm(t('areYouSure'))) return;
    try {
      await api.deleteContainer(container.id);
      if (form.id === container.id) setForm(emptyContainer);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteFailed'));
    }
  };

  const copyApiKey = async (container: Container) => {
    if (!container.apiKey) return;
    await navigator.clipboard.writeText(container.apiKey);
    setCopiedId(container.id);
    window.setTimeout(() => setCopiedId((current) => current === container.id ? null : current), 1800);
  };

  const shortApiKey = (apiKey?: string) => apiKey ? `${apiKey.slice(0, 9)}...${apiKey.slice(-5)}` : '-';

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <PageHeader title={t('containers')} />
      {canOperate && (
        <form className="card form-grid" onSubmit={save}>
          <label className="field">
            <span>{t('serialNumber')}</span>
            <input value={form.serialNumber || ''} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} required />
          </label>
          <label className="field">
            <span>{t('name')}</span>
            <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field">
            <span>{t('status')}</span>
            <select value={form.status || 'available'} onChange={(e) => setForm({ ...form, status: e.target.value as ContainerStatus })}>
              {statuses.map((status) => <option key={status} value={status}>{getStatusLabel(language, status)}</option>)}
            </select>
          </label>
          <div className="form-actions">
            <button className="button" type="submit">{form.id ? t('save') : t('create')}</button>
            {form.id && <button className="button secondary" type="button" onClick={() => setForm(emptyContainer)}>{t('cancel')}</button>}
          </div>
        </form>
      )}
      <section className="card table-card">
        {sorted.length === 0 ? <EmptyState /> : (
          <table>
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('serialNumber')}</th>
                <th>{t('status')}</th>
                <th>{t('latestTelemetry')}</th>
                <th>{t('apiKey')}</th>
                {canOperate && <th>{t('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((container) => (
                <tr key={container.id}>
                  <td>{container.name}</td>
                  <td>{container.serialNumber}</td>
                  <td><StatusBadge value={container.status} /></td>
                  <td>{container.lastTemperature ?? '-'} C / {container.lastHumidity ?? '-'}%<br /><small>{formatDate(container.lastUpdatedAt)}</small></td>
                  <td>
                    <div className="api-key-cell">
                      <code>{shortApiKey(container.apiKey)}</code>
                      {container.apiKey && (
                        <button className="button small secondary" type="button" onClick={() => copyApiKey(container)}>
                          {copiedId === container.id ? t('copied') : t('copy')}
                        </button>
                      )}
                    </div>
                  </td>
                  {canOperate && (
                    <td>
                      <div className="button-row">
                        <button className="button small secondary" type="button" onClick={() => setForm(container)}>{t('edit')}</button>
                        <button className="button small danger" type="button" onClick={() => deleteContainer(container)}>{t('delete')}</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
