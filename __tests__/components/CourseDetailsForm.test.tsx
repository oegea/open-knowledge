import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CourseDetailsForm } from '../../src/components/admin/CourseDetailsForm';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import en from '../../src/i18n/dictionaries/en.json';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() })),
}));

jest.mock('../../src/modules/course/infrastructure/HttpCourseAdminRepository', () => ({
  HttpCourseAdminRepository: jest.fn().mockImplementation(() => ({
    uploadMedia: jest.fn().mockResolvedValue('/api/media/covers/test.jpg'),
  })),
}));

function renderForm(onSubmit: (details: unknown) => Promise<void>) {
  return render(
    <I18nProvider locale="en" dictionary={en}>
      <CourseDetailsForm submitLabel="Save" onSubmit={onSubmit as never} />
    </I18nProvider>
  );
}

describe('CourseDetailsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Creating a course', () => {
    it('submits the details entered by the admin', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderForm(onSubmit);

      fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
        target: { value: 'Introduction to Astronomy' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
        target: { value: 'A journey through the night sky.' },
      });
      fireEvent.change(screen.getByRole('combobox', { name: /course language/i }), {
        target: { value: 'es' },
      });
      fireEvent.click(screen.getByRole('checkbox', { name: /ai assistance/i }));

      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Introduction to Astronomy',
          description: 'A journey through the night sky.',
          language: 'es',
          aiAssisted: true,
        })
      );
    });

    it('shows the error when submitting fails', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('[CourseTitle] title cannot be empty'));
      renderForm(onSubmit);

      fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
        target: { value: 'x' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
        target: { value: 'y' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        '[CourseTitle] title cannot be empty'
      );
    });

    it('parses authors as one per line', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderForm(onSubmit);

      fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
        target: { value: 'T' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
        target: { value: 'D' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /authors/i }), {
        target: { value: 'Ada\nGrace\n' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ authors: ['Ada', 'Grace'] })
      );
    });
  });
});
