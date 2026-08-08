# Version Control

Inicializa un git local en este directorio. Ves haciendo commit de todos los cambios que hagas en main.

# Sobre la entrega de soluciones finalizadas y la validación empírica

Cuando vayas a realizar un cambio en este proyecto, debes validar empíricamente tus propuestas.
Esto significa, que no puedes limitarte a ofrecer una solución y pedirme que sea yo quien la valide, sino que debes validar tú mismo su funcionamiento end2end, a través de la realización de tests unitarios, de integración, y end2end.

Asimismo, no solo debes validar con esos tests, sino que además debes levantar servicios y frontend para validar que efectivamente tu hipótesis y cambios son válidos.

En el caso de cambios sobre frontend e interfaz y UX, debes levantar el propio frontend en diferentes resoluciones para validar su usabilidad y que es acorde a los requisitos planteados.

Solo entonces puedes dar por válido un entregable, toda vez que tú mismo lo has probado rigurosamente de extremo a extremo.

# Sobre la UI-UX, dispositivos móviles y pantallas de tamaño reducido

El proyecto que vamos a realizar debe priorizar su usabilidad en dispositivos móviles y tablets.

Si bien debe ser usable en dispositivos PC estándar, una regla incuestionable y prioritaria es que al abrir la app desde un dispositivo smartphone y/o una tablet cuyas pantallas no tienen el mismo espacio disponible que un ordenador estándar, la aplicación no solo se vea correctamente sin artefactos o elementos fuera de lugar, sino que debe estar altamente optimizada en lo que a UX se refiere, animaciones, usabilidad táctil, etcétera.

La usabilidad de esta aplicación es prioritaria en lo que refiere a dispositivos móviles por encima de todo.

# Sobre decisiones de diseño del software

Todas las decisiones de software que sean necesarias, relevantes y persistentes, las documentarás en docs/adr, también las que puedas inferir de este documento de inicio.

Este se trata de un proyecto auto-contenido, así que como tal no puede referenciar a otros ficheros que se encuentren fuera de este mismo repositorio.

Es posible que en algunos ADRs te diga "debes inspirarte en este" y te referencie a un repositorio externo. En cualquier caso, aún en ese supuesto, no debes referenciar a él en el documento de ADRs. Es muy importante, que este repositorio per se sea auto-contenido.

# Clean Architecture, DDD y Testing

En lo que refiere a Clean Architecture con DDD y testeo automatizado utilizrás los agreements de ../tech-agreements-and-guidelines, el de Clean Architecture y todo los referente a testing code. Todos los demás los ignorarás, solo leéte los de clean architecture y testing, y recógelos como ADRs. Importante, leéte también los ejemplos de código relacionados con esos agreements, dado que quiero que utilices exactamente los mismos.

# Multi-idioma

La interfaz debe estar traducida a español, inglés, francés, alemán, italiano, chino simplificado (no recuerdo cual es el chino estándar que se usa en el mundo del software), ruso, ucraniano, catalán, gallego, euskera. No sé si me dejo alguno más que sea útil. La idea es que open knowledge pueda verdaderamente ser utilizado bajo cualquier idioma.

Los cursos además tendrán definido en qué idioma están realizados, y al navegar por la librería de cursos podremos filtrar por idioma.

No banderitas en los idiomas. Los idiomas no siempre pertenecen a un país, así que pon el nombre del idioma y si quieres de forma hiper visual y bonita la ISO de 2-3 letras del idioma, pero sin banderas de países.

# Diseño coherente

Piensa en colores a utilizar, lineas de diseño, tokens CSS, etc. De forma que crees una imagen de marca propia para Open Knowledge. No improvises el diseño, ni lo hagas calcado a otros proyectos que usan el diseño by default de claude.

Crea marca propia. Inspírate en liquid glass de apple.

# El proyecto: Open Knowledge

## Qué es

Internet ha supuesto un antes y un después en lo que se refiere a formación y conocimiento.

Hoy en día, gracias a la IA, podemos destilar más rápido que nunca conocimiento abierto sobre innumerable cantidad de temas y generar contenido curado en forma de cursos que permita aterrizar, estructurar y aprender un tema concreto de forma intuitiva.

Open Knowledge nace para permitir esto.

Open Knowledge es una aplicación autoalojable que permite a cualquier persona desplegar su propia librería abierta de conocimiento, publicar cursos y ofrecerlos abiertamente a cualquier persona que quiera aprender.

La idea es deliberadamente sencilla.

Una persona despliega Open Knowledge, cura y publica conocimiento en forma de cursos, y cualquier persona puede acceder a esa instancia desde Internet para estudiarlos.

No queremos construir una red social, una plataforma comunitaria, una herramienta de gobernanza ni un LMS empresarial. Queremos construir una herramienta excelente para publicar y consumir conocimiento abierto.

Open Knowledge debe partir de una filosofía clara: en un mundo donde la IA nos permite destilar conocimiento con una facilidad y a una escala que antes eran impensables, debe existir una herramienta abierta con la que cualquier persona pueda organizar ese conocimiento, publicarlo y ofrecerlo a los demás.

No como una nueva oportunidad para convertir el conocimiento en otro negocio, sino como un ofrecimiento.

## Cómo funciona

Cada instalación de Open Knowledge representa una librería independiente.

El administrador de esa instancia puede crear, editar y publicar cursos.

Cualquier persona que acceda a la librería puede navegar su catálogo, explorar categorías, entrar en cualquier curso y consumir sus materiales sin necesidad de registrarse.

El registro no debe convertirse nunca en una barrera de acceso al conocimiento.

Sin registrarnos podremos navegar y realizar los cursos completos. Será conceptualmente similar al modo auditar de Coursera.

La diferencia es que, si no estamos registrados, la plataforma no podrá mantener nuestro progreso de forma persistente entre dispositivos o sesiones ni asociar a una identidad nuestros resultados en exámenes y certificados.

Registrarse existe únicamente para ofrecer estas funcionalidades:

* Guardar el progreso de los cursos.
* Recordar qué materiales hemos completado y dónde debemos continuar.
* Realizar y conservar los resultados de los exámenes.
* Obtener certificados de finalización de los cursos.
* Acceder a aquellas funcionalidades personales estrictamente relacionadas con nuestro aprendizaje.

Los usuarios no tienen perfiles sociales, no publican contenido, no siguen a otras personas, no tienen biografías, no comentan cursos ni existe ningún sistema social alrededor de ellos.

El conocimiento es el centro de la aplicación, no los usuarios.

## El administrador

Cuando accedemos a una instalación nueva de Open Knowledge por primera vez, el primer usuario que se registra desde la interfaz debe quedar marcado como administrador del sistema.

El administrador tendrá acceso a un panel administrativo desde donde podrá gestionar la instancia.

El administrador es el único responsable de curar y publicar el contenido de esa librería.

Desde el panel deberá poder gestionar, como mínimo:

* Los cursos.
* Las secciones y materiales que forman cada curso.
* La publicación o despublicación de contenido.
* La configuración general de la librería.
* La configuración del registro de usuarios.
* El blog/noticias de la librería, si decide habilitarlo.

No necesitamos sistemas de grupos, contribuidores, votaciones, roles complejos ni workflows de aprobación.

Open Knowledge debe asumir deliberadamente un modelo sencillo: existe una persona administradora que mantiene la librería.

Si algún día existe una necesidad real de colaboración entre múltiples personas podrá estudiarse entonces, pero no debe diseñarse ni implementarse preventivamente.

Muy importante: simplificar el modelo funcional no significa descuidar el panel de administración. Su UI-UX debe estar muy cuidada, ser agradable de utilizar y facilitar enormemente la creación y mantenimiento de los cursos.

## Registrándonos en la plataforma

El registro debe seguir una filosofía de privacidad por diseño.

Open Knowledge no necesita saber quién eres para ayudarte a aprender.

En la página de registro se proporcionará automáticamente al usuario un identificador formado por una palabra aleatoria seguida de tres o cuatro números aleatorios.

Por ejemplo:

`Erudito#345`

o:

`Erudito#4821`

Si no nos gusta el identificador autoasignado, tendremos un icono de refrescar que generará otro.

No se solicitará nombre, email, teléfono ni ningún otro dato personal de forma predeterminada.

Además aparecerá un código QR compatible con aplicaciones Authenticator.

La persona deberá:

1. Escanear el QR con su aplicación Authenticator.
2. Introducir en Open Knowledge el código TOTP actual.
3. Confirmar el formulario.

Solo entonces se creará la identidad.

Debe proporcionarse también algún mecanismo adecuado de recuperación que no requiera recopilar información personal del usuario, por ejemplo un código de recuperación que deba guardar.

La intención es que una cuenta de Open Knowledge represente simplemente una identidad pseudónima que permita conservar el estado de aprendizaje.

El administrador de la instancia podrá decidir cerrar completamente el registro.

De esta forma una instalación puede funcionar simplemente como una librería pública de conocimiento sin ofrecer cuentas.

También podrá aplicar mecanismos de rate limiting al registro.

El objetivo es recopilar la mínima información posible.

Los datos almacenados sobre un usuario deben limitarse esencialmente a aquello necesario para proporcionar la funcionalidad:

* Su identidad pseudónima.
* Sus credenciales de autenticación.
* Su progreso.
* Sus resultados de exámenes.
* Sus certificados.

No debemos inventar campos de perfil o recopilar información adicional simplemente porque sea habitual hacerlo en otras aplicaciones.

## Notificaciones

Los usuarios registrados tendrán un apartado de notificaciones accesible desde el header.

El sistema de notificaciones debe mantenerse sencillo y relacionado únicamente con la experiencia de aprendizaje y con novedades relevantes de la propia librería.

Por ejemplo, puede utilizarse para comunicar:

* Publicación de nuevos cursos.
* Actualizaciones relevantes de cursos.
* Noticias publicadas por el administrador.
* Información relacionada con cursos en los que el usuario está inscrito.
* Eventos relacionados con la finalización de un curso o sus certificados cuando tenga sentido.

No debe evolucionar hacia un sistema social ni de mensajería.

## Cosas que ha de tener un curso

Un curso debe tener como mínimo:

* Título.
* Descripción.
* Imagen de portada.

Además debe poder incluir la metadata necesaria para describir correctamente el conocimiento publicado, incluyendo cuando corresponda autoría, fuentes y cualquier otra información necesaria para atribuir adecuadamente el material utilizado.

Los cursos estarán divididos en temas o secciones.

Dentro de cada tema habrá diferentes materiales o recursos.

Un tema representa una división lógica de aquello que queremos aprender.

Un recurso representa el contenido concreto que debemos consumir.

Los materiales se accederán siguiendo un orden definido.

Se presupone que existe un orden pedagógico adecuado desde el primer material hasta el último y que recorrerlo de esta forma permite interiorizar mejor el conocimiento.

Cada material puede ser:

* Texto Markdown.
* Audio.
* Vídeo.
* Examen.

La arquitectura y el modelo deben hacer especialmente fácil introducir contenido generado o curado mediante IA.

El formato de los cursos y de sus materiales debe ser sencillo, abierto y fácilmente manejable, evitando que publicar conocimiento dependa de formatos propietarios innecesarios.

### Uso de inteligencia artificial

Un curso tendrá un indicador que permita especificar si se ha utilizado inteligencia artificial en la elaboración de sus materiales.

En caso afirmativo, al empezar el curso se mostrará claramente un aviso indicando que el curso incluye contenido generado o asistido mediante IA.

No queremos esconder el uso de IA.

Al mismo tiempo, Open Knowledge debe ser especialmente respetuoso con las fuentes utilizadas.

La IA se utiliza aquí como herramienta para estructurar, sintetizar, traducir, explicar y hacer más accesible el conocimiento, no como mecanismo para borrar su procedencia.

Siempre que corresponda deberá poder indicarse adecuadamente cuáles son las fuentes de un curso o de sus materiales.

## Exámenes

Los cursos pueden contener tantos exámenes como sea necesario.

Un examen debe considerarse simplemente otro tipo de material dentro del recorrido del curso.

Debe existir un formato abierto y sencillo para representar sus preguntas.

No quiero que esta funcionalidad derive en construir un enorme motor académico o un sistema de evaluación empresarial.

La intención es poder generar fácilmente preguntas, respuestas y explicaciones, incluyendo mediante IA, incorporarlas al curso y permitir al estudiante comprobar que está interiorizando el contenido.

La UI de los exámenes debe ser especialmente cuidada.

Cuando sea apropiado, después de responder debe ofrecer feedback claro y permitir comprender por qué una respuesta era correcta o incorrecta, en lugar de limitarse a mostrar una puntuación.

El resultado de los exámenes se asociará a la cuenta del usuario registrado.

## Finalización y certificados

Open Knowledge debe poder determinar cuándo una persona ha terminado un curso.

La finalización puede depender de haber consumido los materiales requeridos y, cuando el curso lo determine, de haber superado los exámenes correspondientes.

Cuando un usuario registrado cumpla los requisitos del curso podrá obtener un certificado de finalización.

Este certificado representa que esa identidad de Open Knowledge ha completado el curso.

No pretendemos convertir Open Knowledge en una institución académica ni hacer pasar estos certificados por titulaciones oficiales.

Se trata sencillamente de una forma bonita y útil de reconocer y conservar que se ha completado un recorrido de aprendizaje.

La presentación del certificado debe estar visualmente muy cuidada y ser coherente con la calidad general de la aplicación.

## Modo estudio

Este es uno de los puntos más importantes de todo el proyecto.

El modo estudio debe ser súper visual y tener una UX impecable.

Una vez dentro de un curso, debe ser extremadamente sencillo entender:

* Qué hemos completado.
* En qué punto estamos.
* Qué sección estamos estudiando.
* Qué materiales quedan pendientes.
* Qué debemos hacer a continuación.

La interfaz debe evitar sobrecargar al estudiante con información innecesaria.

Debe facilitar concentrarse en el material actual.

Las secciones ya completadas pueden mostrarse de forma visualmente más compacta o plegada.

Las secciones pendientes deben ser fáciles de explorar.

Cuando volvemos a un curso en progreso, la aplicación debe llevarnos de forma natural al primer material pendiente o al punto adecuado para continuar.

Debe haber acciones de continuar muy claras.

La experiencia tiene que transmitir continuidad: abrir Open Knowledge, entrar en un curso y seguir aprendiendo desde donde lo dejamos debe requerir prácticamente cero esfuerzo mental.

El progreso general del curso debe poder entenderse visualmente de un vistazo.

La experiencia de lectura debe estar especialmente cuidada:

* Buena tipografía.
* Anchos de lectura adecuados.
* Jerarquías visuales claras.
* Excelente renderizado de Markdown.
* Imágenes correctamente integradas.
* Reproductores de audio y vídeo agradables.
* Navegación sencilla entre materiales.
* Modo oscuro si encaja con el diseño global.
* Transiciones y animaciones sutiles que ayuden a entender la navegación.

Las animaciones deben contribuir a hacer que la aplicación se sienta viva, fluida y agradable, nunca convertirse en ruido o ralentizar el aprendizaje.

## Noticias de la librería de Open Knowledge

A discreción del administrador, una instancia puede tener habilitado un apartado de noticias o blog sobre la propia librería.

El administrador es quien publica estas noticias.

El blog puede utilizarse para explicar novedades de la librería, anunciar nuevos cursos, cambios importantes, nuevas líneas de conocimiento o cualquier otra comunicación relacionada con el proyecto.

Si el administrador desactiva esta funcionalidad, la sección simplemente no debe aparecer.

No existe ningún blog por curso, sistema de publicaciones de usuarios ni noticias de grupos, porque esos conceptos no existen en esta versión de Open Knowledge.

## Modo lector y librería de cursos

La UI para navegar por la librería debe ser usable, moderna y especialmente bonita.

No quiero una interfaz funcional pero genérica.

La calidad visual y de interacción forma parte explícitamente de los requisitos del producto.

El catálogo debe permitir descubrir fácilmente los cursos disponibles, organizarlos por categorías y comprender rápidamente de qué trata cada uno.

Las imágenes de portada deben tener protagonismo.

Las cards de los cursos deben ser visualmente atractivas.

Las transiciones entre catálogo, detalle del curso y modo estudio deben sentirse naturales.

Debe existir una jerarquía visual clara y evitarse la sensación de dashboard empresarial.

Open Knowledge es principalmente un lugar para leer y aprender.

La interfaz debe transmitir esa idea.

No debe llenarse de métricas, widgets, menús y elementos secundarios simplemente porque haya espacio disponible.

## Mobile first

Este requisito es especialmente importante y complementa las indicaciones generales sobre dispositivos móviles de este documento.

No quiero que el diseño de escritorio se haga primero y posteriormente se intente encoger para móvil.

La experiencia móvil debe diseñarse como una experiencia de primer nivel.

En un smartphone la navegación por la librería, la página de un curso, el modo estudio, los exámenes, el progreso y el resto de funcionalidades principales deben sentirse prácticamente como una aplicación nativa.

Debe cuidarse especialmente:

* Usabilidad táctil.
* Tamaños de botones y áreas interactivas.
* Navegación con una sola mano cuando sea razonable.
* Uso inteligente del espacio disponible.
* Menús y paneles adaptados a pantallas pequeñas.
* Animaciones y transiciones.
* Scroll.
* Lectura prolongada.
* Orientación vertical.
* Cambio entre materiales.
* Visualización de vídeo, audio e imágenes.
* Exámenes.
* Progreso.

Las animaciones deben ser fluidas y sutiles.

Quiero que la aplicación se vea especialmente bien desde un teléfono móvil.

Que existan menos funcionalidades debe utilizarse como una oportunidad para cuidar muchísimo más las que sí existen.

## Principio de simplicidad

Quiero evitar explícitamente sobreconstruir este proyecto.

No implementes funcionalidades simplemente porque podrían ser útiles algún día.

En particular, esta versión de Open Knowledge NO necesita:

* Federación entre instancias.
* Repositorios remotos.
* Sincronización de cursos entre servidores.
* Grupos.
* Sistemas de contribución.
* Votaciones.
* Gobernanza.
* Roles complejos.
* Usuarios editores.
* Comunidades.
* Comentarios.
* Seguidores.
* Mensajería.
* Perfiles sociales.
* Marketplaces.
* Pagos.
* Suscripciones.
* Cohortes.
* Gestión de profesores y alumnos.
* Herramientas propias de un LMS empresarial.

Si alguna de estas necesidades aparece algún día porque existen usuarios reales que las necesitan, ya se diseñará entonces.

No debemos diseñar hoy infraestructura destinada a resolver problemas que todavía no tenemos.

Eso no significa hacer una aplicación mínima o descuidada.

Quiero simplicidad en la cantidad de conceptos y funcionalidades, no simplicidad en su ejecución.

Las pocas cosas que hace Open Knowledge deben hacerlas excepcionalmente bien.

Especialmente la experiencia de navegación, lectura, estudio y utilización desde dispositivos móviles.

# El manifiesto

Fíjate en todo lo que te he dicho. Puedes inferir muchas ideas detrás de este proyecto.

Internet permitió por primera vez distribuir conocimiento a escala prácticamente universal.

La inteligencia artificial nos permite ahora dar un paso adicional: procesar, estructurar, sintetizar, traducir y convertir enormes cantidades de conocimiento en materiales educativos accesibles de una forma que hasta hace poco era extremadamente costosa.

Eso puede utilizarse para generar todavía más contenido desechable, monetizable y diseñado alrededor de plataformas cerradas.

Open Knowledge pretende explorar la dirección contraria.

En un mundo donde la IA nos permite destilar conocimiento casi sin límites, es necesario que exista una herramienta donde cualquier persona pueda instalarla, curar conocimiento y publicar abiertamente sus cursos para los demás.

Open Knowledge es un ofrecimiento a la humanidad, no una palanca para que alguien monte su próximo negocio.

El estudiante no es un producto.

No necesitamos conocer su nombre, su correo electrónico, su teléfono, su edad ni construir un perfil sobre él para ayudarle a aprender.

Si alguien solamente quiere leer, debe poder hacerlo.

Si quiere conservar su progreso, le damos una identidad pseudónima y guardamos únicamente aquello necesario para proporcionarle esa funcionalidad.

El conocimiento debe ocupar el centro.

La interfaz debe desaparecer alrededor de él.

La tecnología debe hacer que publicarlo sea más sencillo.

La IA debe ayudarnos a comprenderlo y estructurarlo sin ocultar de dónde procede.

Y la calidad de la experiencia debe demostrar que una herramienta abierta, autoalojable, gratuita y concebida como un regalo no tiene por qué sentirse peor que un producto comercial.

Al contrario.

Open Knowledge debe verse y sentirse extraordinariamente bien.

Quiero que construyas el proyecto teniendo permanentemente presente esta filosofía, pero sin dejar que esa filosofía nos empuje nuevamente a sobrecomplicar el software.

La misión inicial es mucho más sencilla:

Alguien despliega Open Knowledge.

Publica conocimiento.

Otra persona entra.

Y aprende.
