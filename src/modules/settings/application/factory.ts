import { getInstanceSettings } from './getInstanceSettings';
import { updateInstanceSettings } from './updateInstanceSettings';
import { InstanceSettingsPrimitive } from '../domain/InstanceSettings';
import { SqliteSettingsRepository } from '../infrastructure/SqliteSettingsRepository';
import { StaticSettingsRepository } from '../infrastructure/StaticSettingsRepository';
import { isStaticMode } from '../../shared/infrastructure/StaticContentClient';

import type { SettingsRepository } from '../domain/SettingsRepository';

const settingsRepository = (): SettingsRepository =>
  isStaticMode() ? new StaticSettingsRepository() : new SqliteSettingsRepository();

export default {
  getInstanceSettings: async () =>
    await getInstanceSettings({ settingsRepository: settingsRepository() }),

  updateInstanceSettings: async (settings: InstanceSettingsPrimitive) =>
    await updateInstanceSettings({
      ...settings,
      settingsRepository: settingsRepository(),
    }),
};
