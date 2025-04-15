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
    const upgradePointsDisplayElement = document.getElementById('upgrade-points-display');
    const coinLevelDisplayElement = document.getElementById('coin-level-display');
    const energyLevelDisplayElement = document.getElementById('energy-level-display');
    const upgradeCoinButtonElement = document.getElementById('upgrade-coin-button');
    const upgradeEnergyButtonElement = document.getElementById('upgrade-energy-button');
    const closeUpgradeButtonElement = document.getElementById('close-upgrade-button');
    console.log("DOM елементи отримано.");

    // Змінні гри
    let currentScore = 0;
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
    let availableUpgradePoints = parseInt(localStorage.getItem('availableUpgradePoints')) || 0;

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
            availableUpgradePoints = parseInt(localStorage.getItem('availableUpgradePoints')) || 0;
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
        try {
            clearInterval(energyRegenIntervalId);
            console.log("Відновлення енергії зупинено.");
        } catch (error) {
            console.error("Помилка при зупинці відновлення енергії:", error);
        }
    }

    function updateComboCounter() {
        try {
            const currentTime = Date.now();
            if (currentTime - lastTapTimeMs < 1000) {
                tapCount++;
                currentCombo = Math.min(5, Math.floor(tapCount / 3) + 1);
                comboCounterElement.textContent = `x${currentCombo}`;
                comboCounterElement.style.display = 'block';
                clearTimeout(comboTimeoutId);
                comboTimeoutId = setTimeout(() => {
                    currentCombo = 1;
                    tapCount = 0;
                    comboCounterElement.style.display = 'none';
                }, 2000);
            } else {
                currentCombo = 1;
                tapCount = 1;
                comboCounterElement.style.display = 'none';
            }
            lastTapTimeMs = currentTime;
        } catch (error) {
            console.error("Помилка при оновленні комбо-лічильника:", error);
        }
    }

    function spawnParticles(x, y) {
        try {
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
                particlesElement.appendChild(particle);
                setTimeout(() => particle.remove(), 1500);
            }
        } catch (error) {
            console.error("Помилка при створенні частинок:", error);
        }
    }

    function showScoreSplash(x, y, value) {
        try {
            const splash = document.createElement('div');
            splash.className = 'coin-splash';
            splash.textContent = `+${value}`;
            splash.style.left = `${x}px`;
            splash.style.top = `${y}px`;
            document.body.appendChild(splash);
            setTimeout(() => splash.remove(), 1000);
        } catch (error) {
            console.error("Помилка при відображенні сплеску рахунку:", error);
        }
    }

    function updateUpgradeScreenUI() {
        try {
            if (upgradePointsDisplayElement && coinLevelDisplayElement && energyLevelDisplayElement && upgradeCoinButtonElement && upgradeEnergyButtonElement) {
                upgradePointsDisplayElement.textContent = availableUpgradePoints;
                coinLevelDisplayElement.textContent = currentCoinLevel;
                energyLevelDisplayElement.textContent = currentEnergyLevelLevel;
                upgradeCoinButtonElement.disabled = availableUpgradePoints < 10;
                upgradeEnergyButtonElement.disabled = availableUpgradePoints < 10;
            }
        } catch (error) {
            console.error("Помилка при оновленні UI екрану прокачки:", error);
        }
    }

    function saveGameState() {
        try {
            localStorage.setItem('currentCoinLevel', currentCoinLevel.toString());
            localStorage.setItem('currentEnergyLevelLevel', currentEnergyLevelLevel.toString());
            localStorage.setItem('availableUpgradePoints', availableUpgradePoints.toString());
            localStorage.setItem('maximumEnergy', maximumEnergy.toString());
            localStorage.setItem('currentEnergyLevel', currentEnergyLevel.toString());
            localStorage.setItem('energyRegenerationRate', energyRegenerationRate.toString());
            localStorage.setItem('tapka_score', currentScore.toString());
            console.log("Стан гри збережено.");
        } catch (error) {
            console.error("Помилка при збереженні стану гри:", error);
        }
    }

    function handleGameOver() {
        try {
            stopGamePlay();
            finalScoreDisplayElement.textContent = currentScore;
            endScreenElement.style.display = 'flex';
            const userId = webApp.initDataUnsafe?.user?.id || 'anonymous';
            push(leaderboardRef, { userId: userId, score: currentScore });
            console.log("Гра завершена.");
        } catch (error) {
            console.error("Помилка при завершенні гри:", error);
        }
    }

    function displayLeaderboardData(leaderboardData) {
        try {
            if (leaderboardListElement) {
                leaderboardListElement.innerHTML = '';
                const sortedLeaderboard = Object.entries(leaderboardData)
                    .sort(([, a], [, b]) => b.score - a.score)
                    .slice(0, 10);

                sortedLeaderboard.forEach(([key, data], index) => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${index + 1}. Гравець: ${data.userId}, Рахунок: ${data.score}`;
                    leaderboardListElement.appendChild(listItem);
                });
            }
        } catch (error) {
            console.error("Помилка при відображенні рейтингу:", error);
        }
    }

    function fetchLeaderboardData() {
        try {
            if (leaderboardRef) {
                get(leaderboardRef)
                    .then((snapshot) => {
                        if (snapshot.exists()) {
                            displayLeaderboardData(snapshot.val());
                        } else {
                            if (leaderboardListElement) {
                                leaderboardListElement.innerHTML = 'Рейтинг порожній.';
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Помилка при отриманні рейтингу з Firebase:", error);
                        if (leaderboardListElement) {
                            leaderboardListElement.innerHTML = 'Не вдалося завантажити рейтинг.';
                        }
                    });
            }
        } catch (error) {
            console.error("Помилка у функції отримання рейтингу:", error);
        }
    }

    if (upgradeButtonElement) {
        upgradeButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Прокачка'.");
                if (upgradeScreenElement) {
                    upgradeScreenElement.style.display = 'flex';
                    updateUpgradeScreenUI();
                    stopGamePlay();
                }
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Прокачка':", error);
            }
        });
    }

    if (closeUpgradeButtonElement) {
        closeUpgradeButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Назад' на екрані прокачки.");
                if (upgradeScreenElement) {
                    upgradeScreenElement.style.display = 'none';
                    initializeGame();
                }
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Назад' на екрані прокачки:", error);
            }
        });
    }

    if (upgradeCoinButtonElement) {
        upgradeCoinButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Покращити монетку'.");
                if (availableUpgradePoints >= 10) {
                    availableUpgradePoints -= 10;
                    currentCoinLevel++;
                    tapValue = baseTapValue * currentCoinLevel;
                    updateUpgradeScreenUI();
                    saveGameState();
                }
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Покращити монетку':", error);
            }
        });
    }

    if (upgradeEnergyButtonElement) {
        upgradeEnergyButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Покращити енергію'.");
                if (availableUpgradePoints >= 10) {
                    availableUpgradePoints -= 10;
                    currentEnergyLevelLevel++;
                    maximumEnergy = 1000 + (currentEnergyLevelLevel - 1) * 100;
                    energyRegenerationRate = 0.5 + (currentEnergyLevelLevel - 1) * 0.1;
                    updateEnergyDisplayUI();
                    updateUpgradeScreenUI();
                    saveGameState();
                }
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

                if (currentScore % 100 === 0 && currentScore > 0) {
                    availableUpgradePoints++;
                    updateUpgradeScreenUI();
                    saveGameState();
                    const splash = document.createElement('div');
                    splash.className = 'coin-splash';
                    splash.textContent = '+1 Очко!';
                    splash.style.left = `${clickX}px`;
                    splash.style.top = `${clickY - 40}px`;
                    document.body.appendChild(splash);
                    setTimeout(() => splash.remove(), 1000);
                }
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
                localStorage.removeItem('availableUpgradePoints');
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
        console.log("Час останнього оновлення енергії збережено перед виходом.");
    });
});
