// --- LÓGICA PRINCIPAL DEL JUEGO ---

// Nuevas variables para el temporizador por pregunta
let questionTimer = null;
let currentQuestionTimeLeft = 0;
// Lista de palabras cargada desde es_ec.dic
let wordList = [];
// Cargar diccionario (se ejecuta al inicio)
function loadDictionary() {
    fetch('es_ec.dic')
        .then(r => r.text())
        .then(text => {
            wordList = text.split(/\r?\n/)
                .map(w => w.trim())
                .filter(w => w.length > 0)
                .map(w => w.replace(/\/.*$/, ""))
                .map(w => w.normalize('NFC'))
                .filter(w => /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+$/.test(w));
            console.log('Diccionario cargado, palabras:', wordList.length);
        })
        .catch(e => {
            console.warn('No se pudo cargar es_ec.dic:', e);
        });
}

// Eliminar tildes
function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
}

// Generar opciones de acentuación (incluye la forma correcta)
function generateAccentOptions(word) {
    const tildesMin = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
    const tildesMay = { A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' };
    const base = removeAccents(word);
    const options = new Set();
    options.add(base);
    for (let i = 0; i < base.length; i++) {
        const ch = base[i];
        if ('aeiouAEIOU'.includes(ch)) {
            const accented = ch === ch.toUpperCase() ? tildesMay[ch] : tildesMin[ch];
            if (!accented) continue;
            const variante = base.slice(0, i) + accented + base.slice(i + 1);
            options.add(variante);
        }
    }
    options.add(word);
    const arr = Array.from(options);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


function startContest(mode) {
    gameMode = mode;
    score = 0;
    errors = 0;
    totalTimeElapsed = 0; 
    
    rightInfoDisplay.classList.remove('time-warning');
    rightInfoDisplay.style.display = 'inline'; 
    centerTimeDisplay.style.display = 'none'; 
    
    gameContainer.classList.remove('game-content-hidden'); 
    stopFreeModeTimer();
    // Detener temporizador de pregunta si estaba activo
    stopQuestionTimer(); 
    
    modeSelectionModal.style.display = 'none'; 
    timeSelectionModal.style.display = 'none';
    playerNameModal.style.display = 'none';
    rankingModal.style.display = 'none';
    
    stopBGM();

    playSound(startSound);
    gameStarted = true; 
    mainMenuButton.style.display = 'block'; 

    if (gameMode === 'chrono') {
         gameTitleEl.textContent = 'Modo Contrarreloj';
         timeLeft = initialTime;
         rightInfoDisplay.textContent = `Tiempo: ${timeLeft}s`;
         if (nextQuestionButton) nextQuestionButton.style.display = 'none';
         startChronoTimer();
         playBGM('2.mp3'); 
    } else if (gameMode === 'sudden_death') {
         gameTitleEl.textContent = 'Muerte Súbita';
         startTime = Date.now(); 
         rightInfoDisplay.textContent = `Tiempo: 0s`; // Muestra el tiempo total transcurrido
         centerTimeDisplay.style.display = 'block'; // Muestra el tiempo por pregunta
         if (nextQuestionButton) nextQuestionButton.style.display = 'none';
         startSuddenDeathTimer(); // Temporizador que mide el tiempo total de la partida
         playBGM('3.mp3');
    } else { // free
         gameTitleEl.textContent = 'Práctica Libre';
         rightInfoDisplay.textContent = `Errores: ${errors}`;
         if (nextQuestionButton) nextQuestionButton.style.display = 'none'; 
         startFreeModeTimer(); 
         playBGM('1.mp3');
    }
    
    scoreDisplay.textContent = `Puntuación: ${score}`;
    generateNewQuestion();
    enableOptions(true);
}

// --- FUNCIÓN CORREGIDA ---
function handleAnswer(event) {
    if (!gameStarted) return; 
    
    const selectedButton = event.currentTarget;
        // selectedAnswer será null si el tiempo se agota
        const selectedAnswer = selectedButton ? selectedButton.value : null;

    enableOptions(false);
    
    // Parar temporizador de pregunta al contestar en Muerte Súbita
    if (gameMode === 'sudden_death') {
        stopQuestionTimer();
    }
    
    if (gameMode === 'free') {
         if (freeModeTimerInterval) clearInterval(freeModeTimerInterval);
         if (freeModeTimerStartTime > 0) {
            totalTimeElapsed += (Date.now() - freeModeTimerStartTime) / 1000;
         }
    }

    if (selectedAnswer === correctAnswer) {
        score++;
        playSound(aciertoSound); 
        updateFeedback('¡Correcto!', true);
        
        if (gameMode === 'chrono' || gameMode === 'sudden_death') {
            // --- INICIO DE LA MODIFICACIÓN ---
            // Cambiado de 500 a 100 para acortar la pausa al acertar
            autoAdvanceTimeout = setTimeout(() => {
                if (gameStarted) { 
                    resetOptionStyles();
                    feedbackMessage.style.opacity = '0';
                    generateNewQuestion();
                    enableOptions(true);
                }
            }, 100); 
            // --- FIN DE LA MODIFICACIÓN ---
        } else {
            if (nextQuestionButton) nextQuestionButton.style.display = 'block';
        }

    } else {
        errors++;
        playSound(errorSound);
        updateFeedback('Incorrecto.', false); 
            const correctBtn = optionButtons.find(btn => btn.value === correctAnswer);
        if (correctBtn) correctBtn.classList.add('correct-answer');
        
        // --- INICIO DE LA CORRECCIÓN 1 ---
        // Solo añade la clase si selectedButton es un elemento real (tiene classList)
        if (selectedButton && selectedButton.classList) {
            selectedButton.classList.add('incorrect-choice');
        }
        // --- FIN DE LA CORRECCIÓN 1 ---
        
        if (gameMode === 'sudden_death') {
             // Esta sección ahora SÍ se ejecutará cuando se agote el tiempo
             if (timerInterval) clearInterval(timerInterval); 
             setTimeout(() => endGame(true),  500); // Esta pausa de 500ms al fallar NO se altera
             return; 
        }
        
        if (gameMode === 'chrono') {
            autoAdvanceTimeout = setTimeout(() => {
                if (gameStarted) { 
                    resetOptionStyles();
                    feedbackMessage.style.opacity = '0';
                    generateNewQuestion();
                    enableOptions(true);
                }
            }, 500); // Esta pausa de 500ms al fallar NO se altera
        }
        
        if (gameMode === 'free') {
            rightInfoDisplay.textContent = `Errores: ${errors}`; 
            if (nextQuestionButton) nextQuestionButton.style.display = 'block';
        }
    }

    // --- INICIO DE LA CORRECCIÓN 2 ---
    // Añade esta comprobación también aquí
    if (selectedButton && selectedButton.classList) {
        selectedButton.classList.add(selectedAnswer === correctAnswer ? 'correct-answer' : 'incorrect-choice');
    }
    // --- FIN DE LA CORRECCIÓN 2 ---
    
    scoreDisplay.textContent = `Puntuación: ${score}`;
    
    if (gameMode === 'free' && !correctAnswer) { 
        centerTimeDisplay.textContent = `Tiempo: ${formatTime(totalTimeElapsed)}`;
    }
}
// --- FIN DE LA FUNCIÓN CORREGIDA ---


function generateNewQuestion() {
    if (!gameStarted) return;

    if (gameMode === 'free') startFreeModeTimer();

    // Reinicia el temporizador por pregunta si está en Muerte Súbita
    if (gameMode === 'sudden_death') {
        startQuestionTimer();
    }

    // Seleccionar palabra aleatoria y generar opciones de acentuación
    if (!wordList || wordList.length === 0) {
        numberToRoundEl.textContent = 'Cargando diccionario…';
        optionButtons.forEach((b) => { b.textContent = ''; b.value = ''; b.disabled = true; });
        return;
    }

    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    correctAnswer = randomWord; // ahora es string
    const baseWithoutAccents = removeAccents(randomWord);
    const options = generateAccentOptions(randomWord);

    // Mostrar la palabra base sin acentos
    numberToRoundEl.textContent = baseWithoutAccents;

    // Renderizar tantos botones como opciones genere la función
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    // Vaciar y reconstruir el arreglo compartido optionButtons
    if (Array.isArray(optionButtons)) {
        optionButtons.length = 0;
    }

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-button';
        btn.textContent = opt;
        btn.value = opt;
        btn.disabled = false;
        btn.addEventListener('click', handleAnswer);
        container.appendChild(btn);
        if (Array.isArray(optionButtons)) optionButtons.push(btn);
    });

    // Asegurar estilos limpios
    resetOptionStyles();
    enableOptions(true);
}


function endGame(isSuddenDeathError = false) {
    gameStarted = false;
    enableOptions(false);
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
        autoAdvanceTimeout = null;
    }
    
    stopFreeModeTimer();
    stopQuestionTimer(); // Detiene el temporizador de pregunta
    stopBGM();
    if (isMusicOn) playBGM('fin.mp3');
    
    resetOptionStyles();
    
    if (gameMode !== 'free') {
        saveScore(playerName, score, gameMode);
    }
    
    setTimeout(() => {
        gameContainer.classList.add('game-content-hidden');
        
        const finalTime = (gameMode === 'chrono') ? initialTime : (Date.now() - startTime) / 1000;
        displayRanking(playerName, score, gameMode); 
        
        endGameTitle.textContent = isSuddenDeathError ? '¡Has Fallado!' : 'Fin de la Partida';
        summaryTotalEl.textContent = finalTime.toFixed(2) + 's';
        summaryCorrectEl.textContent = score;
        summaryIncorrectEl.textContent = errors;
        summaryApsEl.textContent = (score / finalTime).toFixed(2);
        
        rankingModal.style.display = 'flex';
    },  500);
}


function startQuestionTimer() {
    if (questionTimer) clearInterval(questionTimer);
    
    if (suddenDeathTimeLimit === Infinity) {
        centerTimeDisplay.textContent = `Tiempo: ∞`;
        return;
    }
    
    currentQuestionTimeLeft = suddenDeathTimeLimit;
    centerTimeDisplay.textContent = `Tiempo: ${currentQuestionTimeLeft}s`;
    
    questionTimer = setInterval(() => {
        currentQuestionTimeLeft--;
        centerTimeDisplay.textContent = `Tiempo: ${currentQuestionTimeLeft}s`;
        centerTimeDisplay.classList.toggle('time-warning', currentQuestionTimeLeft <= 3);

        if (currentQuestionTimeLeft <= 0) {
            clearInterval(questionTimer);
            handleAnswer({ currentTarget: { value: null } }); // Simula una respuesta incorrecta
        }
    }, 1000);
}

function stopQuestionTimer() {
    if (questionTimer) {
        clearInterval(questionTimer);
        questionTimer = null;
    }
    centerTimeDisplay.classList.remove('time-warning');
}

function startChronoTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        rightInfoDisplay.textContent = `Tiempo: ${timeLeft}s`;
        rightInfoDisplay.classList.toggle('time-warning', timeLeft <= 10);
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function startSuddenDeathTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const currentElapsed = (Date.now() - startTime) / 1000;
        rightInfoDisplay.textContent = `Tiempo: ${formatTime(currentElapsed)}`;
    }, 1000); 
}

function startFreeModeTimer() {
    if (freeModeTimerInterval) clearInterval(freeModeTimerInterval);
    centerTimeDisplay.style.display = 'inline';
    freeModeTimerStartTime = Date.now(); 
    centerTimeDisplay.textContent = `Tiempo: ${formatTime(totalTimeElapsed)}`;

    freeModeTimerInterval = setInterval(() => {
        totalTimeElapsed += (Date.now() - freeModeTimerStartTime) / 1000;
        freeModeTimerStartTime = Date.now(); 
        centerTimeDisplay.textContent = `Tiempo: ${formatTime(totalTimeElapsed)}`;
    }, 1000); 
}

function stopFreeModeTimer() {
    if (freeModeTimerInterval) clearInterval(freeModeTimerInterval);
    freeModeTimerInterval = null;
}

function formatTime(totalSeconds) {
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}