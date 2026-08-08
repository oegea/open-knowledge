import { InstanceSettings, InstanceSettingsPrimitive } from '../domain/InstanceSettings';
import { SettingsRepository } from '../domain/SettingsRepository';

interface updateInstanceSettingsProps extends InstanceSettingsPrimitive {
  settingsRepository: SettingsRepository;
}

export async function updateInstanceSettings({
  libraryName,
  ownerName,
  logoPath,
  heroTitle,
  heroText,
  registrationOpen,
  newsEnabled,
  settingsRepository,
}: updateInstanceSettingsProps): Promise<InstanceSettings> {
  const settings = InstanceSettings.create(
    libraryName,
    ownerName ?? '',
    logoPath ?? null,
    heroTitle ?? '',
    heroText ?? '',
    registrationOpen,
    newsEnabled
  );
  await settingsRepository.save(settings);
  return settings;
}
