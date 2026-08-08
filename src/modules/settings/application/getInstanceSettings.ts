import { InstanceSettings } from '../domain/InstanceSettings';
import { SettingsRepository } from '../domain/SettingsRepository';

interface getInstanceSettingsProps {
  settingsRepository: SettingsRepository;
}

export async function getInstanceSettings({
  settingsRepository,
}: getInstanceSettingsProps): Promise<InstanceSettings> {
  return await settingsRepository.get();
}
