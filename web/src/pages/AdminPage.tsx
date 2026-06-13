import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { ExportPayload, User, UserRole } from '../api/types';
import { RoleGate } from '../components/RoleGate';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/State';
import { useLanguage } from '../i18n/LanguageContext';
import { getDeleteErrorMessage } from '../utils/deleteErrors';

const emptyUser: Partial<User> & { password?: string } = {
  email: '',
  name: '',
  role: 'observer',
  password: '',
};

const roles: UserRole[] = ['admin', 'operator', 'observer'];

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminPage() {
  const { t, locale, formatDate } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<Partial<User> & { password?: string }>(emptyUser);
  const [exportPayload, setExportPayload] = useState<ExportPayload | null>(null);
  const [importMessage, setImportMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = () => {
    setLoading(true);
    api.users()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(loadUsers, []);

  const sortedUsers = useMemo(() => [...users].sort((a, b) => a.email.localeCompare(b.email, locale)), [users, locale]);

  const saveUser = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      email: form.email,
      name: form.name,
      role: form.role,
      password: form.password || undefined,
    };

    try {
      if (form.id) {
        await api.updateUser(form.id, payload);
      } else {
        await api.createUser({ ...payload, password: form.password || '123456' });
      }
      setForm(emptyUser);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  const exportData = async () => {
    try {
      const payload = await api.exportData();
      setExportPayload(payload);
      downloadJson(`cargoguard-export-${new Date().toISOString()}.json`, payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    }
  };

  const downloadBackup = async () => {
    try {
      const blob = await api.backup();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cargoguard-backup-${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    }
  };

  const importData = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const result = await api.importData(JSON.parse(text));
      setImportMessage(JSON.stringify(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    }
  };

  const deleteUser = async (user: User) => {
    if (!window.confirm(t('areYouSure'))) return;
    try {
      await api.deleteUser(user.id);
      if (form.id === user.id) setForm(emptyUser);
      loadUsers();
    } catch (err) {
      setError(getDeleteErrorMessage(t, 'user'));
    }
  };

  return (
    <RoleGate allow={['admin']}>
      <PageHeader title={t('admin')} />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && (
        <div className="admin-grid">
          <section className="card">
            <h2>{t('users')}</h2>
            <form className="form-grid compact" onSubmit={saveUser}>
              <label className="field">
                <span>{t('email')}</span>
                <input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </label>
              <label className="field">
                <span>{t('displayName')}</span>
                <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label className="field">
                <span>{t('password')}</span>
                <input value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" />
              </label>
              <label className="field">
                <span>{t('role')}</span>
                <select value={form.role || 'observer'} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                  {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
              <div className="form-actions">
                <button className="button" type="submit">{form.id ? t('save') : t('create')}</button>
                {form.id && <button type="button" className="button secondary" onClick={() => setForm(emptyUser)}>{t('cancel')}</button>}
              </div>
            </form>
            {sortedUsers.length === 0 ? <EmptyState /> : (
              <table>
                <thead>
                  <tr>
                    <th>{t('email')}</th>
                    <th>{t('displayName')}</th>
                    <th>{t('role')}</th>
                    <th>{t('createdAt')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.name}</td>
                      <td>{user.role}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="button-row">
                          <button className="button small secondary" type="button" onClick={() => setForm(user)}>{t('edit')}</button>
                          <button className="button small danger" type="button" onClick={() => deleteUser(user)}>{t('delete')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <section className="card">
            <h2>{t('exportData')}</h2>
            <p className="muted">{t('exportHint')}</p>
            <button className="button" onClick={exportData}>{t('exportData')}</button>
            {exportPayload && (
              <pre className="json-preview">{JSON.stringify(exportPayload, null, 2)}</pre>
            )}
          </section>
          <section className="card">
            <h2>{t('backup')}</h2>
            <p className="muted">{t('backupHint')}</p>
            <button className="button secondary" onClick={downloadBackup}>{t('downloadBackup')}</button>
          </section>
          <section className="card">
            <h2>{t('importData')}</h2>
            <p className="muted">{t('importHint')}</p>
            <label className="field">
              <span>{t('uploadJson')}</span>
              <input type="file" accept="application/json" onChange={(event) => importData(event.target.files?.[0])} />
            </label>
            {importMessage && <pre className="json-preview">{importMessage}</pre>}
          </section>
        </div>
      )}
    </RoleGate>
  );
}
