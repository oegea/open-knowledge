'use client';

import { useMemo, useState } from 'react';
import { ExamPrimitive } from '@/modules/course/domain/Exam';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './ExamPlayer.module.css';

interface ExamPlayerProps {
  exam: ExamPrimitive;
  onPassed: () => Promise<void> | void;
  /** Called once with all answers when the attempt finishes (pass or fail). */
  onFinished?: (answers: Record<string, string>, passed: boolean) => Promise<void> | void;
}

/**
 * One question at a time: answer, check, read the explanation, move on.
 * At the end, score against the passing threshold.
 */
export function ExamPlayer({ exam, onPassed, onFinished }: ExamPlayerProps) {
  const { t } = useI18n();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [passedNotified, setPassedNotified] = useState(false);

  const question = exam.questions[questionIndex];
  const total = exam.questions.length;
  const passed = useMemo(
    () => finished && correctCount / total >= exam.passingScore,
    [finished, correctCount, total, exam.passingScore]
  );

  const handleCheck = () => {
    if (!selectedChoiceId) return;
    setChecked(true);
    setAnswers((current) => ({ ...current, [question.id]: selectedChoiceId }));
    if (selectedChoiceId === question.correctChoiceId) {
      setCorrectCount((count) => count + 1);
    }
  };

  const handleNext = async () => {
    if (questionIndex + 1 < total) {
      setQuestionIndex(questionIndex + 1);
      setSelectedChoiceId(null);
      setChecked(false);
    } else {
      setFinished(true);
      const didPass = correctCount / total >= exam.passingScore;
      await onFinished?.(answers, didPass);
      if (didPass && !passedNotified) {
        setPassedNotified(true);
        await onPassed();
      }
    }
  };

  const handleRetry = () => {
    setQuestionIndex(0);
    setSelectedChoiceId(null);
    setChecked(false);
    setCorrectCount(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className={`ok-glass ${styles.results}`}>
        <p className={styles.resultsTitle}>{t('exam.results')}</p>
        <p className={passed ? styles.resultPassed : styles.resultFailed}>
          {t(passed ? 'exam.passed' : 'exam.failed')}
        </p>
        <p className={styles.score}>
          {t('exam.scoreLabel')}: {correctCount} / {total}
        </p>
        {!passed ? (
          <button className={styles.primaryButton} onClick={handleRetry}>
            {t('exam.retry')}
          </button>
        ) : null}
      </div>
    );
  }

  const isCorrect = checked && selectedChoiceId === question.correctChoiceId;

  return (
    <div className={`ok-glass ${styles.exam}`}>
      <p className={styles.counter}>
        {questionIndex + 1} / {total}
      </p>
      <p className={styles.questionText}>{question.text}</p>

      <ul className={styles.choices} role="radiogroup" aria-label={question.text}>
        {question.choices.map((choice) => {
          const isSelected = selectedChoiceId === choice.id;
          const showCorrect = checked && choice.id === question.correctChoiceId;
          const showIncorrect = checked && isSelected && choice.id !== question.correctChoiceId;
          const choiceClass = [
            styles.choice,
            showCorrect ? styles.choiceCorrect : '',
            showIncorrect ? styles.choiceIncorrect : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li key={choice.id}>
              <button
                role="radio"
                aria-checked={isSelected}
                className={choiceClass}
                disabled={checked}
                onClick={() => setSelectedChoiceId(choice.id)}
              >
                <span className={styles.choiceMark} aria-hidden="true">
                  {showCorrect ? '✓' : showIncorrect ? '✗' : ''}
                </span>
                {choice.text}
              </button>
            </li>
          );
        })}
      </ul>

      {checked ? (
        <div
          className={isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}
          role="status"
        >
          <p className={styles.feedbackTitle}>
            {t(isCorrect ? 'exam.correctFeedback' : 'exam.incorrectFeedback')}
          </p>
          {question.explanation ? (
            <p className={styles.explanation}>{question.explanation}</p>
          ) : null}
        </div>
      ) : null}

      <div className={styles.actions}>
        {checked ? (
          <button className={styles.primaryButton} onClick={handleNext}>
            {questionIndex + 1 < total ? t('study.next') : t('exam.results')}
          </button>
        ) : (
          <button
            className={styles.primaryButton}
            disabled={!selectedChoiceId}
            onClick={handleCheck}
          >
            {t('exam.check')}
          </button>
        )}
      </div>
    </div>
  );
}
