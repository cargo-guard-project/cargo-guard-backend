import type { TranslationKey } from '../i18n/translations';

type Translate = (key: TranslationKey) => string;

export type DeleteEntity = 'cargo' | 'container' | 'shipment' | 'user';

export function getDeleteErrorMessage(t: Translate, entity: DeleteEntity): string {
  switch (entity) {
    case 'cargo':
      return t('deleteCargoInUse');
    case 'container':
      return t('deleteContainerInUse');
    case 'shipment':
      return t('deleteShipmentRelated');
    case 'user':
    default:
      return t('deleteRecordFailed');
  }
}
