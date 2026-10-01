// audio.js

// --- MOTOR DE AUDIO ---

const AUDIO_PATH = 'music/'; 
let currentBGM = null;
// MANTENER isMusicOn como el estado de la MÚSICA DE FONDO (BGM).
// Iniciar como 'false' para que la BGM esté desactivada al inicio.
let isMusicOn = false; 

// Inicializar Audio
const startSound = new Audio(AUDIO_PATH + 'start.mp3');
const clickSound = new Audio(AUDIO_PATH + 'click.wav');
const aciertoSound = new Audio(AUDIO_PATH + 'acierto.mp3');
const errorSound = new Audio(AUDIO_PATH + 'error.mp3');
const timeWarningSound = new Audio(AUDIO_PATH + 'warning.mp3'); 

// Función para reproducir efectos de sonido (SFX)
function playSound(audioFile, volume = 1.0) {
    // ELIMINAR LA COMPROBACIÓN: "if (!isMusicOn) return;"
    // Esto asegura que el SFX siempre se reproduzca, independientemente del estado del toggle.
    
    audioFile.pause();
    audioFile.currentTime = 0; 

    audioFile.volume = volume;
    audioFile.play().catch(e => {
         if (!e.toString().includes("denied permission")) {
            console.log("Error playing SFX:", e);
         }
    });
}

// --- Música de fondo con bucle sin cortes ---
// Con <audio loop>, Chrome deja una pequeña pausa al volver al principio de un MP3
// (no recorta el relleno que añade el codificador y el salto no es instantáneo).
// Firefox lo hace perfecto, así que allí se deja el <audio loop> de siempre.
// En los demás, la pista se decodifica con Web Audio y se repite muestra a muestra.
// Para que ya la primera vuelta vaya sin cortes, la música espera a que la pista
// esté lista (como mucho ESPERA_BUCLE ms). Si tarda más (conexión lenta), suena el
// <audio> y al acabar esa vuelta entra el bucle sin cortes. Si Web Audio falla,
// se queda con el <audio loop>.
const ESPERA_BUCLE = 1500;
const BUCLE_WEB_AUDIO = !/firefox/i.test(navigator.userAgent) && !!(window.AudioContext || window.webkitAudioContext);
let audioCtx = null;
function getAudioContext() {
    if (!BUCLE_WEB_AUDIO) return null;
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    return audioCtx;
}

// Recorta solo el silencio digital de los extremos (el relleno del codificador, ~50 ms como mucho):
// las pistas tienen silencios rítmicos propios que no se pueden tocar
function loopBounds(buffer) {
    const limit = Math.min(2304, Math.floor(buffer.length / 4));
    const channels = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));
    const silent = i => channels.every(data => Math.abs(data[i]) < 1e-4);
    let start = 0, end = buffer.length;
    while (start < limit && silent(start)) start++;
    while (buffer.length - end < limit && silent(end - 1)) end--;
    return [start / buffer.sampleRate, end / buffer.sampleRate];
}

class BGMTrack {
    constructor(file, volume, loop) {
        this.src = AUDIO_PATH + file;   // ui-manager.js mira qué pista suena por su nombre
        this.volume = volume;
        this.stopped = false;
        this.source = null;
        this.decoding = false;
        this.waitTimer = null;          // esperando a la pista decodificada para empezar sin cortes
        this.el = new Audio(this.src);
        this.el.loop = loop;
        this.el.volume = volume;
        if (loop && getAudioContext()) this.prepareGapless();
    }

    get paused() {
        if (this.stopped) return true;
        if (this.waitTimer) return false;
        return this.source ? audioCtx.state !== 'running' : this.el.paused;
    }

    play() {
        this.stopped = false;
        if (this.source) return audioCtx.resume();
        if (this.decoding) {
            // se espera un poco a la pista decodificada; si tarda, suena el <audio>
            if (!this.waitTimer) {
                this.waitTimer = setTimeout(() => {
                    this.waitTimer = null;
                    if (!this.stopped && !this.source) {
                        this.el.play().catch(e => console.log("Error playing BGM:", e));
                    }
                }, ESPERA_BUCLE);
            }
            return Promise.resolve();
        }
        return this.el.play();
    }

    pause() {
        this.stopped = true;
        clearTimeout(this.waitTimer);
        this.waitTimer = null;
        this.el.pause();
        if (this.source) {
            try { this.source.stop(); } catch (e) {}
            this.source = null;
        }
    }

    prepareGapless() {
        const ctx = audioCtx;
        this.decoding = true;
        fetch(this.src)
            .then(response => { if (!response.ok) throw new Error(response.status); return response.arrayBuffer(); })
            .then(data => ctx.decodeAudioData(data))
            .then(buffer => { this.decoding = false; if (!this.stopped) this.switchToGapless(buffer); })
            .catch(e => {
                this.decoding = false;
                console.log("Bucle sin cortes no disponible, se usa <audio loop>:", e);
                // si estaba esperando, que suene ya el <audio>
                if (this.waitTimer) {
                    clearTimeout(this.waitTimer);
                    this.waitTimer = null;
                    if (!this.stopped) this.el.play().catch(() => {});
                }
            });
    }

    switchToGapless(buffer) {
        const ctx = audioCtx;
        const [loopStart, loopEnd] = loopBounds(buffer);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.loopStart = loopStart;
        source.loopEnd = loopEnd;
        const gain = ctx.createGain();
        gain.gain.value = this.volume;
        source.connect(gain).connect(ctx.destination);

        const el = this.el;
        if (!el.paused && isFinite(el.duration)) {
            // tardó en llegar y ya suena el <audio>: termina esta vuelta y el bucle entra al acabar
            ctx.resume().then(() => {
                if (this.stopped) return;
                el.loop = false;
                const remaining = Math.max(0, (el.duration - el.currentTime) / (el.playbackRate || 1));
                source.start(ctx.currentTime + remaining, loopStart);
                this.source = source;
            }).catch(() => {});
            return;
        }
        // lo normal: llega mientras se espera y empieza ya sin cortes desde el principio
        // (si el navegador aún bloquea el sonido, empieza con la primera pulsación)
        clearTimeout(this.waitTimer);
        this.waitTimer = null;
        el.pause();
        source.start(0, loopStart);
        this.source = source;
    }
}

// Función para detener la música
function stopBGM() {
    if (currentBGM) {
        currentBGM.pause();
        currentBGM = null;
    }
}

// Función para reproducir la música de fondo (BGM)
function playBGM(file, loop = true) {
    // MANTENER LA COMPROBACIÓN: La BGM solo se reproduce si isMusicOn es TRUE.
    if (!isMusicOn) return; 
    
    stopBGM(); 
    
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});

    const volume = (file === 'titulo.mp3' || file === 'fin.mp3') ? 0.4 : 0.6;
    currentBGM = new BGMTrack(file, volume, loop);
    
    currentBGM.play().catch(e => {
        if (!e.toString().includes("denied permission")) {
            console.log("Error playing BGM:", e);
        }
    });
}

// Lógica para activar/desactivar el sonido
function toggleMusic() {
    isMusicOn = !isMusicOn;
    // El texto del botón ahora refleja si la MÚSICA DE FONDO está activa (🔊) o no (🔇).
    muteToggleButton.textContent = isMusicOn ? '🔊' : '🔇';

    if (isMusicOn) {
        // Al activar: Intentar reproducir la BGM apropiada
        if (!currentBGM || currentBGM.paused) {
            // Lógica para determinar qué música reproducir (título, ranking, etc.)
            // Esto asume que las variables modales están disponibles globalmente.
            if (modeSelectionModal.style.display === 'flex' || rankingModal.style.display === 'flex' || timeSelectionModal.style.display === 'flex' || playerNameModal.style.display === 'flex') {
                playBGM('titulo.mp3');
            }
            // NOTA: Si el juego ya está en una partida, `playBGM` debería ser llamado desde `startContest` de nuevo.
        } else {
             currentBGM.play().catch(e => console.log("Autoplay resume error:", e));
        }
    } else {
        // Al desactivar: Detener la BGM
        stopBGM(); 
    }
}