import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

export function RoleGate({
  allow,
  children,
}: {
  allow: Array<'admin' | 'operator' | 'observer'>;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user || !allow.includes(user.role)) {
    return (
      <section className="card">
        <h2>{t('accessDenied')}</h2>
      </section>
    );
  }

  return <>{children}</>;
}
