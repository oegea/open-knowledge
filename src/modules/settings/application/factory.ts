import { getInstanceSettings } from './getInstanceSettings';
import { updateInstanceSettings } from './updateInstanceSettings';
import { InstanceSettingsPrimitive } from '../domain/InstanceSettings';
import { SqliteSettingsRepository } from '../infrastructure/SqliteSettingsRepository';

export default {
  getInstanceSettings: async () =>
    await getInstanceSettings({ settingsRepository: new SqliteSettingsRepository() }),

  updateInstanceSettings: async (settings: InstanceSettingsPrimitive) =>
    await updateInstanceSettings({
      ...settings,
      settingsRepository: new SqliteSettingsRepository(),
    }),
};
