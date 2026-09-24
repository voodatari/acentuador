// --- REFERENCIAS A ELEMENTOS DEL DOM ---

const gameContainer = document.getElementById('game-container'); 
const gameTitleEl = document.getElementById('game-title'); 
const scoreDisplay = document.getElementById('score-display');
const centerTimeDisplay = document.getElementById('center-time-display'); 
const rightInfoDisplay = document.getElementById('right-info-display'); 

const numberToRoundEl = document.getElementById('number-to-round');
const roundingUnitEl = document.getElementById('rounding-unit');
const optionButtons = [
    document.getElementById('option1'),
    document.getElementById('option2'),
    document.getElementById('option3')
];
const feedbackMessage = document.getElementById('feedback-message');

const modeSelectionModal = document.getElementById('mode-selection-modal'); 
const timeSelectionModal = document.getElementById('time-selection-modal'); 
const playerNameModal = document.getElementById('player-name-modal');      
const rankingModal = document.getElementById('ranking-modal');            

const modeChronoButton = document.getElementById('mode-chrono-button');
const modeSuddenDeathButton = document.getElementById('mode-sudden-death-button'); 
const modeFreeButton = document.getElementById('mode-free-button');
const timeButtons = document.querySelectorAll('.time-button');
const setNameButton = document.getElementById('set-name-button');
const playerNameInput = document.getElementById('player-name-input');
const playerNameTitle = document.getElementById('player-name-title'); 

const endGameTitle = document.getElementById('end-game-title');
const summaryTotalEl = document.getElementById('summary-total');
const summaryCorrectEl = document.getElementById('summary-correct');
const summaryIncorrectEl = document.getElementById('summary-incorrect');
const summaryApsEl = document.getElementById('summary-aps'); 
const rankingTableBody = document.querySelector('#ranking-table tbody');
const nextQuestionButton = document.getElementById('next-question-button');

const samePlayerButton = document.getElementById('same-player-button');
const otherPlayerButton = document.getElementById('other-player-button');
const modeSelectButton = document.getElementById('mode-select-button');
const mainMenuButton = document.getElementById('main-menu-button'); 

const muteToggleButton = document.getElementById('mute-toggle-button');