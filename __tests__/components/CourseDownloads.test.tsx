import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { CourseDownloads } from '../../src/components/public/CourseDownloads';

const LABELS = {
  epub: 'EPUB',
  pdf: 'PDF',
  pdfNotesTitle: 'Download as PDF',
  pdfNotesQuestion: 'Would you like a note-taking page after each material?',
  pdfNotesAccept: 'Yes, with note pages',
  pdfNotesDecline: 'No, content only',
  close: 'Cancel',
};

function renderMenu() {
  return render(
    <CourseDownloads
      label="Download"
      epubHref="/api/courses/c1/export/epub"
      pdfHref="/api/courses/c1/export/pdf"
      labels={LABELS}
    />
  );
}

describe('CourseDownloads', () => {
  it('downloads EPUB directly, without any dialog', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    const epub = screen.getByRole('menuitem', { name: 'EPUB' });
    expect(epub).toHaveAttribute('href', '/api/courses/c1/export/epub');
    expect(epub).toHaveAttribute('download');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks about note pages before downloading the PDF, offering both variants', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'PDF' }));

    const dialog = screen.getByRole('dialog', { name: LABELS.pdfNotesTitle });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(LABELS.pdfNotesQuestion)).toBeInTheDocument();

    const withNotes = screen.getByRole('link', { name: LABELS.pdfNotesAccept });
    expect(withNotes).toHaveAttribute('href', '/api/courses/c1/export/pdf?notes=1');
    expect(withNotes).toHaveAttribute('download');

    const withoutNotes = screen.getByRole('link', { name: LABELS.pdfNotesDecline });
    expect(withoutNotes).toHaveAttribute('href', '/api/courses/c1/export/pdf');
    expect(withoutNotes).toHaveAttribute('download');
  });

  it('closes the dialog with the close button and with Escape', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'PDF' }));
    fireEvent.click(screen.getByRole('button', { name: LABELS.close }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'PDF' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the dialog after choosing a variant', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'PDF' }));
    fireEvent.click(screen.getByRole('link', { name: LABELS.pdfNotesAccept }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
