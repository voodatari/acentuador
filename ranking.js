// --- LÓGICA DE RANKING (LOCALSTORAGE) ---
let scores = []; 

function loadRanking(mode) {
    if (!mode || mode === 'free') {
        scores = [];
        return;
    }
    try {
        const rankingKey = `acentuadorRanking_${mode}`;
        const storedScores = localStorage.getItem(rankingKey);
        scores = storedScores ? JSON.parse(storedScores) : [];
    } catch (e) {
        console.error(`Error leyendo ranking para el modo ${mode}:`, e);
        scores = [];
    }
}

function saveScore(name, finalScore, mode) {
    if (!mode || mode === 'free') {
        return;
    }
    loadRanking(mode);
    const sanitizedName = (name && name.trim()) ? name.trim().substring(0, 15) : 'Anon.';

    scores.push({ name: sanitizedName, score: finalScore, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);

    scores = scores.slice(0, 10); 

    try {
        const rankingKey = `acentuadorRanking_${mode}`;
        localStorage.setItem(rankingKey, JSON.stringify(scores));
    } catch (e) {
        console.error(`Error guardando ranking para el modo ${mode}:`, e);
    }
}

function displayRanking(currentPlayerName, currentPlayerScore, mode) {
    const rankingTable = document.getElementById('ranking-table');
    const rankingTitle = document.querySelector('#ranking-modal h3');
    const resetRankingButton = document.getElementById('reset-ranking-button');

    // --- LÓGICA RESTAURADA ---
    if (mode === 'free') {
        if (rankingTable) rankingTable.style.display = 'none';
        if (rankingTitle) rankingTitle.style.display = 'none';
        if (resetRankingButton) resetRankingButton.style.display = 'none';
        
        // Ocultar botones de reintento en modo libre
        samePlayerButton.style.display = 'none';
        otherPlayerButton.style.display = 'none';
        return;
    }
    
    // Mostrar botones de reintento para modos con ranking
    samePlayerButton.textContent = `Jugar otra vez (${currentPlayerName})`;
    otherPlayerButton.textContent = 'Cambiar de jugador';
    samePlayerButton.style.display = 'block';
    otherPlayerButton.style.display = 'block';
    // --- FIN DE LA LÓGICA RESTAURADA ---
    
    if (rankingTable) rankingTable.style.display = 'table';
    if (rankingTitle) rankingTitle.style.display = 'block';

    loadRanking(mode);

    if (resetRankingButton) {
        if (!scores || scores.length === 0) {
            resetRankingButton.style.display = 'none';
        } else {
            resetRankingButton.style.display = 'block';
            
            const newButton = resetRankingButton.cloneNode(true);
            resetRankingButton.parentNode.replaceChild(newButton, resetRankingButton);
            
            newButton.addEventListener('click', () => resetRanking(mode));
        }
    }

    const modeName = mode === 'chrono' ? 'Contrarreloj' : 'Muerte Súbita';
    rankingTitle.textContent = `Ranking - ${modeName}`;
    
    rankingTableBody.innerHTML = ''; 

    if (scores.length === 0) {
        rankingTableBody.innerHTML = `<tr><td colspan="3">No hay puntajes para el modo ${modeName}.</td></tr>`;
        return;
    }
    
    let highlighted = false;
    scores.slice(0, 5).forEach((player, index) => { 
        const row = rankingTableBody.insertRow();
        
        const isCurrentPlayer = !highlighted &&
                              currentPlayerName &&
                              currentPlayerScore !== null &&
                              player.name === currentPlayerName &&
                              player.score === currentPlayerScore;
        
        if (isCurrentPlayer) {
            row.classList.add('you-score');
            highlighted = true;
        }

        row.insertCell().textContent = index + 1;
        row.insertCell().textContent = player.name;
        row.insertCell().textContent = player.score;
    });
}

function resetRanking(mode) {
    if (!mode || mode === 'free') return;

    const modeName = mode === 'chrono' ? 'Contrarreloj' : 'Muerte Súbita';
    if (confirm(`¿Estás seguro de que quieres borrar el ranking del modo ${modeName}?`)) {
        try {
            const rankingKey = `acentuadorRanking_${mode}`;
            localStorage.removeItem(rankingKey);
            displayRanking(null, null, mode);
        } catch (e) {
            console.error(`Error reseteando el ranking para el modo ${mode}:`, e);
            alert('No se pudo borrar el ranking.');
        }
    }
}