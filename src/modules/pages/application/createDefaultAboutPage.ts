import { randomUUID } from 'crypto';
import { Page } from '../domain/Page';
import { PageRepository } from '../domain/PageRepository';

const ABOUT_EN = {
  title: 'About this library',
  markdown: `This knowledge library runs on **Open Knowledge**, an open-source application under the MIT license that lets anyone create libraries of curated knowledge and share them openly with the Internet, as an open gift to everyone.

## Privacy

Open Knowledge stores no personal information about its visitors. Every course can be studied without registering; whoever decides to create an account gets only a pseudonymous identity — no name, no email, no personal data — whose sole purpose is to keep their learning progress.

## The manifesto

The Internet made it possible, for the first time, to distribute knowledge at a practically universal scale. Artificial intelligence now lets us structure, synthesize and translate vast amounts of knowledge with an ease that was unthinkable until recently.

That can be used to produce even more disposable, monetizable content. Open Knowledge explores the opposite direction: an open tool with which anyone can curate knowledge and give it away.

- Knowledge takes the center; the interface disappears around it.
- The learner is not a product: nobody needs to know who they are to help them learn.
- Open Knowledge seeks no monetary compensation of any kind. It is an offering.

Someone deploys Open Knowledge. Publishes knowledge. Someone else walks in. And learns.

---

Open Knowledge is envisioned by [Oriol Egea](https://github.com/oegea).`,
};

interface createDefaultAboutPageProps {
  pageRepository: PageRepository;
}

/**
 * Seeds the default "About" page when the instance is bootstrapped —
 * always in English; the administrator is free to translate, edit or
 * delete it afterwards.
 */
export async function createDefaultAboutPage({
  pageRepository,
}: createDefaultAboutPageProps): Promise<Page | null> {
  if ((await pageRepository.count()) > 0) return null;

  const page = Page.create(randomUUID(), ABOUT_EN.title, ABOUT_EN.markdown, 'footer', 0);
  return await pageRepository.save(page);
}
