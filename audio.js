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

// Función para detener la música
function stopBGM() {
    if (currentBGM) {
        currentBGM.pause(); 
        currentBGM.currentTime = 0; 
        currentBGM = null; 
    }
}

// Función para reproducir la música de fondo (BGM)
function playBGM(file, loop = true) {
    // MANTENER LA COMPROBACIÓN: La BGM solo se reproduce si isMusicOn es TRUE.
    if (!isMusicOn) return; 
    
    stopBGM(); 
    
    currentBGM = new Audio(AUDIO_PATH + file);
    currentBGM.loop = loop;
    currentBGM.volume = (file === 'titulo.mp3' || file === 'fin.mp3') ? 0.4 : 0.6; 
    
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