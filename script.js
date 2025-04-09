document.addEventListener('DOMContentLoaded', () => {
    // Ініціалізація Telegram Web App
    const webApp = window.Telegram.WebApp;
    webApp.expand();

    // Елементи DOM
    const coin = document.getElementById('coin');
    const scoreDisplay = document.getElementById('score');
    const comboCounter = document.getElementById('combo-counter');
    const timerDisplay = document.getElementById('timer');
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
    let gameTime = 30; // Час гри в секундах
    let timeLeft = gameTime;
    let gameTimer;
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
        score = 0;
        combo = 1;
        scoreDisplay.textContent = score;
        timeLeft = gameTime;
        updateTimerDisplay();
        currentEnergy = maxEnergy; // Відновлюємо енергію на початку гри
        updateEnergyDisplay();

        coin.classList.add('pulse');
        coin.classList.remove('disabled');
        timerDisplay.style.display = 'block';
        comboCounter.style.display = 'none';
        endScreen.style.display = 'none';

        gameActive = true;
        startEnergyRegen(); // Запускаємо відновлення енергії

        gameTimer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // Оновлення відображення таймера
    function updateTimerDisplay() {
        timerDisplay.textContent = `${timeLeft}s`;
    }

    // Функція для завершення гри
    function endGame() {
        clearInterval(gameTimer);
        gameActive = false;
        coin.classList.remove('pulse');
        stopEnergyRegen(); // Зупиняємо відновлення енергії

        finalScoreDisplay.textContent = score;
        endScreen.style.display = 'flex';

        webApp.sendData(JSON.stringify({ score: score })); // Надсилаємо фінальний рахунок
        sendScoreButton.style.display = 'none'; // Приховуємо кнопку відправки
    }

    // Створення частинок при натисканні
    function createParticles(x, y) {
        const particleCount = 10;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Випадковий розмір і колір
            const size = Math.random() * 8 + 2;
            const hue = Math.random() * 30 + 45; // Відтінки золотого

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = `hsl(${hue}, 100%, 60%)`;

            // Встановлення початкового положення
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;

            particles.appendChild(particle);

            // Анімація частинок
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 3 + 1;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            let posX = x;
            let posY = y;
            let opacity = 1;

            const animate = () => {
                if (opacity <= 0) {
                    particle.remove();
                    return;
                }

                posX += vx;
                posY += vy - 0.5; // Легка гравітація
                opacity -= 0.02;

                particle.style.left = `${posX}px`;
                particle.style.top = `${posY}px`;
                particle.style.opacity = opacity;

                requestAnimationFrame(animate);
            };

            requestAnimationFrame(animate);
        }
    }

    // Створення анімації "+1" при натисканні
    function createScoreSplash(x, y, value) {
        const splash = document.createElement('div');
        splash.className = 'coin-splash';
        splash.textContent = `+${value}`;
        splash.style.left = `${x}px`;
        splash.style.top = `${y}px`;

        document.body.appendChild(splash);

        // Видалення елемента після анімації
        setTimeout(() => {
            splash.remove();
        }, 800);
    }

    // Оновлення комбо
    function updateCombo() {
        clearTimeout(comboTimeout);

        if (Date.now() - lastTapTime < 300) {
            consecutiveTaps++;

            if (consecutiveTaps >= 3) {
                combo = Math.min(5, Math.floor(consecutiveTaps / 3) + 1);
                comboCounter.textContent = `Combo x${combo}`;
                comboCounter.style.display = 'block';
            }
        } else {
            consecutiveTaps = 1;
        }

        lastTapTime = Date.now();

        // Скидання комбо після паузи
        comboTimeout = setTimeout(() => {
            combo = 1;
            consecutiveTaps = 0;
            comboCounter.style.display = 'none';
        }, 1500);
    }

    // Обробник для кліку по монеті
    coin.addEventListener('click', (e) => {
        if (!gameActive || currentEnergy <= 0) {
            if (currentEnergy <= 0) {
                coin.classList.add('disabled'); // Візуальний зворотний зв'язок
                setTimeout(() => coin.classList.remove('disabled'), 500);
            }
            return;
        }

        currentEnergy--;
        updateEnergyDisplay();

        const rect = coin.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        // Створення візуальних ефектів
        createParticles(x, y);
        createScoreSplash(x, y - 20, combo);

        // Оновлення рахунку та комбо
        updateCombo();
        score += combo;
        scoreDisplay.textContent = score;

        // Анімація натискання
        coin.style.transform = 'scale(0.95)';
        setTimeout(() => {
            coin.style.transform = 'scale(1)';
        }, 100);
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

        // Відправка даних назад до бота
        webApp.sendData(JSON.stringify({
            score: score
        }));

        // Приховуємо кнопку після відправки
        sendScoreButton.style.display = 'none';
    });

    // Обробник для кнопки "Грати знову"
    playAgainButton.addEventListener('click', () => {
        endScreen.style.display = 'none';
        startGame();
    });

    // Обробник для кнопки "Рейтинг"
    leaderboardButton.addEventListener('click', () => {
        // Тут ми пізніше додамо логіку отримання та відображення рейтингу
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
    setTimeout(() => {
        startButton.click();
    }, 500);
});
