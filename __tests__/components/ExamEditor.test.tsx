import '@testing-library/jest-dom';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExamEditor } from '../../src/components/admin/ExamEditor';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { ExamPrimitive } from '../../src/modules/course/domain/Exam';
import en from '../../src/i18n/dictionaries/en.json';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() })),
}));

function Harness({ initial }: { initial: ExamPrimitive }) {
  const [exam, setExam] = useState<ExamPrimitive>(initial);
  return (
    <I18nProvider locale="en" dictionary={en}>
      <ExamEditor exam={exam} onChange={setExam} />
    </I18nProvider>
  );
}

const EMPTY_EXAM: ExamPrimitive = { questions: [], passingScore: 0.7 };

describe('ExamEditor', () => {
  describe('Question management', () => {
    it('adds a question with two choices when requested', () => {
      render(<Harness initial={EMPTY_EXAM} />);

      fireEvent.click(screen.getByRole('button', { name: /add question/i }));

      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(2);
    });

    it('lets the admin write the question and mark the correct choice', () => {
      render(<Harness initial={EMPTY_EXAM} />);
      fireEvent.click(screen.getByRole('button', { name: /add question/i }));

      const questionInput = screen.getByRole('textbox', { name: /question 1/i });
      fireEvent.change(questionInput, { target: { value: 'What is 2+2?' } });
      expect(questionInput).toHaveValue('What is 2+2?');

      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toBeChecked();
      fireEvent.click(radios[1]);
      expect(radios[1]).toBeChecked();
      expect(radios[0]).not.toBeChecked();
    });

    it('adds extra choices', () => {
      render(<Harness initial={EMPTY_EXAM} />);
      fireEvent.click(screen.getByRole('button', { name: /add question/i }));

      fireEvent.click(screen.getByRole('button', { name: /add choice/i }));

      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('does not allow fewer than two choices', () => {
      render(<Harness initial={EMPTY_EXAM} />);
      fireEvent.click(screen.getByRole('button', { name: /add question/i }));

      const removeButtons = screen.getAllByRole('button', { name: '×' });
      expect(removeButtons[0]).toBeDisabled();
    });
  });

  describe('Passing score', () => {
    it('shows and updates the passing score as a percentage', () => {
      render(<Harness initial={EMPTY_EXAM} />);

      const input = screen.getByRole('spinbutton', { name: /passing score/i });
      expect(input).toHaveValue(70);

      fireEvent.change(input, { target: { value: '85' } });
      expect(input).toHaveValue(85);
    });
  });
});
