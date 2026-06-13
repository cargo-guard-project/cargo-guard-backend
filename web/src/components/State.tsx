import { useLanguage } from '../i18n/LanguageContext';

export function LoadingState() {
  const { t } = useLanguage();
  return <div className="card muted">{t('loading')}...</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="card error">{message}</div>;
}

export function EmptyState() {
  const { t } = useLanguage();
  return <div className="card muted">{t('noData')}</div>;
}
