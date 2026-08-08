const IDENTIFIER_PATTERN = /^[\p{L}]{3,24}#\d{3,4}$/u;

/** Knowledge- and sky-themed words used to build pseudonymous identities. */
export const IDENTIFIER_WORDS = [
  'Erudito', 'Sabia', 'Lectora', 'Lector', 'Aprendiz', 'Maestra', 'Maestro', 'Escriba',
  'Filosofa', 'Filosofo', 'Poeta', 'Rapsoda', 'Cronista', 'Bibliofila', 'Bibliofilo',
  'Scholar', 'Sage', 'Reader', 'Learner', 'Seeker', 'Thinker', 'Scribe', 'Curator',
  'Lumen', 'Nova', 'Quasar', 'Pulsar', 'Nebula', 'Cosmos', 'Orion', 'Vega', 'Lyra',
  'Sirius', 'Atlas', 'Aurora', 'Boreal', 'Zenit', 'Halley', 'Andromeda', 'Cassiopea',
  'Logos', 'Sophia', 'Athenea', 'Minerva', 'Hypatia', 'Euclides', 'Tales', 'Pitagoras',
  'Alexandria', 'Biblioteca', 'Codice', 'Papiro', 'Pergamino', 'Tinta', 'Pluma',
  'Origami', 'Bonsai', 'Bambu', 'Cedro', 'Roble', 'Sequoia', 'Loto', 'Iris',
  'Ambar', 'Jade', 'Onix', 'Opalo', 'Zafiro', 'Coral', 'Perla', 'Cuarzo',
] as const;

export class UserIdentifier {
  private constructor(private readonly value: string) {}

  static create(identifier: string): UserIdentifier {
    UserIdentifier.ensureIdentifierIsValid(identifier);
    return new UserIdentifier(identifier);
  }

  static fromPrimitive(identifier: string): UserIdentifier {
    return UserIdentifier.create(identifier);
  }

  static ensureIdentifierIsValid(identifier: string): void {
    if (typeof identifier !== 'string' || !IDENTIFIER_PATTERN.test(identifier)) {
      throw new Error(
        '[UserIdentifier] identifier must be a word followed by # and 3-4 digits (e.g. Erudito#4821)'
      );
    }
  }

  /**
   * Generates a random pseudonymous identifier: a word plus 3-4 random digits.
   * The random source is injectable for deterministic tests.
   */
  static generate(random: () => number = Math.random): UserIdentifier {
    const word = IDENTIFIER_WORDS[Math.floor(random() * IDENTIFIER_WORDS.length)];
    const digitCount = random() < 0.5 ? 3 : 4;
    const max = digitCount === 3 ? 900 : 9000;
    const min = digitCount === 3 ? 100 : 1000;
    const digits = Math.floor(random() * max) + min;
    return UserIdentifier.create(`${word}#${Math.min(digits, min + max - 1)}`);
  }

  getValue(): string {
    return this.value;
  }

  toPrimitive(): string {
    return this.value;
  }

  equals(other: UserIdentifier): boolean {
    return this.value === other.value;
  }
}
