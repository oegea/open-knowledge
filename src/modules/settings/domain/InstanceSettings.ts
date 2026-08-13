export interface InstanceSettingsPrimitive {
  libraryName: string;
  /** Shown in the public footer; empty hides the ownership line. */
  ownerName: string;
  /** Header logo; shown instead of the name when set. */
  logoPath: string | null;
  /** Optional header logo for the dark theme; falls back to the regular logo. */
  logoDarkPath: string | null;
  /**
   * When the dark theme is active and no dark logo is set, render the header
   * logo with inverted colors so a light-background logo stays visible.
   */
  invertLogoInDarkMode: boolean;
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
    private readonly logoDarkPath: string | null,
    private readonly invertLogoInDarkMode: boolean,
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
    logoDarkPath: string | null,
    invertLogoInDarkMode: boolean,
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
      logoDarkPath?.trim() || null,
      invertLogoInDarkMode,
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
    return InstanceSettings.create(
      'Open Knowledge',
      '',
      null,
      null,
      false,
      null,
      null,
      '',
      '',
      null,
      true,
      false
    );
  }

  static fromPrimitive(data: InstanceSettingsPrimitive): InstanceSettings {
    if (!data) throw new Error('[InstanceSettings] data must be provided');
    return InstanceSettings.create(
      data.libraryName ?? 'Open Knowledge',
      data.ownerName ?? '',
      data.logoPath ?? null,
      data.logoDarkPath ?? null,
      Boolean(data.invertLogoInDarkMode),
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

  /** Dark-theme header logo with fallback to the regular header logo. */
  getLogoDarkPath(): string | null {
    return this.logoDarkPath ?? this.logoPath;
  }

  /** True when the dark logo is its own image rather than a fallback. */
  hasDedicatedDarkLogo(): boolean {
    return this.logoDarkPath !== null;
  }

  shouldInvertLogoInDarkMode(): boolean {
    return this.invertLogoInDarkMode;
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
      logoDarkPath: this.logoDarkPath,
      invertLogoInDarkMode: this.invertLogoInDarkMode,
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
