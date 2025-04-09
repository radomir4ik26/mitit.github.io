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
    let maxEnergy = 50;
    let currentEnergy = maxEnergy;
    let energyRegenRate = 0.5; // Енергії в секунду
    let energyTimer;
    const energyDisplay = document.createElement('div');
    energyDisplay.className = 'energy-display';
    document.querySelector('.header').appendChild(energyDisplay);

    function updateEnergyDisplay() {
        energyDisplay.textContent = `Енергія: ${Math.floor(currentEnergy)}`;
    }

    function startEnergyRegen() {
        energyTimer = setInterval(() => {
            if (currentEnergy < maxEnergy && gameActive) {
                currentEnergy += energyRegenRate / 10; // Оновлюємо кожні 100мс
                updateEnergyDisplay();
            }
        }, 100);
    }

    function stopEnergyRegen() {
        clearInterval(energyTimer);
    }

    // Функція для запуску гри
    function startGame() {
        // Завантаження збереженого прогресу
        const savedScore = localStorage.getItem('tapka_score');
        score = savedScore ? parseInt(savedScore) : 0;
        scoreDisplay.textContent = score;

        combo = 1;
        currentEnergy = maxEnergy;
        updateEnergyDisplay();

        coin.classList.add('pulse');
        coin.classList.remove('disabled');
        comboCounter.style.display = 'none';
        endScreen.style.display = 'none';

        gameActive = true;
        startEnergyRegen(); // Запускаємо відновлення енергії
    }

    // Функція для завершення гри (тепер використовується для збереження)
    function endGame() {
        gameActive = false;
        coin.classList.remove('pulse');
        stopEnergyRegen(); // Зупиняємо відновлення енергії

        // Збереження прогресу
        localStorage.setItem('tapka_score', score.toString());
        console.log('Прогрес збережено:', score);

        finalScoreDisplay.textContent = score;
        endScreen.style.display = 'flex';
        sendScoreButton.style.display = 'none'; // Приховуємо кнопку відправки
    }

    // Створення частинок при натисканні
    function createParticles(x, y) {
        // ... (код без змін) ...
    }

    // Створення анімації "+1" при натисканні
    function createScoreSplash(x, y, value) {
        // ... (код без змін) ...
    }

    // Оновлення комбо
    function updateCombo() {
        // ... (код без змін) ...
    }

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
        createScoreSplash(x, y - 20, combo);

        updateCombo();
        score += combo;
        scoreDisplay.textContent = score;

        coin.style.transform = 'scale(0.95)';
        setTimeout(() => {
            coin.style.transform = 'scale(1)';
        }, 100);

        // Автоматичне збереження прогресу кожні кілька кліків
        if (score % 10 === 0) {
            localStorage.setItem('tapka_score', score.toString());
            console.log('Автоматичне збереження прогресу:', score);
        }
    });

    // Обробник для кнопки "Старт"
    startButton.addEventListener('click', () => {
        if (!gameActive) {
            startGame();
        }
    });

    // Обробник для кнопки "Відправити результат"
    sendScoreButton.addEventListener('click', () => {
        console.log('Відправка результату:', score);
        webApp.sendData(JSON.stringify({ score: score }));
        sendScoreButton.style.display = 'none';
        endGame(); // Зберігаємо прогрес перед відправкою
    });

    // Обробник для кнопки "Грати знову"
    playAgainButton.addEventListener('click', () => {
        localStorage.removeItem('tapka_score'); // Очищаємо збережений прогрес
        endScreen.style.display = 'none';
        startGame();
    });

    // Обробник для кнопки "Рейтинг"
    leaderboardButton.addEventListener('click', () => {
        alert('Функція рейтингу в розробці');
    });

    // Запобігання перетягуванню монети
    coin.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });

    // Запобігання масштабуванню на мобільних пристроях
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // Додавання стилів для відображення енергії
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
        .energy-display {
            position: absolute;
            top: 15px;
            left: 15px;
            font-size: 16px;
            font-weight: bold;
            background: rgba(255, 255, 255, 0.1);
            padding: 8px 12px;
            border-radius: 15px;
            z-index: 10;
        }
        .coin.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(styleSheet);

    // Автоматичний старт гри при відкритті
    startGame(); // Запускаємо гру та завантажуємо прогрес
});
