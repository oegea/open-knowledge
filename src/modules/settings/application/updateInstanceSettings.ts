import { InstanceSettings, InstanceSettingsPrimitive } from '../domain/InstanceSettings';
import { SettingsRepository } from '../domain/SettingsRepository';

interface updateInstanceSettingsProps extends InstanceSettingsPrimitive {
  settingsRepository: SettingsRepository;
}

export async function updateInstanceSettings({
  libraryName,
  ownerName,
  logoPath,
  certificateLogoPath,
  documentLogoPath,
  heroTitle,
  heroText,
  heroImagePath,
  registrationOpen,
  newsEnabled,
  settingsRepository,
}: updateInstanceSettingsProps): Promise<InstanceSettings> {
  const settings = InstanceSettings.create(
    libraryName,
    ownerName ?? '',
    logoPath ?? null,
    certificateLogoPath ?? null,
    documentLogoPath ?? null,
    heroTitle ?? '',
    heroText ?? '',
    heroImagePath ?? null,
    registrationOpen,
    newsEnabled
  );
  await settingsRepository.save(settings);
  return settings;
}
