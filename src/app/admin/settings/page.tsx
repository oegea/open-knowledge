import settingsFactory from '@/modules/settings/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { SettingsForm } from '@/components/admin/SettingsForm';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const settings = await settingsFactory.getInstanceSettings();

  return (
    <div className={`ok-glass ${styles.panel}`}>
      <h1 className={styles.title}>{translate(dictionary, 'admin.settings')}</h1>
      <SettingsForm initial={settings.toPrimitive()} />
    </div>
  );
}
