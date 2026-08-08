export interface InstanceSettingsPrimitive {
  libraryName: string;
  registrationOpen: boolean;
  newsEnabled: boolean;
}

export class InstanceSettings {
  private constructor(
    private readonly libraryName: string,
    private readonly registrationOpen: boolean,
    private readonly newsEnabled: boolean
  ) {}

  static create(libraryName: string, registrationOpen: boolean, newsEnabled: boolean): InstanceSettings {
    InstanceSettings.ensureSettingsAreValid(libraryName);
    return new InstanceSettings(libraryName.trim(), registrationOpen, newsEnabled);
  }

  static createDefault(): InstanceSettings {
    return InstanceSettings.create('Open Knowledge', true, false);
  }

  static fromPrimitive(data: InstanceSettingsPrimitive): InstanceSettings {
    if (!data) throw new Error('[InstanceSettings] data must be provided');
    return InstanceSettings.create(
      data.libraryName ?? 'Open Knowledge',
      Boolean(data.registrationOpen),
      Boolean(data.newsEnabled)
    );
  }

  static ensureSettingsAreValid(libraryName: string): void {
    if (typeof libraryName !== 'string' || libraryName.trim() === '') {
      throw new Error('[InstanceSettings] libraryName cannot be empty');
    }
    if (libraryName.trim().length > 100) {
      throw new Error('[InstanceSettings] libraryName cannot exceed 100 characters');
    }
  }

  getLibraryName(): string {
    return this.libraryName;
  }

  isRegistrationOpen(): boolean {
    return this.registrationOpen;
  }

  isNewsEnabled(): boolean {
    return this.newsEnabled;
  }

  equals(other: InstanceSettings): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): InstanceSettingsPrimitive {
    return {
      libraryName: this.libraryName,
      registrationOpen: this.registrationOpen,
      newsEnabled: this.newsEnabled,
    };
  }
}
