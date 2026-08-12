import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoryEditor } from '../../src/components/admin/CategoryEditor';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import en from '../../src/i18n/dictionaries/en.json';

const push = jest.fn();
const refresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push, refresh })),
}));

jest.mock('../../src/modules/course/infrastructure/HttpCourseAdminRepository', () => ({
  HttpCourseAdminRepository: jest.fn().mockImplementation(() => ({
    uploadMedia: jest.fn().mockResolvedValue('/api/media/images/test.jpg'),
  })),
}));

function renderEditor(initial?: {
  id: string | null;
  name: string;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  return render(
    <I18nProvider locale="en" dictionary={en}>
      <CategoryEditor initial={initial} />
    </I18nProvider>
  );
}

describe('CategoryEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (global as { fetch?: unknown }).fetch;
  });

  it('creates a category with the entered name', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ category: { id: 'c1' } }),
    }) as never;

    renderEditor();

    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: 'Science' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/categories'));
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/categories',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Science', imagePath: null }),
      })
    );
  });

  it('updates an existing category via PUT', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ category: { id: 'c1' } }),
    }) as never;

    renderEditor({
      id: 'c1',
      name: 'Science',
      imagePath: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: 'Nature' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/categories/c1',
        expect.objectContaining({ method: 'PUT' })
      )
    );
  });

  it('shows the server error when saving fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: '[createCategory] a category named "Science" already exists' }),
    }) as never;

    renderEditor();

    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: 'Science' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '[createCategory] a category named "Science" already exists'
    );
    expect(push).not.toHaveBeenCalled();
  });
});
