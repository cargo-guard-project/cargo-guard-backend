import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Cargo } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/State';
import { useLanguage } from '../i18n/LanguageContext';
import { getDeleteErrorMessage } from '../utils/deleteErrors';

const emptyCargo: Partial<Cargo> = {
  name: '',
  description: '',
  type: '',
};

export function CargoPage() {
  const { t, locale } = useLanguage();
  const { canOperate } = useAuth();
  const [items, setItems] = useState<Cargo[]>([]);
  const [form, setForm] = useState<Partial<Cargo>>(emptyCargo);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.cargo()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load cargo'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const sorted = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name, locale)), [items, locale]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.saveCargo({
        ...form,
        temperatureMin: Number(form.temperatureMin),
        temperatureMax: Number(form.temperatureMax),
        humidityMin: Number(form.humidityMin),
        humidityMax: Number(form.humidityMax),
      });
      setForm(emptyCargo);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  const deleteCargo = async (cargo: Cargo) => {
    if (!window.confirm(t('areYouSure'))) return;
    try {
      await api.deleteCargo(cargo.id);
      if (form.id === cargo.id) setForm(emptyCargo);
      load();
    } catch (err) {
      setError(getDeleteErrorMessage(t, 'cargo'));
    }
  };

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader title={t('cargo')} />
      {error && <ErrorState message={error} />}
      {canOperate && (
        <form className="card form-grid cargo-form" onSubmit={save}>
          <label className="field">
            <span>{t('name')}</span>
            <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field">
            <span>{t('type')}</span>
            <input value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
          </label>
          <label className="field">
            <span>{t('description')}</span>
            <input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="field range-start">
            <span>{t('minTemperature')}</span>
            <input type="number" value={form.temperatureMin ?? ''} onChange={(e) => setForm({ ...form, temperatureMin: e.target.value === '' ? undefined : Number(e.target.value) })} required />
          </label>
          <label className="field">
            <span>{t('maxTemperature')}</span>
            <input type="number" value={form.temperatureMax ?? ''} onChange={(e) => setForm({ ...form, temperatureMax: e.target.value === '' ? undefined : Number(e.target.value) })} required />
          </label>
          <label className="field range-start">
            <span>{t('minHumidity')}</span>
            <input type="number" value={form.humidityMin ?? ''} onChange={(e) => setForm({ ...form, humidityMin: e.target.value === '' ? undefined : Number(e.target.value) })} required />
          </label>
          <label className="field">
            <span>{t('maxHumidity')}</span>
            <input type="number" value={form.humidityMax ?? ''} onChange={(e) => setForm({ ...form, humidityMax: e.target.value === '' ? undefined : Number(e.target.value) })} required />
          </label>
          <div className="form-actions">
            <button className="button" type="submit">{form.id ? t('save') : t('create')}</button>
            {form.id && <button className="button secondary" type="button" onClick={() => setForm(emptyCargo)}>{t('cancel')}</button>}
          </div>
        </form>
      )}
      <section className="card table-card">
        {sorted.length === 0 ? <EmptyState /> : (
          <table>
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('type')}</th>
                <th>{t('temperature')}</th>
                <th>{t('humidity')}</th>
                {canOperate && <th>{t('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((cargo) => (
                <tr key={cargo.id}>
                  <td>{cargo.name}</td>
                  <td>{cargo.type}</td>
                  <td>{cargo.temperatureMin} - {cargo.temperatureMax} C</td>
                  <td>{cargo.humidityMin} - {cargo.humidityMax}%</td>
                  {canOperate && (
                    <td>
                      <div className="button-row">
                        <button className="button small secondary" type="button" onClick={() => setForm(cargo)}>{t('edit')}</button>
                        <button className="button small danger" type="button" onClick={() => deleteCargo(cargo)}>{t('delete')}</button>
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
