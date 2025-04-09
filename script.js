document.addEventListener('DOMContentLoaded', () => {
    // Ініціалізація Telegram Web App
    const webApp = window.Telegram.WebApp;
    webApp.expand();

    // Елементи DOM
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

    // Змінні гри
    let score = 0;
    let combo = 1;
    let comboTimeout;
    let gameActive = false;
    let lastTapTime = 0;
    let consecutiveTaps = 0;

    // Змінні енергії
    let maxEnergy = parseInt(localStorage.getItem('maxEnergy')) || 50;
    let currentEnergy = parseInt(localStorage.getItem('currentEnergy')) || maxEnergy;
    let energyRegenRate = parseFloat(localStorage.getItem('energyRegenRate')) || 0.5; // Енергії в секунду
    let energyTimer;
    const energyDisplay = document.createElement('div');
    energyDisplay.className = 'energy-display';
    const header = document.querySelector('.header');
    if (header) {
        header.appendChild(energyDisplay);
    } else {
        console.error("Елемент .header не знайдено!");
    }

    // Змінні прокачки
    let coinLevel = parseInt(localStorage.getItem('coinLevel')) || 1;
    let energyLevel = parseInt(localStorage.getItem('energyLevel')) || 1;
    let upgradePoints = parseInt(localStorage.getItem('upgradePoints')) || 0;

    // Вплив рівнів на гру
    const baseClickValue = 1;
    let clickValue = baseClickValue * coinLevel;

    // DOM елементи для прокачки
    const upgradeButton = document.createElement('button');
    upgradeButton.textContent = 'Прокачка';
    upgradeButton.className = 'bottom-button';
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.appendChild(upgradeButton);
    } else {
        console.error("Елемент .footer не знайдено!");
    }

    const upgradeScreen = document.createElement('div');
    upgradeScreen.className = 'upgrade-screen';
    upgradeScreen.style.display = 'none';
    upgradeScreen.innerHTML = `
        <h2>Прокачка</h2>
        <p>Очки прокачки: <span id="upgrade-points-display">${upgradePoints}</span></p>
        <div class="upgrade-item">
            <span>Монетка (рівень <span id="coin-level-display">${coinLevel}</span>)</span>
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
        lastTapTime = currentTime;
    }

    function createParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 15 + 5;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = `rgba(255, 215, 0, ${Math.random()})`;
            particle.style.borderRadius = '50%';
            particle.style.left = `${x - size / 2 + (Math.random() - 0.5) * 30}px`;
            particle.style.top = `${y - size / 2 + (Math.random() - 0.5) * 30}px`;
            particle.style.animation = `particle ${Math.random() * 1 + 0.5}s ease-out forwards`;
            particles.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }
    }

    function createScoreSplash(x, y, value) {
        const splash = document.createElement('div');
        splash.className = 'coin-splash';
        splash.textContent = `+${value}`;
        splash.style.left = `${x}px`;
        splash.style.top = `${y}px`;
        document.body.appendChild(splash);
        setTimeout(() => splash.remove(), 1000);
    }

    function updateUpgradeUI() {
        upgradePointsDisplay.textContent = upgradePoints;
        coinLevelDisplay.textContent = coinLevel;
        energyLevelDisplay.textContent = energyLevel;
        upgradeCoinButton.disabled = upgradePoints < 10;
        upgradeEnergyButton.disabled = upgradePoints < 10;
    }

    function saveUpgradeState() {
        localStorage.setItem('coinLevel', coinLevel.toString());
        localStorage.setItem('energyLevel', energyLevel.toString());
        localStorage.setItem('upgradePoints', upgradePoints.toString());
        localStorage.setItem('maxEnergy', maxEnergy.toString());
        localStorage.setItem('currentEnergy', currentEnergy.toString());
        localStorage.setItem('energyRegenRate', energyRegenRate.toString());
    }

    function endGame() {
        stopGame();
        finalScoreDisplay.textContent = score;
        endScreen.style.display = 'flex';
    }

    upgradeButton.addEventListener('click', () => {
        upgradeScreen.style.display = 'flex';
        updateUpgradeUI();
        stopGame();
    });

    closeUpgradeButton.addEventListener('click', () => {
        upgradeScreen.style.display = 'none';
        startGame();
    });

    upgradeCoinButton.addEventListener('click', () => {
        if (upgradePoints >= 10) {
            upgradePoints -= 10;
            coinLevel++;
            clickValue = baseClickValue * coinLevel;
            updateUpgradeUI();
            saveUpgradeState();
        }
    });

    upgradeEnergyButton.addEventListener('click', () => {
        if (upgradePoints >= 10) {
            upgradePoints -= 10;
            energyLevel++;
            maxEnergy = 50 + (energyLevel - 1) * 10;
            energyRegenRate = 0.5 + (energyLevel - 1) * 0.1;
            updateEnergyDisplay();
            updateUpgradeUI();
            saveUpgradeState();
        }
    });

 // Обробник для кліку по монеті
    coin.addEventListener('click', (e) => {
        if (!gameActive || currentEnergy <= 0) {
            if (currentEnergy <= 0) {
                coin.classList.add('disabled');
                setTimeout(() => coin.classList.remove('disabled'), 500);
            }
            return;
        }

        currentEnergy--;
        updateEnergyDisplay();

        const rect = coin.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        createParticles(x, y);
        createScoreSplash(x, y - 20, combo * clickValue);

        updateCombo();
        score += combo * clickValue;
        scoreDisplay.textContent = score;
        localStorage.setItem('tapka_score', score.toString());

        // Отримання очок прокачки
        if (score % 100 === 0 && score > 0) {
            upgradePoints++;
            updateUpgradeUI();
            saveUpgradeState();
            const splash = document.createElement('div');
            splash.className = 'coin-splash';
            splash.textContent = '+1 Очко!';
            splash.style.left = `${x}px`;
            splash.style.top = `${y - 40}px`;
            document.body.appendChild(splash);
            setTimeout(() => splash.remove(), 1000);
        }
    });

    startButton.addEventListener('click', () => {
        if (!gameActive) {
            startGame();
        }
    });

    sendScoreButton.addEventListener('click', () => {
        console.log('Відправка результату:', score);
        webApp.sendData(JSON.stringify({ score: score }));
        sendScoreButton.style.display = 'none';
        endGame();
    });

    playAgainButton.addEventListener('click', () => {
        localStorage.removeItem('tapka_score');
        localStorage.removeItem('coinLevel');
        localStorage.removeItem('energyLevel');
        localStorage.removeItem('upgradePoints');
        localStorage.removeItem('maxEnergy');
        localStorage.removeItem('currentEnergy');
        localStorage.removeItem('energyRegenRate');
        endScreen.style.display = 'none';
        startGame();
    });

    leaderboardButton.addEventListener('click', () => {
        alert('Функція рейтингу в розробці');
    });

    coin.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // Автоматичний старт гри
    startGame();
});

// Анімація частинок (додайте цей код у свій CSS файл style.css)
/*
@keyframes particle {
    0% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
    }
    100% {
        opacity: 0;
        transform: translate(Math.random() * 40 - 20 + 'px', -Math.random() * 60 - 30 + 'px') scale(Math.random() * 0.5 + 0.5);
    }
}
*/
