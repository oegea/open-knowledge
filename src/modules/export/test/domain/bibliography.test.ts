import { collectBibliography } from '../../domain/bibliography';
import * as CourseMother from '../../../course/test/helpers/CourseMother';
import * as SectionMother from '../../../course/test/helpers/SectionMother';
import * as MaterialMother from '../../../course/test/helpers/MaterialMother';

describe('collectBibliography (unit)', () => {
  it('lists course sources first, then material sources in reading order', () => {
    const course = CourseMother.create({
      sources: [{ title: 'NASA public archives', url: null }],
      sections: [
        SectionMother.createPrimitive({
          materials: [
            MaterialMother.createPrimitive({
              sources: [{ title: 'ESA image gallery', url: 'https://esa.int/images' }],
            }),
          ],
        }),
      ],
    });

    expect(collectBibliography(course)).toEqual([
      { title: 'NASA public archives', url: null },
      { title: 'ESA image gallery', url: 'https://esa.int/images' },
    ]);
  });

  it('deduplicates sources shared between course and materials', () => {
    const shared = { title: 'NASA public archives', url: null };
    const course = CourseMother.create({
      sources: [shared],
      sections: [
        SectionMother.createPrimitive({
          materials: [MaterialMother.createPrimitive({ sources: [shared] })],
        }),
      ],
    });

    expect(collectBibliography(course)).toEqual([shared]);
  });

  it('returns an empty list when nothing is attributed', () => {
    const course = CourseMother.create({
      sources: [],
      sections: [SectionMother.createPrimitive({ materials: [MaterialMother.createPrimitive()] })],
    });

    expect(collectBibliography(course)).toEqual([]);
  });
});
