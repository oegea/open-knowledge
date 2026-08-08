import { SettingsRepository } from '../../../settings/domain/SettingsRepository';
import { InstanceSettings } from '../../../settings/domain/InstanceSettings';

export function create(overrides?: Partial<SettingsRepository>): SettingsRepository {
  return {
    get: jest.fn().mockResolvedValue(InstanceSettings.createDefault()),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
