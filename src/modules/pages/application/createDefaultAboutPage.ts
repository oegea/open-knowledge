import { randomUUID } from 'crypto';
import { Page } from '../domain/Page';
import { PageRepository } from '../domain/PageRepository';

const ABOUT_ES = {
  title: 'Acerca de esta librería',
  markdown: `Esta librería de conocimiento funciona con **Open Knowledge**, una aplicación de código abierto bajo licencia MIT que permite a cualquier persona crear librerías de conocimiento curado y compartirlas abiertamente con Internet, como un regalo abierto a todas las personas.

## Privacidad

Open Knowledge no almacena información personal de sus visitantes. Cualquier curso puede estudiarse sin registro; quien decide crear una cuenta obtiene únicamente una identidad pseudónima —sin nombre, sin correo electrónico, sin datos personales— cuyo único propósito es conservar su progreso de aprendizaje.

## El manifiesto

Internet permitió por primera vez distribuir conocimiento a escala prácticamente universal. La inteligencia artificial nos permite ahora estructurar, sintetizar y traducir enormes cantidades de conocimiento con una facilidad que hasta hace poco era impensable.

Eso puede usarse para generar todavía más contenido desechable y monetizable. Open Knowledge explora la dirección contraria: que exista una herramienta abierta con la que cualquier persona pueda curar conocimiento y regalarlo.

- El conocimiento ocupa el centro; la interfaz desaparece a su alrededor.
- El estudiante no es un producto: no hace falta saber quién es para ayudarle a aprender.
- Open Knowledge no busca compensación económica de ningún tipo. Es un ofrecimiento.

Alguien despliega Open Knowledge. Publica conocimiento. Otra persona entra. Y aprende.

---

Open Knowledge está ideado por [Oriol Egea](https://github.com/oegea).`,
};

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
  locale: string;
  pageRepository: PageRepository;
}

/**
 * Seeds the default "About" page when the instance is bootstrapped. The
 * administrator is free to edit or delete it afterwards.
 */
export async function createDefaultAboutPage({
  locale,
  pageRepository,
}: createDefaultAboutPageProps): Promise<Page | null> {
  if ((await pageRepository.count()) > 0) return null;

  const template = locale === 'es' ? ABOUT_ES : ABOUT_EN;
  const page = Page.create(randomUUID(), template.title, template.markdown, 'footer', 0);
  return await pageRepository.save(page);
}
