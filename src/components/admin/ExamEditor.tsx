'use client';

import { ExamPrimitive } from '@/modules/course/domain/Exam';
import { ExamQuestionPrimitive } from '@/modules/course/domain/ExamQuestion';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import styles from './ExamEditor.module.css';

interface ExamEditorProps {
  exam: ExamPrimitive;
  onChange: (exam: ExamPrimitive) => void;
}

function nextId(prefix: string, existing: { id: string }[]): string {
  let index = existing.length + 1;
  const ids = new Set(existing.map((item) => item.id));
  while (ids.has(`${prefix}${index}`)) index += 1;
  return `${prefix}${index}`;
}

export function ExamEditor({ exam, onChange }: ExamEditorProps) {
  const { t } = useI18n();

  const updateQuestion = (questionId: string, patch: Partial<ExamQuestionPrimitive>) => {
    onChange({
      ...exam,
      questions: exam.questions.map((question) =>
        question.id === questionId ? { ...question, ...patch } : question
      ),
    });
  };

  const addQuestion = () => {
    const id = nextId('q', exam.questions);
    onChange({
      ...exam,
      questions: [
        ...exam.questions,
        {
          id,
          text: '',
          choices: [
            { id: 'a', text: '' },
            { id: 'b', text: '' },
          ],
          correctChoiceId: 'a',
          explanation: '',
        },
      ],
    });
  };

  const removeQuestion = (questionId: string) => {
    onChange({
      ...exam,
      questions: exam.questions.filter((question) => question.id !== questionId),
    });
  };

  const addChoice = (question: ExamQuestionPrimitive) => {
    const used = new Set(question.choices.map((choice) => choice.id));
    let code = 97; // 'a'
    while (used.has(String.fromCharCode(code))) code += 1;
    updateQuestion(question.id, {
      choices: [...question.choices, { id: String.fromCharCode(code), text: '' }],
    });
  };

  const removeChoice = (question: ExamQuestionPrimitive, choiceId: string) => {
    const choices = question.choices.filter((choice) => choice.id !== choiceId);
    updateQuestion(question.id, {
      choices,
      correctChoiceId:
        question.correctChoiceId === choiceId && choices.length > 0
          ? choices[0].id
          : question.correctChoiceId,
    });
  };

  return (
    <div className={styles.examEditor}>
      {exam.questions.map((question, questionIndex) => (
        <fieldset key={question.id} className={styles.question}>
          <legend className={styles.legend}>
            {t('exam.question')} {questionIndex + 1}
          </legend>

          <textarea
            className={styles.questionText}
            aria-label={`${t('exam.question')} ${questionIndex + 1}`}
            value={question.text}
            rows={2}
            onChange={(event) => updateQuestion(question.id, { text: event.target.value })}
          />

          <span className={styles.choicesLabel}>{t('exam.choices')}</span>
          <ul className={styles.choices}>
            {question.choices.map((choice) => (
              <li key={choice.id} className={styles.choice}>
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  aria-label={t('exam.correct')}
                  checked={question.correctChoiceId === choice.id}
                  onChange={() => updateQuestion(question.id, { correctChoiceId: choice.id })}
                  className={styles.radio}
                />
                <input
                  className={styles.choiceText}
                  value={choice.text}
                  aria-label={`${t('exam.choices')} ${choice.id.toUpperCase()}`}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      choices: question.choices.map((candidate) =>
                        candidate.id === choice.id
                          ? { ...candidate, text: event.target.value }
                          : candidate
                      ),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={question.choices.length <= 2}
                  onClick={() => removeChoice(question, choice.id)}
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="ghost" size="sm" onClick={() => addChoice(question)}>
            + {t('exam.addChoice')}
          </Button>

          <label className={styles.explanationLabel}>
            {t('exam.explanation')}
            <textarea
              className={styles.explanation}
              value={question.explanation}
              rows={2}
              onChange={(event) =>
                updateQuestion(question.id, { explanation: event.target.value })
              }
            />
          </label>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => removeQuestion(question.id)}
          >
            {t('common.delete')}
          </Button>
        </fieldset>
      ))}

      <div className={styles.footer}>
        <Button type="button" variant="soft" size="sm" onClick={addQuestion}>
          + {t('exam.addQuestion')}
        </Button>

        <label className={styles.passingScoreLabel}>
          {t('exam.passingScore')}
          <input
            type="number"
            min={0}
            max={100}
            className={styles.passingScore}
            value={Math.round(exam.passingScore * 100)}
            onChange={(event) =>
              onChange({ ...exam, passingScore: Number(event.target.value) / 100 })
            }
          />
        </label>
      </div>
    </div>
  );
}
