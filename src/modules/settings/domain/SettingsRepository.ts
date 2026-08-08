import { InstanceSettings } from './InstanceSettings';

export interface SettingsRepository {
  get(): Promise<InstanceSettings>;
  save(settings: InstanceSettings): Promise<void>;
}
