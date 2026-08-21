import { PdfCourseExportRepository } from '../../infrastructure/PdfCourseExportRepository';
import * as CourseMother from '../../../course/test/helpers/CourseMother';
import * as SectionMother from '../../../course/test/helpers/SectionMother';
import * as MaterialMother from '../../../course/test/helpers/MaterialMother';
import * as ExportContextMother from '../helpers/ExportContextMother';
import * as MediaRepositoryMother from '../helpers/MediaRepositoryMother';

const RICH_MARKDOWN = [
  '# Título',
  '',
  'Un párrafo con **negrita**, *cursiva* y `código`.',
  '',
  '- Item con **negrita** en lista',
  '- Otro con [enlace](https://example.org)',
  '',
  '> Cita con **énfasis**',
  '',
  'Símbolos: A → B, hecho ✓, 10 €. Emoji fuera de fuente: 🚀.',
].join('\n');

function richCourse() {
  return CourseMother.create({
    published: true,
    sections: [
      SectionMother.createPrimitive({
        materials: [MaterialMother.createPrimitive({ markdown: RICH_MARKDOWN })],
      }),
    ],
  });
}

describe('PdfCourseExportRepository (integration)', () => {
  it('produces a PDF with the embedded font family for each style', async () => {
    const repository = new PdfCourseExportRepository(MediaRepositoryMother.create());
    const result = await repository.export(richCourse(), ExportContextMother.create());

    expect(result.mime).toBe('application/pdf');
    expect(result.extension).toBe('pdf');
    expect(result.data.subarray(0, 5).toString()).toBe('%PDF-');

    // Embedded, subset font names remain readable in the font descriptors:
    // one per style actually used by the markdown above.
    const raw = result.data.toString('latin1');
    expect(raw).toContain('DejaVuSans');
    expect(raw).toContain('DejaVuSans-Bold');
    expect(raw).toContain('DejaVuSans-Oblique');
    expect(raw).toContain('DejaVuSansMono');
    // The built-in WinAnsi fonts corrupt non-Latin-1 characters; they must
    // not be used for content anymore.
    expect(raw).not.toContain('/BaseFont /Helvetica');
  });

  it('renders cover and logo images when the media exists', async () => {
    const mediaRepository = MediaRepositoryMother.withImages();
    const repository = new PdfCourseExportRepository(mediaRepository);
    const context = ExportContextMother.create({
      coverMediaPath: 'covers/astronomy.png',
      logoMediaPath: 'images/logo.png',
    });

    const result = await repository.export(richCourse(), context);

    expect(mediaRepository.retrieve).toHaveBeenCalledWith('covers/astronomy.png');
    expect(mediaRepository.retrieve).toHaveBeenCalledWith('images/logo.png');
    expect(result.data.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('survives markdown with emojis, tables and task lists', async () => {
    const markdown = [
      'Emoji compuesto: 👍🏽 y bandera 🇪🇸.',
      '',
      '| Col A | Col B |',
      '| ----- | ----- |',
      '| a **x** | b |',
      '',
      '- [x] hecho',
      '- [ ] pendiente',
    ].join('\n');
    const course = CourseMother.create({
      published: true,
      sections: [
        SectionMother.createPrimitive({
          materials: [MaterialMother.createPrimitive({ markdown })],
        }),
      ],
    });

    const repository = new PdfCourseExportRepository(MediaRepositoryMother.create());
    const result = await repository.export(course, ExportContextMother.create());
    expect(result.data.subarray(0, 5).toString()).toBe('%PDF-');
  });

  describe('interleaved note-taking pages', () => {
    // Pages are counted through the PDF page-tree objects: content is
    // encoded with subset glyph ids, so raw text assertions cannot see it.
    const pageCount = (data: Buffer) =>
      (data.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;

    const mixedCourse = () =>
      CourseMother.create({
        published: true,
        sections: [
          SectionMother.createPrimitive({
            materials: [
              // Text lesson → notes page.
              MaterialMother.createPrimitive({ id: 'm1', markdown: 'Una lección de texto.' }),
              // Audio WITH written notes → notes page.
              MaterialMother.createPrimitive({
                id: 'm2',
                type: 'audio',
                mediaPath: 'media/a.mp3',
                markdown: 'Notas del audio.',
              }),
              // Audio WITHOUT notes → no notes page.
              MaterialMother.createPrimitive({
                id: 'm3',
                type: 'audio',
                mediaPath: 'media/b.mp3',
                markdown: '',
              }),
              // Exam → never a notes page.
              MaterialMother.createPrimitive({
                id: 'm4',
                type: 'exam',
                markdown: '',
                exam: {
                  passingScore: 0.5,
                  questionsPerAttempt: 1,
                  questions: [
                    {
                      id: 'q1',
                      text: '2+2?',
                      choices: [
                        { id: 'a', text: '4' },
                        { id: 'b', text: '5' },
                      ],
                      correctChoiceId: 'a',
                      explanation: 'Because arithmetic.',
                    },
                  ],
                },
              }),
            ],
          }),
        ],
      });

    it('adds one page after each text-bearing material, and none after exams or bare media', async () => {
      const plain = await new PdfCourseExportRepository(MediaRepositoryMother.create()).export(
        mixedCourse(),
        ExportContextMother.create()
      );
      const withNotes = await new PdfCourseExportRepository(MediaRepositoryMother.create()).export(
        mixedCourse(),
        ExportContextMother.create({ notesPages: true })
      );

      // Eligible: m1 (markdown) and m2 (audio with notes) → exactly 2 extra pages.
      expect(pageCount(withNotes.data)).toBe(pageCount(plain.data) + 2);
    });

    it('adds no pages when the option is off', async () => {
      const first = await new PdfCourseExportRepository(MediaRepositoryMother.create()).export(
        mixedCourse(),
        ExportContextMother.create()
      );
      const second = await new PdfCourseExportRepository(MediaRepositoryMother.create()).export(
        mixedCourse(),
        ExportContextMother.create({ notesPages: false })
      );
      expect(pageCount(second.data)).toBe(pageCount(first.data));
    });
  });
});
