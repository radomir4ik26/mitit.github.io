import { push, get } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM повністю завантажено.");

    // Ініціалізація Telegram Web App
    const webApp = window.Telegram.WebApp;
    webApp.expand();
    console.log("Telegram Web App ініціалізовано.");

    // Отримання посилання на базу даних Firebase з глобальної змінної
    const database = window.firebaseDatabase;
    const leaderboardRef = window.firebaseLeaderboardRef;
    console.log("Посилання на Firebase отримано.");

    // Елементи DOM
    const coinElement = document.getElementById('coin');
    const scoreDisplayElement = document.getElementById('score');
    const comboCounterElement = document.getElementById('combo-counter');
    const leaderboardButtonElement = document.getElementById('leaderboardButton');
    const upgradeButtonElement = document.getElementById('upgradeButton');
    const particlesElement = document.getElementById('particles');
    const endScreenElement = document.getElementById('endScreen');
    const finalScoreDisplayElement = document.getElementById('finalScore');
    const sendScoreButtonElement = document.getElementById('sendScoreButton');
    const playAgainButtonElement = document.getElementById('playAgainButton');
    const upgradeScreenElement = document.getElementById('upgradeScreen');
    const energyDisplayElement = document.querySelector('.energy-display');
    const leaderboardScreenElement = document.getElementById('leaderboardScreen');
    const leaderboardListElement = document.getElementById('leaderboard-list');
    const closeLeaderboardButtonElement = document.getElementById('close-leaderboard-button');
    const upgradePointsDisplayElement = document.getElementById('upgrade-points-display'); // Тепер показує монети
    const coinLevelDisplayElement = document.getElementById('coin-level-display');
    const energyLevelDisplayElement = document.getElementById('energy-level-display');
    const upgradeCoinButtonElement = document.getElementById('upgrade-coin-button');
    const upgradeEnergyButtonElement = document.getElementById('upgrade-energy-button');
    const closeUpgradeButtonElement = document.getElementById('close-upgrade-button');
    const upgradeCoinCostElement = document.getElementById('upgrade-coin-cost');
    const upgradeEnergyCostElement = document.getElementById('upgrade-energy-cost');
    console.log("DOM елементи отримано.");

    // Змінні гри
    let currentScore = 0; // Тепер це і є кількість монет
    let currentCombo = 1;
    let comboTimeoutId;
    let isGameActive = false;
    let lastTapTimeMs = 0;
    let tapCount = 0;

    // Змінні енергії
    let maximumEnergy = parseInt(localStorage.getItem('maximumEnergy')) || 1000;
    let currentEnergyLevel = parseInt(localStorage.getItem('currentEnergyLevel')) || maximumEnergy;
    let energyRegenerationRate = parseFloat(localStorage.getItem('energyRegenerationRate')) || 0.5;
    let energyRegenIntervalId;

    // Змінні прокачки
    let currentCoinLevel = parseInt(localStorage.getItem('currentCoinLevel')) || 1;
    let currentEnergyLevelLevel = parseInt(localStorage.getItem('currentEnergyLevelLevel')) || 1;
    const upgradeCost = 1000; // Вартість одного рівня прокачки

    // Вплив рівнів на гру
    const baseTapValue = 1;
    let tapValue = baseTapValue * currentCoinLevel;

    function calculateOfflineEnergyRegen() {
        try {
            const lastEnergyUpdateTimestamp = localStorage.getItem('lastEnergyUpdateTimestamp');
            if (lastEnergyUpdateTimestamp) {
                const timeDifferenceSeconds = (Date.now() - parseInt(lastEnergyUpdateTimestamp)) / 1000;
                const offlineEnergyGained = timeDifferenceSeconds * energyRegenerationRate;
                currentEnergyLevel = Math.min(maximumEnergy, currentEnergyLevel + offlineEnergyGained);
                localStorage.setItem('currentEnergyLevel', currentEnergyLevel.toString());
                console.log("Енергія відновлена в оффлайні:", offlineEnergyGained);
            }
        } catch (error) {
            console.error("Помилка при розрахунку оффлайн відновлення енергії:", error);
        }
    }

    function initializeGame() {
        try {
            console.log("Ініціалізація гри.");
            const savedScore = localStorage.getItem('tapka_score');
            currentScore = savedScore ? parseInt(savedScore) : 0;
            scoreDisplayElement.textContent = currentScore;
            currentCoinLevel = parseInt(localStorage.getItem('currentCoinLevel')) || 1;
            currentEnergyLevelLevel = parseInt(localStorage.getItem('currentEnergyLevelLevel')) || 1;
            tapValue = baseTapValue * currentCoinLevel;
            maximumEnergy = 1000 + (currentEnergyLevelLevel - 1) * 100;
            energyRegenerationRate = 0.5 + (currentEnergyLevelLevel - 1) * 0.1;
            updateEnergyDisplayUI();
            updateUpgradeScreenUI();
            calculateOfflineEnergyRegen();
            updateEnergyDisplayUI();
            isGameActive = true;
            startEnergyRegeneration();
            if (coinElement) coinElement.classList.remove('disabled');
            console.log("Гра ініціалізована.");
        } catch (error) {
            console.error("Помилка при ініціалізації гри:", error);
        }
    }

    function stopGamePlay() {
        try {
            console.log("Зупинка гри.");
            isGameActive = false;
            stopEnergyRegeneration();
            console.log("Гру зупинено.");
        } catch (error) {
            console.error("Помилка при зупинці гри:", error);
        }
    }

    function updateEnergyDisplayUI() {
        try {
            if (energyDisplayElement) {
                energyDisplayElement.textContent = `Енергія: ${Math.floor(currentEnergyLevel)}`;
                if (currentEnergyLevel <= 0 && isGameActive) {
                    if (coinElement) coinElement.classList.add('disabled');
                } else if (currentEnergyLevel > 0) {
                    if (coinElement) coinElement.classList.remove('disabled');
                }
            }
        } catch (error) {
            console.error("Помилка при оновленні відображення енергії:", error);
        }
    }

    function startEnergyRegeneration() {
        try {
            energyRegenIntervalId = setInterval(() => {
                if (currentEnergyLevel < maximumEnergy && isGameActive) {
                    currentEnergyLevel += energyRegenerationRate / 10;
                    updateEnergyDisplayUI();
                    localStorage.setItem('currentEnergyLevel', currentEnergyLevel.toString());
                }
                localStorage.setItem('lastEnergyUpdateTimestamp', Date.now().toString());
            }, 100);
            console.log("Відновлення енергії запущено.");
        } catch (error) {
            console.error("Помилка при запуску відновлення енергії:", error);
        }
    }

    function stopEnergyRegeneration() {
        try
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Покращити енергію':", error);
            }
        });
    }

    if (coinElement) {
        coinElement.addEventListener('click', (event) => {
            try {
                if (!isGameActive || currentEnergyLevel <= 0) {
                    return;
                }

                currentEnergyLevel--;
                updateEnergyDisplayUI();

                const rect = coinElement.getBoundingClientRect();
                const clickX = event.clientX;
                const clickY = event.clientY;

                spawnParticles(clickX, clickY);
                showScoreSplash(clickX, clickY - 20, currentCombo * tapValue);

                updateComboCounter();
                currentScore += currentCombo * tapValue;
                scoreDisplayElement.textContent = currentScore;
                localStorage.setItem('tapka_score', currentScore.toString());
            } catch (error) {
                console.error("Помилка в обробнику кліку по монетці:", error);
            }
        });

        coinElement.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });
    }

    if (sendScoreButtonElement) {
        sendScoreButtonElement.addEventListener('click', () => {
            try {
                console.log('Натиснуто кнопку "Відправити результат":', currentScore);
                webApp.sendData(JSON.stringify({ score: currentScore }));
                sendScoreButtonElement.style.display = 'none';
                handleGameOver();
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Відправити результат':", error);
            }
        });
    }

    if (playAgainButtonElement) {
        playAgainButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Грати знову'.");
                localStorage.removeItem('tapka_score');
                localStorage.removeItem('currentCoinLevel');
                localStorage.removeItem('currentEnergyLevelLevel');
                localStorage.removeItem('maximumEnergy');
                localStorage.removeItem('currentEnergyLevel');
                localStorage.removeItem('energyRegenerationRate');
                localStorage.removeItem('lastEnergyUpdateTimestamp');
                endScreenElement.style.display = 'none';
                initializeGame();
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Грати знову':", error);
            }
        });
    }

    if (leaderboardButtonElement) {
        leaderboardButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Рейтинг'.");
                if (leaderboardScreenElement) {
                    leaderboardScreenElement.style.display = 'flex';
                    fetchLeaderboardData();
                    stopGamePlay();
                }
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Рейтинг':", error);
            }
        });
    }

    if (closeLeaderboardButtonElement) {
        closeLeaderboardButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Назад' на екрані рейтингу.");
                if (leaderboardScreenElement) {
                    leaderboardScreenElement.style.display = 'none';
                    initializeGame();
                }
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Назад' на екрані рейтингу:", error);
            }
        });
    }

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    calculateOfflineEnergyRegen();
    updateEnergyDisplayUI();
    initializeGame();

    window.addEventListener('beforeunload', () => {
        localStorage.setItem('lastEnergyUpdateTimestamp', Date.now().toString());
        localStorage.setItem('tapka_score', currentScore.toString()); // Зберігаємо поточний рахунок монет
        localStorage.setItem('currentCoinLevel', currentCoinLevel.toString());
        localStorage.setItem('currentEnergyLevelLevel', currentEnergyLevelLevel.toString());
        localStorage.setItem('maximumEnergy', maximumEnergy.toString());
        localStorage.setItem('currentEnergyLevel', currentEnergyLevel.toString());
        localStorage.setItem('energyRegenerationRate', energyRegenerationRate.toString());
        console.log("Стан гри збережено перед виходом.");
    });
});
