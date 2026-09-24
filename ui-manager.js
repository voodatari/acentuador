// --- MANEJADOR DE INTERFAZ (MODALES Y PANTALLAS) ---

function showModeSelection(isInitialLoad) {
    resetGameStats();
    playerNameInput.value = '';
    playerName = '';
    
    gameContainer.classList.add('game-content-hidden'); 
    gameTitleEl.textContent = 'Juego de Acentuación'; 

    timeSelectionModal.style.display = 'none';
    playerNameModal.style.display = 'none';
    rankingModal.style.display = 'none';
    mainMenuButton.style.display = 'none'; 
    
    modeSelectionModal.style.display = 'flex';
    
    numberToRoundEl.textContent = 'Elige tu modo de juego.';
    scoreDisplay.textContent = `Puntuación: 0`;
    rightInfoDisplay.style.display = 'none'; 
    centerTimeDisplay.style.display = 'none'; 
    
    if (isMusicOn && (!isInitialLoad || modeSelectionModal.style.display === 'flex')) {
        if (!currentBGM || currentBGM.src.indexOf('titulo.mp3') === -1) {
             playBGM('titulo.mp3'); 
        }
    }
}

function showTimeSelection(mode) {
    gameMode = mode;
    modeSelectionModal.style.display = 'none';
    rankingModal.style.display = 'none'; 
    timeSelectionModal.style.display = 'flex';
    
    // Contenido dinámico para modo Contrarreloj (Tiempo total)
    const timeArea = document.getElementById('time-selection-area');
    timeArea.innerHTML = `
        <h2>Selecciona el Tiempo Total</h2>
        <p>¿Cuánto quieres que dure el desafío?</p>
	<button class="mode-button time-button" data-time="208">Toda la canción</button>
        <button class="mode-button time-button" data-time="120">2 Minutos</button>
        <button class="mode-button time-button" data-time="60">1 Minuto</button>
        <button class="mode-button time-button" data-time="30">30 Segundos</button>
        <button class="mode-button time-button" data-time="20">20 Segundos</button>
        <button class="mode-button time-button" data-time="10">10 Segundos</button>
    `;

    // Reasignar listeners para los botones de Contrarreloj
    document.querySelectorAll('#time-selection-area .time-button').forEach(button => {
        button.addEventListener('click', (e) => {
            playSound(clickSound);
            // Uso de variables globales (initialTime, timeLeft) de main.js
            initialTime = parseInt(e.currentTarget.getAttribute('data-time'));
            timeLeft = initialTime;
            showPlayerNameModal('chrono');
        });
    });
}

// NUEVA FUNCIÓN PARA MUERTE SÚBITA
function showSuddenDeathTimeSelection() {
    gameMode = 'sudden_death_time_select'; // Modo temporal para la selección
    modeSelectionModal.style.display = 'none';
    rankingModal.style.display = 'none';
    timeSelectionModal.style.display = 'flex';

    // Reconfigura el contenido del modal de selección de tiempo
    const timeArea = document.getElementById('time-selection-area');
    timeArea.innerHTML = `
        <h2>Selecciona el Límite</h2>
        <p>¿Cuántos segundos tienes para contestar cada pregunta?</p>
        <button class="mode-button time-button" data-time="inf">Infinito</button>
        <button class="mode-button time-button" data-time="10">10 segundos</button>
        <button class="mode-button time-button" data-time="5">5 segundos</button>
        <button class="mode-button time-button" data-time="3">3 segundos</button>
    `;

    // Reasignar listeners para los botones de Muerte Súbita
    document.querySelectorAll('#time-selection-area .time-button').forEach(button => {
        button.addEventListener('click', (e) => {
            playSound(clickSound);
            const time = e.currentTarget.getAttribute('data-time');
            suddenDeathTimeLimit = (time === 'inf') ? Infinity : parseInt(time);
            showPlayerNameModal('sudden_death');
        });
    });
}

function showPlayerNameModal(mode) {
    gameMode = mode;
    timeSelectionModal.style.display = 'none';
    rankingModal.style.display = 'none'; 
    
    playerNameModal.style.display = 'flex';
    playerNameInput.focus();
}

function updateFeedback(message, isCorrect) {
    feedbackMessage.textContent = message;
    feedbackMessage.classList.remove('feedback-correct', 'feedback-incorrect');
    feedbackMessage.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');
    feedbackMessage.style.opacity = '1';
}

function enableOptions(enable) {
    optionButtons.forEach(button => {
        button.disabled = !enable;
    });
    if (!enable && gameMode === 'free' && nextQuestionButton) {
         nextQuestionButton.style.display = 'none';
    }
}

function resetOptionStyles() {
    optionButtons.forEach(button => {
        button.classList.remove('correct-answer', 'incorrect-choice');
    });
}

function resetGameStats() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (autoAdvanceTimeout) { clearTimeout(autoAdvanceTimeout); autoAdvanceTimeout = null; }
    stopFreeModeTimer(); 
    
    // Limpieza del temporizador de pregunta
    if (typeof stopQuestionTimer === 'function') { 
        stopQuestionTimer(); 
    }
    
    gameStarted = false;
    rightInfoDisplay.classList.remove('time-warning');
    
    score = 0;
    errors = 0;
    totalTimeElapsed = 0;
}