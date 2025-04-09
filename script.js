document.addEventListener('DOMContentLoaded', () => {
    // ... (існуючий код) ...

    // Змінні прокачки
    let coinLevel = parseInt(localStorage.getItem('coinLevel')) || 1;
    let energyLevel = parseInt(localStorage.getItem('energyLevel')) || 1;
    let upgradePoints = parseInt(localStorage.getItem('upgradePoints')) || 0;

    // Вплив рівнів на гру
    const baseClickValue = 1;
    let clickValue = baseClickValue * coinLevel;
    let maxEnergy = 50 + (energyLevel - 1) * 10;
    let energyRegenRate = 0.5 + (energyLevel - 1) * 0.1;

    // DOM елементи для прокачки
    const upgradeButton = document.createElement('button');
    upgradeButton.textContent = 'Прокачка';
    upgradeButton.className = 'bottom-button';
    document.querySelector('.footer').appendChild(upgradeButton);

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
    }

    upgradeButton.addEventListener('click', () => {
        upgradeScreen.style.display = 'flex';
        updateUpgradeUI();
        gameActive = false; // Зупиняємо гру під час прокачки
        stopEnergyRegen();
    });

    closeUpgradeButton.addEventListener('click', () => {
        upgradeScreen.style.display = 'none';
        gameActive = true; // Відновлюємо гру
        startEnergyRegen();
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
            updateEnergyDisplay(); // Оновлюємо відображення енергії з новими значеннями
            updateUpgradeUI();
            saveUpgradeState();
        }
    });

    // Оновлення обробника кліків по монеті
    coin.addEventListener('click', (e) => {
        if (!gameActive || currentEnergy <= 0) {
            // ... (існуюча логіка) ...
            return;
        }

        currentEnergy--;
        updateEnergyDisplay();

        const rect = coin.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        createParticles(x, y);
        createScoreSplash(x, y - 20, combo * clickValue); // Застосовуємо множник від прокачки монетки

        updateCombo();
        score += combo * clickValue; // Застосовуємо множник від прокачки монетки
        scoreDisplay.textContent = score;

        // ... (існуюча логіка анімації та збереження) ...

        // Отримання очок прокачки (наприклад, кожні 100 очок рахунку)
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

    // Оновлення функції startGame
    function startGame() {
        // Завантаження збереженого прогресу (включаючи рівні прокачки)
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

        // ... (існуюча логіка startGame) ...
        gameActive = true;
        startEnergyRegen();
    }

    // Оновлення функції endGame
    function endGame() {
        // ... (існуюча логіка endGame) ...
        saveUpgradeState(); // Зберігаємо рівні прокачки при завершенні гри
    }

    // ... (існуючі обробники подій) ...

    // Додавання стилів для прокачки (у style.css)
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText += `
        .upgrade-screen {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1D1C25;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            z-index: 100;
            width: 80%;
            max-width: 300px;
        }

        .upgrade-screen h2 {
            margin-top: 0;
            font-size: 24px;
            margin-bottom: 20px;
        }

        .upgrade-screen p {
            margin-bottom: 20px;
            font-size: 16px;
        }

        .upgrade-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .upgrade-item span {
            font-size: 16px;
        }

        .upgrade-item button {
            background: linear-gradient(45deg, #007bff, #6610f2);
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 15px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            outline: none;
        }

        .upgrade-item button:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }

        #close-upgrade-button {
            margin-top: 20px;
            background: #dc3545;
        }
    `;
    document.head.appendChild(styleSheet);

    // Автоматичний старт гри при відкритті
    startGame();
});
