export interface InstanceSettingsPrimitive {
  libraryName: string;
  /** Shown in the public footer; empty hides the ownership line. */
  ownerName: string;
  /** Header logo; shown instead of the name when set. */
  logoPath: string | null;
  /** Logo for certificates; falls back to the header logo. */
  certificateLogoPath: string | null;
  /** Logo for exported documents (EPUB/PDF); falls back to the header logo. */
  documentLogoPath: string | null;
  /** Custom home headline; empty falls back to the localized default. */
  heroTitle: string;
  /** Custom home subtitle; empty falls back to the localized default. */
  heroText: string;
  /** Optional hero background image; null keeps the default gradient. */
  heroImagePath: string | null;
  registrationOpen: boolean;
  newsEnabled: boolean;
}

export class InstanceSettings {
  private constructor(
    private readonly libraryName: string,
    private readonly ownerName: string,
    private readonly logoPath: string | null,
    private readonly certificateLogoPath: string | null,
    private readonly documentLogoPath: string | null,
    private readonly heroTitle: string,
    private readonly heroText: string,
    private readonly heroImagePath: string | null,
    private readonly registrationOpen: boolean,
    private readonly newsEnabled: boolean
  ) {}

  static create(
    libraryName: string,
    ownerName: string,
    logoPath: string | null,
    certificateLogoPath: string | null,
    documentLogoPath: string | null,
    heroTitle: string,
    heroText: string,
    heroImagePath: string | null,
    registrationOpen: boolean,
    newsEnabled: boolean
  ): InstanceSettings {
    InstanceSettings.ensureSettingsAreValid(libraryName, ownerName);
    return new InstanceSettings(
      libraryName.trim(),
      ownerName.trim(),
      logoPath?.trim() || null,
      certificateLogoPath?.trim() || null,
      documentLogoPath?.trim() || null,
      heroTitle.trim(),
      heroText.trim(),
      heroImagePath?.trim() || null,
      registrationOpen,
      newsEnabled
    );
  }

  static createDefault(): InstanceSettings {
    return InstanceSettings.create('Open Knowledge', '', null, null, null, '', '', null, true, false);
  }

  static fromPrimitive(data: InstanceSettingsPrimitive): InstanceSettings {
    if (!data) throw new Error('[InstanceSettings] data must be provided');
    return InstanceSettings.create(
      data.libraryName ?? 'Open Knowledge',
      data.ownerName ?? '',
      data.logoPath ?? null,
      data.certificateLogoPath ?? null,
      data.documentLogoPath ?? null,
      data.heroTitle ?? '',
      data.heroText ?? '',
      data.heroImagePath ?? null,
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

  getLogoPath(): string | null {
    return this.logoPath;
  }

  /** Certificate logo with fallback to the header logo. */
  getCertificateLogoPath(): string | null {
    return this.certificateLogoPath ?? this.logoPath;
  }

  /** Document (EPUB/PDF) logo with fallback to the header logo. */
  getDocumentLogoPath(): string | null {
    return this.documentLogoPath ?? this.logoPath;
  }

  getHeroTitle(): string {
    return this.heroTitle;
  }

  getHeroText(): string {
    return this.heroText;
  }

  getHeroImagePath(): string | null {
    return this.heroImagePath;
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
      logoPath: this.logoPath,
      certificateLogoPath: this.certificateLogoPath,
      documentLogoPath: this.documentLogoPath,
      heroTitle: this.heroTitle,
      heroText: this.heroText,
      heroImagePath: this.heroImagePath,
      registrationOpen: this.registrationOpen,
      newsEnabled: this.newsEnabled,
    };
  }
}
