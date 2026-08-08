export interface InstanceSettingsPrimitive {
  libraryName: string;
  /** Shown in the public footer; empty hides the ownership line. */
  ownerName: string;
  registrationOpen: boolean;
  newsEnabled: boolean;
}

export class InstanceSettings {
  private constructor(
    private readonly libraryName: string,
    private readonly ownerName: string,
    private readonly registrationOpen: boolean,
    private readonly newsEnabled: boolean
  ) {}

  static create(
    libraryName: string,
    ownerName: string,
    registrationOpen: boolean,
    newsEnabled: boolean
  ): InstanceSettings {
    InstanceSettings.ensureSettingsAreValid(libraryName, ownerName);
    return new InstanceSettings(libraryName.trim(), ownerName.trim(), registrationOpen, newsEnabled);
  }

  static createDefault(): InstanceSettings {
    return InstanceSettings.create('Open Knowledge', '', true, false);
  }

  static fromPrimitive(data: InstanceSettingsPrimitive): InstanceSettings {
    if (!data) throw new Error('[InstanceSettings] data must be provided');
    return InstanceSettings.create(
      data.libraryName ?? 'Open Knowledge',
      data.ownerName ?? '',
      Boolean(data.registrationOpen),
      Boolean(data.newsEnabled)
    );
  }

  static ensureSettingsAreValid(libraryName: string, ownerName: string): void {
    if (typeof libraryName !== 'string' || libraryName.trim() === '') {
      throw new Error('[InstanceSettings] libraryName cannot be empty');
    }
    if (libraryName.trim().length > 100) {
      throw new Error('[InstanceSettings] libraryName cannot exceed 100 characters');
    }
    if (typeof ownerName !== 'string' || ownerName.trim().length > 100) {
      throw new Error('[InstanceSettings] ownerName cannot exceed 100 characters');
    }
  }

  getLibraryName(): string {
    return this.libraryName;
  }

  getOwnerName(): string {
    return this.ownerName;
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
      ownerName: this.ownerName,
      registrationOpen: this.registrationOpen,
      newsEnabled: this.newsEnabled,
    };
  }
}
