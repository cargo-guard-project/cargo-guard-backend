import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Cargo, Container, Shipment, ShipmentStatus } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/State';
import { StatusBadge } from '../components/StatusBadge';
import { useLanguage } from '../i18n/LanguageContext';
import { getDeleteErrorMessage } from '../utils/deleteErrors';

const shipmentStatuses: Array<'all' | ShipmentStatus> = ['all', 'planned', 'in_progress', 'completed', 'cancelled'];
const editableShipmentStatuses: ShipmentStatus[] = ['planned', 'in_progress', 'completed', 'cancelled'];
const blockingShipmentStatuses: ShipmentStatus[] = ['planned', 'in_progress'];

const statusTranslationKey: Record<'all' | ShipmentStatus, 'all' | 'planned' | 'inProgress' | 'completed' | 'cancelled'> = {
  all: 'all',
  planned: 'planned',
  in_progress: 'inProgress',
  completed: 'completed',
  cancelled: 'cancelled',
};

const emptyShipment: Partial<Shipment> = {
  origin: '',
  destination: '',
  cargoId: undefined,
  containerId: undefined,
  status: 'planned',
  startDate: '',
  endDate: '',
  notes: '',
};

function toDateTimeInput(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDateTimeInput(value?: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

export function ShipmentsPage() {
  const { t, locale, formatDate } = useLanguage();
  const { canOperate } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [cargo, setCargo] = useState<Cargo[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [form, setForm] = useState<Partial<Shipment>>(emptyShipment);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | ShipmentStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([api.shipments(), api.cargo(), api.containers()])
      .then(([shipmentData, cargoData, containerData]) => {
        setShipments(shipmentData);
        setCargo(cargoData);
        setContainers(containerData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load shipments'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const normalized = query.trim();
    return shipments
      .filter((shipment) => status === 'all' || shipment.status === status)
      .filter((shipment) => {
        if (!normalized) return true;
        return [
          shipment.origin,
          shipment.destination,
          shipment.cargo?.name,
          shipment.container?.name,
          shipment.container?.serialNumber,
        ].some((value) => value?.toLocaleLowerCase().includes(normalized.toLocaleLowerCase()));
      })
      .sort((a, b) => a.origin.localeCompare(b.origin, locale));
  }, [locale, query, shipments, status]);

  const busyResourceIds = useMemo(() => {
    const busyCargoIds = new Set<number>();
    const busyContainerIds = new Set<number>();

    shipments
      .filter((shipment) => blockingShipmentStatuses.includes(shipment.status))
      .filter((shipment) => shipment.id !== form.id)
      .forEach((shipment) => {
        busyCargoIds.add(shipment.cargoId);
        busyContainerIds.add(shipment.containerId);
      });

    return { busyCargoIds, busyContainerIds };
  }, [form.id, shipments]);

  const selectableCargo = useMemo(
    () => cargo.filter((item) => !busyResourceIds.busyCargoIds.has(item.id) || item.id === form.cargoId),
    [busyResourceIds.busyCargoIds, cargo, form.cargoId],
  );

  const selectableContainers = useMemo(
    () => containers.filter((container) => !busyResourceIds.busyContainerIds.has(container.id) || container.id === form.containerId),
    [busyResourceIds.busyContainerIds, containers, form.containerId],
  );

  const saveShipment = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.saveShipment({
        ...form,
        cargoId: Number(form.cargoId),
        containerId: Number(form.containerId),
        startDate: fromDateTimeInput(form.startDate),
        endDate: fromDateTimeInput(form.endDate),
      });
      setForm(emptyShipment);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  const editShipment = (shipment: Shipment) => {
    setForm({
      id: shipment.id,
      status: shipment.status,
      startDate: toDateTimeInput(shipment.startDate),
      endDate: toDateTimeInput(shipment.endDate),
      origin: shipment.origin,
      destination: shipment.destination,
      notes: shipment.notes || '',
      cargoId: shipment.cargoId,
      containerId: shipment.containerId,
    });
  };

  const deleteShipment = async (shipment: Shipment) => {
    if (!window.confirm(t('areYouSure'))) return;
    try {
      await api.deleteShipment(shipment.id);
      if (form.id === shipment.id) setForm(emptyShipment);
      load();
    } catch (err) {
      setError(getDeleteErrorMessage(t, 'shipment'));
    }
  };

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader title={t('shipments')} />
      {error && <ErrorState message={error} />}
      {canOperate && (
        <form className="card form-grid" onSubmit={saveShipment}>
          <label className="field">
            <span>{t('origin')}</span>
            <input
              value={form.origin || ''}
              onChange={(event) => setForm({ ...form, origin: event.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>{t('destination')}</span>
            <input
              value={form.destination || ''}
              onChange={(event) => setForm({ ...form, destination: event.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>{t('cargoItem')}</span>
            <select
              value={form.cargoId ?? ''}
              onChange={(event) => setForm({ ...form, cargoId: Number(event.target.value) })}
              required
            >
              <option value="">{t('cargoItem')}</option>
              {selectableCargo.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t('container')}</span>
            <select
              value={form.containerId ?? ''}
              onChange={(event) => setForm({ ...form, containerId: Number(event.target.value) })}
              required
            >
              <option value="">{t('container')}</option>
              {selectableContainers.map((container) => (
                <option key={container.id} value={container.id}>{container.name} / {container.serialNumber}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t('status')}</span>
            <select
              value={form.status || 'planned'}
              onChange={(event) => setForm({ ...form, status: event.target.value as ShipmentStatus })}
            >
              {editableShipmentStatuses.map((item) => (
                <option key={item} value={item}>{t(statusTranslationKey[item])}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t('startDate')}</span>
            <input
              type="datetime-local"
              value={form.startDate || ''}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{t('endDate')}</span>
            <input
              type="datetime-local"
              value={form.endDate || ''}
              onChange={(event) => setForm({ ...form, endDate: event.target.value })}
            />
          </label>
          <label className="field full">
            <span>{t('notes')}</span>
            <textarea
              value={form.notes || ''}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
          <div className="form-actions">
            <button className="button" type="submit">{form.id ? t('save') : t('create')}</button>
            {form.id && (
              <button className="button secondary" type="button" onClick={() => setForm(emptyShipment)}>
                {t('cancel')}
              </button>
            )}
          </div>
        </form>
      )}
      <section className="card filters">
        <input placeholder={t('search')} value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="chip-row">
          {shipmentStatuses.map((item) => (
            <button
              key={item}
              type="button"
              className={`chip ${status === item ? 'selected' : ''}`}
              onClick={() => setStatus(item)}
            >
              {t(statusTranslationKey[item])}
            </button>
          ))}
        </div>
      </section>
      <section className="card table-card">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('route')}</th>
                <th>{t('cargoItem')}</th>
                <th>{t('container')}</th>
                <th>{t('status')}</th>
                <th>{t('dates')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((shipment) => (
                <tr key={shipment.id}>
                  <td>{shipment.origin}{' -> '}{shipment.destination}</td>
                  <td>{shipment.cargo?.name || '-'}</td>
                  <td>{shipment.container?.name || shipment.container?.serialNumber || '-'}</td>
                  <td><StatusBadge value={shipment.status} /></td>
                  <td>{formatDate(shipment.startDate)} - {formatDate(shipment.endDate)}</td>
                  <td>
                    <div className="button-row">
                      <Link className="button small" to={`/shipments/${shipment.id}`}>{t('open')}</Link>
                      {canOperate && (
                        <>
                          <button className="button small secondary" type="button" onClick={() => editShipment(shipment)}>
                            {t('edit')}
                          </button>
                          <button className="button small danger" type="button" onClick={() => deleteShipment(shipment)}>
                            {t('delete')}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
