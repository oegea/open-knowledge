export interface ExamChoicePrimitive {
  id: string;
  text: string;
}

export interface ExamQuestionPrimitive {
  id: string;
  text: string;
  choices: ExamChoicePrimitive[];
  correctChoiceId: string;
  explanation: string;
}

export class ExamQuestion {
  private constructor(
    private readonly id: string,
    private readonly text: string,
    private readonly choices: ExamChoicePrimitive[],
    private readonly correctChoiceId: string,
    private readonly explanation: string
  ) {}

  static create(
    id: string,
    text: string,
    choices: ExamChoicePrimitive[],
    correctChoiceId: string,
    explanation: string
  ): ExamQuestion {
    ExamQuestion.ensureQuestionIsValid(id, text, choices, correctChoiceId);
    return new ExamQuestion(id, text.trim(), choices, correctChoiceId, explanation ?? '');
  }

  static fromPrimitive(data: ExamQuestionPrimitive): ExamQuestion {
    if (!data) throw new Error('[ExamQuestion] data must be provided');
    return ExamQuestion.create(data.id, data.text, data.choices, data.correctChoiceId, data.explanation);
  }

  static ensureQuestionIsValid(
    id: string,
    text: string,
    choices: ExamChoicePrimitive[],
    correctChoiceId: string
  ): void {
    if (!id || typeof id !== 'string') {
      throw new Error('[ExamQuestion] id must be a non-empty string');
    }
    if (typeof text !== 'string' || text.trim() === '') {
      throw new Error('[ExamQuestion] text cannot be empty');
    }
    if (!Array.isArray(choices) || choices.length < 2) {
      throw new Error('[ExamQuestion] a question needs at least 2 choices');
    }
    const choiceIds = choices.map((choice) => choice.id);
    if (new Set(choiceIds).size !== choiceIds.length) {
      throw new Error('[ExamQuestion] choice ids must be unique');
    }
    if (choices.some((choice) => typeof choice.text !== 'string' || choice.text.trim() === '')) {
      throw new Error('[ExamQuestion] choices cannot have empty text');
    }
    if (!choiceIds.includes(correctChoiceId)) {
      throw new Error('[ExamQuestion] correctChoiceId must reference an existing choice');
    }
  }

  getId(): string {
    return this.id;
  }

  getText(): string {
    return this.text;
  }

  getChoices(): ExamChoicePrimitive[] {
    return this.choices.map((choice) => ({ ...choice }));
  }

  getCorrectChoiceId(): string {
    return this.correctChoiceId;
  }

  getExplanation(): string {
    return this.explanation;
  }

  isCorrectChoice(choiceId: string): boolean {
    return this.correctChoiceId === choiceId;
  }

  toPrimitive(): ExamQuestionPrimitive {
    return {
      id: this.id,
      text: this.text,
      choices: this.getChoices(),
      correctChoiceId: this.correctChoiceId,
      explanation: this.explanation,
    };
  }

  equals(other: ExamQuestion): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }
}
