# ¡Acentuador!

Juego para practicar la **acentuación (las tildes)** en Primaria: aparece una palabra escrita sin tildes y hay que elegir cómo se escribe correctamente entre varias opciones, con la tilde en cada vocal posible o sin ella.

**Web:** https://voodatari.github.io/acentuador/

Pensado para jugarse en el aula, en la pizarra digital o en los ordenadores del alumnado. Funciona en el navegador, sin instalar nada.

## Modos de juego

| Modo | Cómo se juega |
|---|---|
| ⏱️ **Contrarreloj** | Tantos aciertos como se pueda en un tiempo fijo: de 10 s a 2 min, o «Toda la canción». |
| 💀 **Muerte súbita** | Un fallo y se acaba. Se elige el tiempo por pregunta: infinito, 10, 5 o 3 segundos. |
| 🎯 **Práctica libre** | Sin tiempo ni ranking, a tu ritmo. |

Al terminar se ve el resumen de la partida y un ranking (Top 5) que se guarda en el propio navegador. La música se activa con el botón 🔇 del menú.

## De dónde salen las palabras

De un diccionario de español con más de 50 000 entradas ([`es_ec.dic`](es_ec.dic), formato Hunspell). Al empezar se carga entero y en cada pregunta se elige una palabra al azar.

## Cómo está hecho

HTML, CSS y JavaScript sin frameworks ni compilación: lo que hay en el repositorio es exactamente lo que se publica.

| Archivo | Qué hace |
|---|---|
| `index.html`, `style.css` | Pantallas y estilos |
| `main.js`, `ui-manager.js`, `game-logic.js` | Arranque, pantallas y lógica del juego (carga del diccionario y opciones de acentuación) |
| `ranking.js` | Ranking local |
| `audio.js` | Música y efectos; en Chrome, la música se repite sin cortes con Web Audio |
| `background-animation.js` | Fondo animado |
| `es_ec.dic` | Diccionario de palabras |

### Probarlo en local

Hay que servir la carpeta con un servidor web; abrir `index.html` con doble clic no deja cargar el diccionario. Por ejemplo, la extensión *Live Server* de VS Code, `npx serve .` o `python -m http.server 8080`.

## Créditos de terceros

- Diccionario `es_ec.dic`: diccionario Hunspell de español (Ecuador) del proyecto [RLA-ES](https://github.com/sbosio/rla-es), con licencia triple GPL, LGPL o MPL.
- Tipografías [Poppins](https://fonts.google.com/specimen/Poppins), [Orbitron](https://fonts.google.com/specimen/Orbitron) y [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) (SIL Open Font License), de Google Fonts.

---

Hecho por Daniel Vera (profe Dani).
