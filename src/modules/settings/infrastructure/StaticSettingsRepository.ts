import { InstanceSettings, InstanceSettingsPrimitive } from '../domain/InstanceSettings';
import { SettingsRepository } from '../domain/SettingsRepository';
import {
  fetchContentJson,
  resolveContentUrl,
} from '../../shared/infrastructure/StaticContentClient';

/** Read-only settings from the content repository (ADR 0013). */
export class StaticSettingsRepository implements SettingsRepository {
  async get(): Promise<InstanceSettings> {
    const data = await fetchContentJson<InstanceSettingsPrimitive>('settings.json');
    if (!data) return InstanceSettings.createDefault();

    return InstanceSettings.fromPrimitive({
      ...data,
      logoPath: resolveContentUrl(data.logoPath ?? null),
      logoDarkPath: resolveContentUrl(data.logoDarkPath ?? null),
      certificateLogoPath: resolveContentUrl(data.certificateLogoPath ?? null),
      documentLogoPath: resolveContentUrl(data.documentLogoPath ?? null),
      heroImagePath: resolveContentUrl(data.heroImagePath ?? null),
      // Identity does not exist in static mode.
      registrationOpen: false,
    });
  }

  async save(): Promise<void> {
    throw new Error('[StaticSettingsRepository] static content mode is read-only');
  }
}
