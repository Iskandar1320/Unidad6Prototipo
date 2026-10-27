# StoryBoard
1. La mente
Tecla 1 · Escenario inicial

Un círculo irregular compuesto de cientos de partículas ocupa el centro de la pantalla. No gira uniformemente: algunos agentes se agrupan, otros se separan y otros recorren el interior. La música modifica su intensidad, velocidad y dispersión.

Al mover el mouse, las partículas cercanas se desvían, generan remolinos y dejan estelas que se disuelven gradualmente.

Algoritmos: flow fields para la circulación; flocking para agrupación; steering para la interacción con el cursor.

![LaMente](./ImganesStory/Mente_Esfera.png)

2. Romper la cuerda
Tecla 2 · Angustia y deseo de liberación

Del borde superior aparece una cuerda formada por partículas alineadas. Una figura triangular semejante a la hoja de un cuchillo se aproxima a ella.

Al encontrarse, el campo de flujo que mantenía la cuerda unida se rompe. Sus partículas se dispersan violentamente antes de desaparecer.

El círculo de fondo continúa funcionando, pero se altera momentáneamente por la dispersión.

Algoritmos: steering para formar las siluetas; flow fields para separar los fragmentos.

![Cuerda](./ImganesStory/Cuerda.png)

3. Purificación fallida
Tecla 3 · Intentar limpiar lo que se siente

Aparece una pequeña barra de jabón construida por partículas, acompañada de pequeñas agrupaciones que se desprenden de su superficie.

Esas agrupaciones se expanden como burbujas, pero en lugar de mantener una forma perfecta, se deforman, se cruzan y se dispersan.

La intención es expresar un intento de limpieza mental que nunca consigue organizar completamente el sistema.

Algoritmos: flocking para los grupos de burbujas; steering de separación y flow fields para expandirlos.

![Jabon](./ImganesStory/Jabon.png)

4. La inocencia perdida
Tecla 4 · El recuerdo de la infancia

Las partículas comienzan a reunirse en la silueta de un niño pequeño con audífonos. La figura es sencilla: cabeza, torso, audífonos y unos pocos trazos para los brazos.

Al formarse, las partículas se mantienen relativamente tranquilas, contrastando con el movimiento turbulento del círculo.

Posteriormente pierden cohesión y el niño se desintegra, como un recuerdo que se desvanece.

Algoritmos: steering de llegada y flocking para formar y sostener temporalmente la figura.

![Audifonos](./ImganesStory/Audifonos_Niño.png)

5. Asfixia emocional
Tecla 5 · Las emociones reprimidas

Dos manos delineadas con partículas aparecen a ambos lados de una silueta de cuello central.

Las manos se aproximan y, conforme se acercan, las partículas del círculo comienzan a comprimirse hacia el centro. Las líneas pueden volverse más densas e inestables.

Finalmente, la presión se libera y las partículas escapan en distintas direcciones.

Algoritmos: steering de búsqueda y evasión; flow fields convergentes y divergentes.

![Choke](./ImganesStory/Choke.png)

6. El pacto
Tecla 6 · Perder el control de la propia identidad

Las partículas se reorganizan para revelar una máscara del diablo en la zona superior y un pequeño documento con un bolígrafo en la zona inferior.

El bolígrafo deja una breve estela sobre el documento, como si estuviera firmándose un contrato.

Al concluir, la máscara se fragmenta y las partículas del documento se dispersan, regresando al estado original.

Algoritmos: steering hacia contornos y trayectorias locales; flocking y flow fields para la desintegración.

![Pacto](./ImganesStory/Pacto.png)