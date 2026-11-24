# El Valle Del Equilibrio

Prompt completo

Crea un videojuego RPG con estética pixel art, vista cenital (top-down) y ambientación cozy.

Premisa narrativa: Un país donde la humanidad acaba de asentarse en sus hogares. El destino de la comunidad depende de cómo el jugador interactúe con su entorno: si actúa con cuidado, la comunidad será sostenible, la naturaleza estará bien cuidada, el agua limpia y la comida abundante. Si actúa con descuido, generará caos, contaminación, hambruna y muerte.

Sistema de decisiones y medidor de equilibrio:

Cada acción del jugador (talar árboles, pescar, construir, reciclar, quemar residuos, etc.) mueve una flecha sobre una barra horizontal.

El extremo izquierdo dice "Comunidad sostenible" y el extremo derecho dice "Comunidad catastrófica".

La posición de la flecha representa el porcentaje de inclinación de la sociedad hacia uno u otro lado.

El jugador debe ver en todo momento este medidor para entender las consecuencias de sus actos.

Duración y tiempo:

Cada partida dura 100 días en el juego.

10 días de juego equivalen a 1 minuto real.

Debe existir un botón de acelerar el tiempo (x2, x4) que mantenga intactos los parámetros y el porcentaje del medidor.

Cambio visual del entorno según el medidor:

Cuando la flecha se inclina hacia "Comunidad sostenible": el escenario debe verse brillante, alegre, con colores vivos, vegetación frondosa, agua clara y luz cálida.

Cuando la flecha se inclina hacia "Comunidad catastrófica": el escenario debe volverse lúgubre, grisáceo, con naturaleza muerta, agua turbia y ambiente opresivo.

La transición debe ser gradual y reflejar el porcentaje actual del medidor, no un cambio brusco.

Requisitos técnicos y de estilo:

Pixel art de resolución baja-media (estilo 16x16 o 32x32 por tile), paleta cozy con tonos cálidos en el estado sostenible y tonos desaturados en el estado catastrófico.

Vista cenital con movimiento del personaje en 4 direcciones.

Interfaz simple: medidor de equilibrio visible, reloj/día actual, botones de acción contextuales.

Guardado automático del progreso y del estado del medidor.

Objetivo del jugador: Llegar al día 100 con la flecha lo más cerca posible de "Comunidad sostenible", tomando decisiones que equilibren el desarrollo humano con el cuidado del entorno.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://el-valle-del-equilibrio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0c580c88-4f41-5de3-b793-8743c768a570).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
