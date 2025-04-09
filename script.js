import { getDatabase, ref, push, get, child, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    // Ініціалізація Telegram Web App
    const webApp = window.Telegram.WebApp;
    webApp.expand();

    // Отримання посилання на базу даних Firebase
    const database = getDatabase();
    const leaderboardRef = ref(database, 'leaderboard');

    // Елементи DOM (без змін, крім додавання leaderboardList)
    const coin = document.getElementById('coin');
    const scoreDisplay = document.getElementById('score');
    const comboCounter = document.getElementById('combo-counter');
    const startButton = document.getElementById('startButton');
    const leaderboardButton = document.getElementById('leaderboardButton');
    const particles = document.getElementById('particles');
    const endScreen = document.getElementById('endScreen');
    const finalScoreDisplay = document.getElementById('finalScore');
    const sendScoreButton = document.getElementById('sendScoreButton');
    const playAgainButton = document.getElementById('playAgainButton');
    const upgradeButton = document.createElement('button');
    const upgradeScreen = document.createElement('div');
    const energyDisplay = document.createElement('div');
    const leaderboardScreen = document.getElementById('leaderboardScreen'); // Отримання існуючого елемента
    const leaderboardList = document.getElementById('leaderboard-list'); // Отримання списку для рейтингу
    const closeLeaderboardButton = document.getElementById('close-leaderboard-button');

    // Змінні гри (без змін)
    let score = 0;
    let combo = 1;
    let comboTimeout;
    let gameActive = false;
    let lastTapTime = 0;
    let consecutiveTaps = 0;

    // Змінні енергії (без змін)
    let maxEnergy = parseInt(localStorage.getItem('maxEnergy')) || 50;
    let currentEnergy = parseInt(localStorage.getItem('currentEnergy')) || maxEnergy;
    let energyRegenRate = parseFloat(localStorage.getItem('energyRegenRate')) || 0.5;
    let energyTimer;
    energyDisplay.className = 'energy-display';
    const header = document.querySelector('.header');
    if (header) {
        header.appendChild(energyDisplay);
    } else {
        console.error("Елемент .header не знайдено!");
    }

    // Змінні прокачки (без змін)
    let coinLevel = parseInt(localStorage.getItem('coinLevel')) || 1;
    let energyLevel = parseInt(localStorage.getItem('energyLevel')) || 1;
    let upgradePoints = parseInt(localStorage.getItem('upgradePoints')) || 0;

    // Вплив рівнів на гру (без змін)
    const baseClickValue = 1;
    let clickValue = baseClickValue * coinLevel;

    // DOM елементи для прокачки (без змін)
    upgradeButton.textContent = 'Прокачка';
    upgradeButton.className = 'bottom-button';
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.appendChild(upgradeButton);
    } else {
        console.error("Елемент .footer не знайдено!");
    }

    upgradeScreen.className = 'upgrade-screen';
    upgradeScreen.style.display = 'none';
    upgradeScreen.innerHTML = `
        <h2>Прокачка</h2>
        <p>Очки прокачки: <span id="upgrade-points-display"><span class="math-inline">\{upgradePoints\}</span\></p\>
<div class\="upgrade\-item"\>
<span\>Монетка \(рівень <span id\="coin\-level\-display"\></span>{coinLevel}</span>)</span>
            <button id="upgrade-coin-button">Покращити (10 очок)</button>
        </div>
        <div class="upgrade-item">
            <span>Енергія (рівень <span id="energy-level-display">${energyLevel}</span>)</span>
            <button id="upgrade-energy-button">Покращити (10 очок)</button>
        </div>
        <button id="close-upgrade-button" class="bottom-button">Назад</button>
    `;
    document.body.appendChild(upgradeScreen);

    const upgradePointsDisplay = document.getElementById('upgrade-points-display');
    const coinLevelDisplay = document.getElementById('coin-level-display');
    const energyLevelDisplay = document.getElementById('energy-level-display');
    const upgradeCoinButton = document.getElementById('upgrade-coin-button');
    const upgradeEnergyButton = document.getElementById('upgrade-energy-button');
    const closeUpgradeButton = document.getElementById('close-upgrade-button');

    function calculateOfflineEnergy() {
        const lastEnergyUpdate = localStorage.getItem('lastEnergyUpdate');
        if (lastEnergyUpdate) {
            const timeDifference = Date.now() - parseInt(lastEnergyUpdate);
            const offlineRegenAmount = (timeDifference / 1000) * energyRegenRate;
            currentEnergy = Math.min(maxEnergy, currentEnergy + offlineRegenAmount);
            localStorage.setItem('currentEnergy', currentEnergy.toString());
        }
    }

    function startGame() {
        // Завантаження збереженого прогресу
        const savedScore = localStorage.getItem('tapka_score');
        score = savedScore ? parseInt(savedScore) : 0;
        scoreDisplay.textContent = score;
        coinLevel = parseInt(localStorage.getItem('coinLevel')) || 1;
        energyLevel = parseInt(localStorage.getItem('energyLevel')) || 1;
        upgradePoints = parseInt(localStorage.getItem('upgradePoints')) || 0;
        clickValue = baseClickValue * coinLevel;
        maxEnergy = 50 + (energyLevel - 1) * 10;
        energyRegenRate = 0.5 + (energyLevel - 1) * 0.1;
        updateEnergyDisplay();

        // Відновлення енергії в оффлайні при старті гри
        calculateOfflineEnergy();
        updateEnergyDisplay();

        gameActive = true;
        startEnergyRegen();
    }

    function stopGame() {
        gameActive = false;
        stopEnergyRegen();
    }

    function updateEnergyDisplay() {
        energyDisplay.textContent = `Енергія: ${Math.floor(currentEnergy)}`;
    }

    function startEnergyRegen() {
        energyTimer = setInterval(() => {
            if (currentEnergy < maxEnergy && gameActive) {
                currentEnergy += energyRegenRate / 10; // Оновлюємо кожні 100мс
                updateEnergyDisplay();
                localStorage.setItem('currentEnergy', currentEnergy.toString());
            }
            // Оновлюємо час останнього оновлення енергії
            localStorage.setItem('lastEnergyUpdate', Date.now().toString());
        }, 100);
    }

    function stopEnergyRegen() {
        clearInterval(energyTimer);
    }

    function updateCombo() {
        const currentTime = Date.now();
        if (currentTime - lastTapTime < 1000) {
            consecutiveTaps++;
            combo = Math.min(5, Math.floor(consecutiveTaps / 3) + 1);
            comboCounter.textContent = `x${combo}`;
            comboCounter.style.display = 'block';
            clearTimeout(comboTimeout);
            comboTimeout = setTimeout(() => {
                combo = 1;
                consecutiveTaps = 0;
                comboCounter.style.display = 'none';
            }, 2000);
        } else {
            combo = 1;
            consecutiveTaps = 1;
            comboCounter.style.display = 'none';
        }
