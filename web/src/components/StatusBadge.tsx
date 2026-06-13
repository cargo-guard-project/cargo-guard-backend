import type { IncidentSeverity, ShipmentStatus } from '../api/types';
import { useLanguage } from '../i18n/LanguageContext';

const statusLabels: Record<'en' | 'uk', Record<string, string>> = {
  en: {
    planned: 'Planned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    available: 'Available',
    in_use: 'In Use',
    maintenance: 'Maintenance',
    retired: 'Retired',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  },
  uk: {
    planned: 'Заплановано',
    in_progress: 'В дорозі',
    completed: 'Завершено',
    cancelled: 'Скасовано',
    available: 'Доступний',
    in_use: 'Використовується',
    maintenance: 'Обслуговування',
    retired: 'Списаний',
    low: 'Низька',
    medium: 'Середня',
    high: 'Висока',
    critical: 'Критична',
  },
};

export function getStatusLabel(language: 'en' | 'uk', value?: string) {
  const key = value || 'unknown';
  return statusLabels[language][key] || key.replace(/_/g, ' ');
}

export function StatusBadge({ value }: { value?: ShipmentStatus | IncidentSeverity | string }) {
  const { language } = useLanguage();
  const key = value || 'unknown';
  return <span className={`badge badge-${key}`}>{getStatusLabel(language, key)}</span>;
}
