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
    const tasksButtonElement = document.getElementById('tasksButton');
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
    const tasksScreenElement = document.getElementById('tasksScreen');
    const closeTasksButtonElement = document.getElementById('close-tasks-button');
    const subscribeTaskButtonElement = document.getElementById('subscribe-task-button');
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
    
    // Нова логіка для збільшення вартості прокачки
    const calculateUpgradeCost = (level) => {
        return Math.floor(1000 * Math.pow(1.5, level - 1));
    };
    
    // Вартість прокачки для кожного з параметрів
    let coinUpgradeCost = calculateUpgradeCost(currentCoinLevel);
    let energyUpgradeCost = calculateUpgradeCost(currentEnergyLevelLevel);

    // Статус завдань
    let isSubscribeTaskCompleted = localStorage.getItem('isSubscribeTaskCompleted') === 'true';

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
            coinUpgradeCost = calculateUpgradeCost(currentCoinLevel);
            energyUpgradeCost = calculateUpgradeCost(currentEnergyLevelLevel);
            tapValue = baseTapValue * currentCoinLevel;
            maximumEnergy = 1000 + (currentEnergyLevelLevel - 1) * 100;
            energyRegenerationRate = 0.5 + (currentEnergyLevelLevel - 1) * 0.1;
            isSubscribeTaskCompleted = localStorage.getItem('isSubscribeTaskCompleted') === 'true';
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
            if (upgradePointsDisplayElement && coinLevelDisplayElement && energyLevelDisplayElement && upgradeCoinButtonElement && upgradeEnergyButtonElement && upgradeCoinCostElement && upgradeEnergyCostElement) {
                upgradePointsDisplayElement.textContent = currentScore; // Показуємо поточні монети
                coinLevelDisplayElement.textContent = currentCoinLevel;
                energyLevelDisplayElement.textContent = currentEnergyLevelLevel;
                upgradeCoinCostElement.textContent = coinUpgradeCost;
                upgradeEnergyCostElement.textContent = energyUpgradeCost;
                upgradeCoinButtonElement.disabled = currentScore < coinUpgradeCost;
                upgradeEnergyButtonElement.disabled = currentScore < energyUpgradeCost;
            }
        } catch (error) {
            console.error("Помилка при оновленні UI екрану прокачки:", error);
        }
    }

    function updateTasksScreenUI() {
        try {
            if (subscribeTaskButtonElement) {
                if (isSubscribeTaskCompleted) {
                    subscribeTaskButtonElement.disabled = true;
                    subscribeTaskButtonElement.textContent = "Виконано";
                } else {
                    subscribeTaskButtonElement.disabled = false;
                    subscribeTaskButtonElement.textContent = "Підписатись (+100,000 монет)";
                }
            }
        } catch (error) {
            console.error("Помилка при оновленні UI екрану завдань:", error);
        }
    }

    function saveGameState() {
        try {
            localStorage.setItem('currentCoinLevel', currentCoinLevel.toString());
            localStorage.setItem('currentEnergyLevelLevel', currentEnergyLevelLevel.toString());
            localStorage.setItem('maximumEnergy', maximumEnergy.toString());
            localStorage.setItem('currentEnergyLevel', currentEnergyLevel.toString());
            localStorage.setItem('energyRegenerationRate', energyRegenerationRate.toString());
            localStorage.setItem('tapka_score', currentScore.toString());
            localStorage.setItem('isSubscribeTaskCompleted', isSubscribeTaskCompleted.toString());
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

    // Функція для відкриття посилання на Telegram
    function openTelegramChannel() {
        try {
            window.open('https://t.me/mititcoin', '_blank');
            isSubscribeTaskCompleted = true;
            currentScore += 100000; // Додаємо 100к монет за підписку
            scoreDisplayElement.textContent = currentScore;
            saveGameState();
            updateTasksScreenUI();
            
            // Показуємо повідомлення про нагороду
            const rewardMessage = document.createElement('div');
            rewardMessage.className = 'reward-message';
            rewardMessage.textContent = '+100,000 монет!';
            document.body.appendChild(rewardMessage);
            
            // Видаляємо повідомлення після показу
            setTimeout(() => {
                rewardMessage.remove();
            }, 3000);
            
            console.log("Завдання на підписку виконано, додано 100000 монет");
        } catch (error) {
            console.error("Помилка при відкритті каналу Telegram:", error);
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

    if (tasksButtonElement) {
        tasksButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Завдання'.");
                if (tasksScreenElement) {
                    tasksScreenElement.style.display = 'flex';
                    updateTasksScreenUI();
                    stopGamePlay();
                }
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Завдання':", error);
            }
        });
    }

    if (closeTasksButtonElement) {
        closeTasksButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Назад' на екрані завдань.");
                if (tasksScreenElement) {
                    tasksScreenElement.style.display = 'none';
                    initializeGame();
                }
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Назад' на екрані завдань:", error);
            }
        });
    }

    if (subscribeTaskButtonElement) {
        subscribeTaskButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Підписатись'.");
                if (!isSubscribeTaskCompleted) {
                    openTelegramChannel();
                }
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Підписатись':", error);
            }
        });
    }

    if (upgradeCoinButtonElement) {
        upgradeCoinButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Покращити монетку'.");
                if (currentScore >= coinUpgradeCost) {
                    currentScore -= coinUpgradeCost;
                    currentCoinLevel++;
                    coinUpgradeCost = calculateUpgradeCost(currentCoinLevel);
                    tapValue = baseTapValue * currentCoinLevel;
                    updateUpgradeScreenUI();
                    saveGameState();
                    scoreDisplayElement.textContent = currentScore; // Оновлюємо відображення монет
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
                if (currentScore >= energyUpgradeCost) {
                    currentScore -= energyUpgradeCost;
                    currentEnergyLevelLevel++;
                    energyUpgradeCost = calculateUpgradeCost(currentEnergyLevelLevel);
                    maximumEnergy = 1000 + (currentEnergyLevelLevel - 1) * 100;
                    energyRegenerationRate = 0.5 + (currentEnergyLevelLevel - 1) * 0.1;
                    updateEnergyDisplayUI();
                    updateUpgradeScreenUI();
                    saveGameState();
                    scoreDisplayElement.textContent = currentScore; // Оновлюємо відображення монет
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
            } catch (error) {
                console.error("Помилка в обробнику кліку по монетці:", error);
            }
        });
    }

    if (coinElement) {
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
                localStorage.removeItem('isSubscribeTaskCompleted');
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
        localStorage.setItem('isSubscribeTaskCompleted', isSubscribeTaskCompleted.toString());
        console.log("Стан гри збережено перед виходом.");
    });
});import { push, get } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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
    const tasksButtonElement = document.getElementById('tasksButton');
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
    const tasksScreenElement = document.getElementById('tasksScreen');
    const closeTasksButtonElement = document.getElementById('close-tasks-button');
    const subscribeTaskButtonElement = document.getElementById('subscribe-task-button');
    const inviteFriendButtonElement = document.getElementById('invite-friend-button');
    const dailyBonusButtonElement = document.getElementById('daily-bonus-button');
    console.log("DOM елементи отримано.");

    // Змінні гри
    let currentScore = 0; // Тепер це і є кількість монет
    let currentCombo = 1;
    let comboTimeoutId;
    let isGameActive = false;
    let lastTapTimeMs = 0;
    let tapCount = 0;
    let multiTapEnabled = false; // Нова змінна для мульті-тап
    let multiTapInterval = null; // Інтервал для мульті-тап
    let multiTapLastUpdate = 0; // Останнє оновлення мульті-тап

    // Змінні енергії
    let maximumEnergy = parseInt(localStorage.getItem('maximumEnergy')) || 1000;
    let currentEnergyLevel = parseInt(localStorage.getItem('currentEnergyLevel')) || maximumEnergy;
    let energyRegenerationRate = parseFloat(localStorage.getItem('energyRegenerationRate')) || 0.5;
    let energyRegenIntervalId;

    // Змінні прокачки
    let currentCoinLevel = parseInt(localStorage.getItem('currentCoinLevel')) || 1;
    let currentEnergyLevelLevel = parseInt(localStorage.getItem('currentEnergyLevelLevel')) || 1;
    let multiTapLevel = parseInt(localStorage.getItem('multiTapLevel')) || 0; // Рівень прокачки мульті-тап
    
    // Нова логіка для збільшення вартості прокачки
    const calculateUpgradeCost = (level) => {
        return Math.floor(1000 * Math.pow(1.5, level - 1));
    };
    
    // Вартість прокачки для кожного з параметрів
    let coinUpgradeCost = calculateUpgradeCost(currentCoinLevel);
    let energyUpgradeCost = calculateUpgradeCost(currentEnergyLevelLevel);
    let multiTapUpgradeCost = calculateUpgradeCost(multiTapLevel + 1) * 2; // Мульті-тап дорожче

    // Статус завдань
    let isSubscribeTaskCompleted = localStorage.getItem('isSubscribeTaskCompleted') === 'true';
    let isInviteFriendTaskCompleted = localStorage.getItem('isInviteFriendTaskCompleted') === 'true';
    let lastDailyBonusDate = localStorage.getItem('lastDailyBonusDate') || ''; // Дата останнього отримання бонусу
    
    // Прогрес для нового завдання "Зберіть 10,000 монет за одну сесію"
    let sessionCoins = 0;
    let sessionTask10kCompleted = localStorage.getItem('sessionTask10kCompleted') === 'true';
    
    // Прогрес для завдання "Досягніть комбо x5"
    let maxComboReached = parseInt(localStorage.getItem('maxComboReached')) || 1;
    let comboTask5xCompleted = localStorage.getItem('comboTask5xCompleted') === 'true';

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

    // Функція для активації автоматичного збору монет (мульті-тап)
    function startAutoTap() {
        if (multiTapLevel > 0 && !multiTapInterval) {
            multiTapInterval = setInterval(() => {
                if (isGameActive && currentEnergyLevel > 0) {
                    // Авто-тап збирає за принципом 1 тап в секунду за кожен рівень прокачки
                    const autoTapValue = multiTapLevel * tapValue;
                    currentScore += autoTapValue;
                    scoreDisplayElement.textContent = currentScore;
                    
                    // Створюємо ефект авто-тапу раз в секунду
                    if (Date.now() - multiTapLastUpdate > 1000) {
                        const centerX = window.innerWidth / 2;
                        const centerY = window.innerHeight / 2;
                        showScoreSplash(centerX, centerY - 50, `АВТО: +${autoTapValue}`);
                        multiTapLastUpdate = Date.now();
                    }
                    
                    // Витрата енергії на авто-тап менша
                    currentEnergyLevel -= 0.1;
                    updateEnergyDisplayUI();
                    
                    // Оновлення прогресу завдання з 10k монет
                    sessionCoins += autoTapValue;
                    checkSessionTask();
                    
                    localStorage.setItem('tapka_score', currentScore.toString());
                }
            }, 100); // 10 разів на секунду перевіряємо
        }
    }

    function stopAutoTap() {
        if (multiTapInterval) {
            clearInterval(multiTapInterval);
            multiTapInterval = null;
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
            multiTapLevel = parseInt(localStorage.getItem('multiTapLevel')) || 0;
            coinUpgradeCost = calculateUpgradeCost(currentCoinLevel);
            energyUpgradeCost = calculateUpgradeCost(currentEnergyLevelLevel);
            multiTapUpgradeCost = calculateUpgradeCost(multiTapLevel + 1) * 2; // Мульті-тап дорожче
            tapValue = baseTapValue * currentCoinLevel;
            maximumEnergy = 1000 + (currentEnergyLevelLevel - 1) * 100;
            energyRegenerationRate = 0.5 + (currentEnergyLevelLevel - 1) * 0.1;
            isSubscribeTaskCompleted = localStorage.getItem('isSubscribeTaskCompleted') === 'true';
            isInviteFriendTaskCompleted = localStorage.getItem('isInviteFriendTaskCompleted') === 'true';
            lastDailyBonusDate = localStorage.getItem('lastDailyBonusDate') || '';
            sessionTask10kCompleted = localStorage.getItem('sessionTask10kCompleted') === 'true';
            comboTask5xCompleted = localStorage.getItem('comboTask5xCompleted') === 'true';
            maxComboReached = parseInt(localStorage.getItem('maxComboReached')) || 1;
            sessionCoins = 0; // Обнуляємо лічильник монет за сесію
            updateEnergyDisplayUI();
            updateUpgradeScreenUI();
            updateTasksScreenUI();
            calculateOfflineEnergyRegen();
            updateEnergyDisplayUI();
            isGameActive = true;
            startEnergyRegeneration();
            startAutoTap(); // Запускаємо авто-тап, якщо він прокачаний
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
            stopAutoTap();
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
            if (currentTime - lastTapTimeMs < 750) { // Зменшений час між тапами для комбо
                tapCount++;
                const newCombo = Math.min(10, Math.floor(tapCount / 2) + 1); // Швидше росте до x10
                if (newCombo !== currentCombo) {
                    currentCombo = newCombo;
                    // Перевірка досягнення на комбо х5
                    if (currentCombo >= 5 && !comboTask5xCompleted) {
                        comboTask5xCompleted = true;
                        localStorage.setItem('comboTask5xCompleted', 'true');
                        currentScore += 25000; // Бонус 25к монет за досягнення комбо x5
                        scoreDisplayElement.textContent = currentScore;
                        showTaskCompleteMessage("Комбо x5 досягнуто! +25,000 монет");
                        updateTasksScreenUI();
                    }
                    
                    // Запам'ятовуємо найвищий рівень комбо
                    if (currentCombo > maxComboReached) {
                        maxComboReached = currentCombo;
                        localStorage.setItem('maxComboReached', maxComboReached.toString());
                    }
                }
                comboCounterElement.textContent = `Combo x${currentCombo}`;
                comboCounterElement.style.display = 'block';
                clearTimeout(comboTimeoutId);
                comboTimeoutId = setTimeout(() => {
                    currentCombo = 1;
                    tapCount = 0;
                    comboCounterElement.style.display = 'none';
                }, 1500); // Зменшений час утримання комбо
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
            // Збільшена кількість частинок при вищому комбо
            const particleCount = 5 + (currentCombo * 2);
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                const size = Math.random() * 15 + 5;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                // Різні кольори частинок залежно від комбо
                const colors = ['rgba(255, 215, 0, ', 'rgba(255, 165, 0, ', 'rgba(255, 140, 0, '];
                const selectedColor = (currentCombo > 3) ? colors[Math.floor(Math.random() * colors.length)] : colors[0];
                particle.style.background = `${selectedColor}${Math.random()})`;
                particle.style.borderRadius = '50%';
                particle.style.left = `${x - size / 2 + (Math.random() - 0.5) * 40}px`;
                particle.style.top = `${y - size / 2 + (Math.random() - 0.5) * 40}px`;
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
            if (typeof value === 'string') {
                splash.textContent = value;
            } else {
                splash.textContent = `+${value}`;
            }
            splash.style.left = `${x}px`;
            splash.style.top = `${y}px`;
            // Збільшений розмір і яскравість для вищого комбо
            if (currentCombo > 1) {
                splash.style.fontSize = `${18 + currentCombo * 2}px`;
                splash.style.color = `rgb(255, ${255 - currentCombo * 20}, 0)`;
            }
            document.body.appendChild(splash);
            setTimeout(() => splash.remove(), 1000);
        } catch (error) {
            console.error("Помилка при відображенні сплеску рахунку:", error);
        }
    }
    
    // Функція для показу повідомлення про виконане завдання
    function showTaskCompleteMessage(message) {
        try {
            const messageElement = document.createElement('div');
            messageElement.className = 'task-complete-message';
            messageElement.textContent = message;
            document.body.appendChild(messageElement);
            
            // Анімація появи і зникнення
            setTimeout(() => {
                messageElement.classList.add('show');
                
                setTimeout(() => {
                    messageElement.classList.remove('show');
                    setTimeout(() => messageElement.remove(), 1000);
                }, 3000);
            }, 100);
        } catch (error) {
            console.error("Помилка при показі повідомлення про завдання:", error);
        }
    }
    
    // Функція перевірки завдання 10k монет за сесію
    function checkSessionTask() {
        if (sessionCoins >= 10000 && !sessionTask10kCompleted) {
            sessionTask10kCompleted = true;
            localStorage.setItem('sessionTask10kCompleted', 'true');
            currentScore += 50000; // Бонус 50к монет
            scoreDisplayElement.textContent = currentScore;
            showTaskCompleteMessage("Зібрано 10,000 за сесію! +50,000 монет");
            updateTasksScreenUI();
        }
    }

    function updateUpgradeScreenUI() {
        try {
            if (upgradePointsDisplayElement && coinLevelDisplayElement && energyLevelDisplayElement && upgradeCoinButtonElement && upgradeEnergyButtonElement && upgradeCoinCostElement && upgradeEnergyCostElement) {
                upgradePointsDisplayElement.textContent = currentScore; // Показуємо поточні монети
                coinLevelDisplayElement.textContent = currentCoinLevel;
                energyLevelDisplayElement.textContent = currentEnergyLevelLevel;
                upgradeCoinCostElement.textContent = coinUpgradeCost;
                upgradeEnergyCostElement.textContent = energyUpgradeCost;
                upgradeCoinButtonElement.disabled = currentScore < coinUpgradeCost;
                upgradeEnergyButtonElement.disabled = currentScore < energyUpgradeCost;
                
                // Додаємо відображення мульті-тап
                const multiTapLevelDisplay = document.getElementById('multi-tap-level-display');
                const upgradeMultiTapButton = document.getElementById('upgrade-multi-tap-button');
                const upgradeMultiTapCost = document.getElementById('upgrade-multi-tap-cost');
                
                if (multiTapLevelDisplay) multiTapLevelDisplay.textContent = multiTapLevel;
                if (upgradeMultiTapCost) upgradeMultiTapCost.textContent = multiTapUpgradeCost;
                if (upgradeMultiTapButton) upgradeMultiTapButton.disabled = currentScore < multiTapUpgradeCost;
            }
        } catch (error) {
            console.error("Помилка при оновленні UI екрану прокачки:", error);
        }
    }

    function updateTasksScreenUI() {
        try {
            if (subscribeTaskButtonElement) {
                if (isSubscribeTaskCompleted) {
                    subscribeTaskButtonElement.disabled = true;
                    subscribeTaskButtonElement.textContent = "Виконано";
                } else {
                    subscribeTaskButtonElement.disabled = false;
                    subscribeTaskButtonElement.textContent = "Підписатись (+100,000 монет)";
                }
            }
            
            // Оновлення кнопки запрошення друга
            if (inviteFriendButtonElement) {
                if (isInviteFriendTaskCompleted) {
                    inviteFriendButtonElement.disabled = true;
                    inviteFriendButtonElement.textContent = "Виконано";
                } else {
                    inviteFriendButtonElement.disabled = false;
                    inviteFriendButtonElement.textContent = "Запросити (+50,000 монет)";
                }
            }
            
            // Оновлення кнопки щоденного бонусу
            if (dailyBonusButtonElement) {
                const today = new Date().toDateString();
                if (lastDailyBonusDate === today) {
                    dailyBonusButtonElement.disabled = true;
                    dailyBonusButtonElement.textContent = "Отримано сьогодні";
                } else {
                    dailyBonusButtonElement.disabled = false;
                    dailyBonusButtonElement.textContent = "Отримати (+10,000 монет)";
                }
            }
            
            // Оновлення нових завдань
            updateSessionTaskUI();
            updateComboTaskUI();
        } catch (error) {
            console.error("Помилка при оновленні UI екрану завдань:", error);
        }
    }
    
    // Оновлення UI завдання на 10k монет за сесію
    function updateSessionTaskUI() {
        try {
            const sessionTaskElement = document.getElementById('session-task-button');
            if (sessionTaskElement) {
                if (sessionTask10kCompleted) {
                    sessionTaskElement.disabled = true;
                    sessionTaskElement.textContent = "Виконано";
                } else {
                    sessionTaskElement.disabled = true;
                    sessionTaskElement.textContent = `Прогрес: ${Math.min(sessionCoins, 10000)}/10000`;
                }
            }
        } catch (error) {
            console.error("Помилка при оновленні UI завдання сесії:", error);
        }
    }
    
    // Оновлення UI завдання на комбо х5
    function updateComboTaskUI() {
        try {
            const comboTaskElement = document.getElementById('combo-task-button');
            if (comboTaskElement) {
                if (comboTask5xCompleted) {
                    comboTaskElement.disabled = true;
                    comboTaskElement.textContent = "Виконано";
                } else {
                    comboTaskElement.disabled = true;
                    comboTaskElement.textContent = `Прогрес: комбо x${maxComboReached}/5`;
                }
            }
        } catch (error) {
            console.error("Помилка при оновленні UI завдання комбо:", error);
        }
    }

    function saveGameState() {
        try {
            localStorage.setItem('currentCoinLevel', currentCoinLevel.toString());
            localStorage.setItem('currentEnergyLevelLevel', currentEnergyLevelLevel.toString());
            localStorage.setItem('multiTapLevel', multiTapLevel.toString());
            localStorage.setItem('maximumEnergy', maximumEnergy.toString());
            localStorage.setItem('currentEnergyLevel', currentEnergyLevel.toString());
            localStorage.setItem('energyRegenerationRate', energyRegenerationRate.toString());
            localStorage.setItem('tapka_score', currentScore.toString());
            localStorage.setItem('isSubscribeTaskCompleted', isSubscribeTaskCompleted.toString());
            localStorage.setItem('isInviteFriendTaskCompleted', isInviteFriendTaskCompleted.toString());
            localStorage.setItem('lastDailyBonusDate', lastDailyBonusDate);
            localStorage.setItem('sessionTask10kCompleted', sessionTask10kCompleted.toString());
            localStorage.setItem('comboTask5xCompleted', comboTask5xCompleted.toString());
            localStorage.setItem('maxComboReached', maxComboReached.toString());
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

    // Функція для відкриття посилання на Telegram
    function openTelegramChannel() {
        try {
            window.open('https://t.me/mititcoin', '_blank');
            isSubscribeTaskCompleted = true;
            currentScore += 100000; // Додаємо 100к монет за підписку
            scoreDisplayElement.textContent = currentScore;
            saveGameState();
            updateTasksScreenUI();
            
            // Показуємо повідомлення про нагороду
            showTaskCompleteMessage("+100,000 монет за підписку!");
            
            console.log("Завдання на підписку виконано, додано 100000 монет");
        } catch (error) {
            console.error("Помилка при відкритті каналу Telegram:", error);
        }
    }
    
    // Функція для запрошення друга через Telegram
    function inviteFriend() {
        try {
            if (webApp && webApp.showPopup) {
                webApp.showPopup({
                    title: "Запросити друга",
                    message: "Поділіться грою MITIT Coin з друзями!",
                    buttons: [
                        {text: "Поділитися", type: "default"}
                    ]
                }, function(button_id) {
                    if (button_id === 0) { // "Поділитися" був натиснутий
                        // Тут має бути ваша логіка для оправлення посилання через Telegram
                        // Це емуляція успішного запрошення
                        isInviteFriendTaskCompleted = true;
                        currentScore += 50000;
                        scoreDisplayElement.textContent = currentScore;
                        saveGameState();
                        updateTasksScreenUI();
                        showTaskCompleteMessage("+50,000 монет за запрошення друга!");
                    }
                });
            } else {
                // Для розробки, коли немає доступу до API Telegram
                isInviteFriendTaskCompleted = true;
                currentScore += 50000;
                scoreDisplayElement.textContent = currentScore;
                saveGameState();
                updateTasksScreenUI();
                 isInviteFriendTaskCompleted = true;
                currentScore += 50000;
                scoreDisplayElement.textContent = currentScore;
                saveGameState();
                updateTasksScreenUI();
                showTaskCompleteMessage("+50,000 монет за запрошення друга!");
            }
            console.log("Завдання на запрошення друга виконано, додано 50000 монет");
        } catch (error) {
            console.error("Помилка при запрошенні друга:", error);
        }
    }
    
    // Функція для отримання щоденного бонусу
    function claimDailyBonus() {
        try {
            const today = new Date().toDateString();
            if (lastDailyBonusDate !== today) {
                lastDailyBonusDate = today;
                currentScore += 10000;
                scoreDisplayElement.textContent = currentScore;
                saveGameState();
                updateTasksScreenUI();
                showTaskCompleteMessage("+10,000 монет щоденний бонус!");
                console.log("Щоденний бонус отримано, додано 10000 монет");
            }
        } catch (error) {
            console.error("Помилка при отриманні щоденного бонусу:", error);
        }
    }
    
    // Додамо нове завдання - підписка на VIP канал
    let isVIPSubscribeTaskCompleted = localStorage.getItem('isVIPSubscribeTaskCompleted') === 'true';
    
    function updateVIPTaskUI() {
        try {
            const vipTaskElement = document.getElementById('vip-task-button');
            if (vipTaskElement) {
                if (isVIPSubscribeTaskCompleted) {
                    vipTaskElement.disabled = true;
                    vipTaskElement.textContent = "Виконано";
                } else {
                    vipTaskElement.disabled = false;
                    vipTaskElement.textContent = "Підписатись на VIP (+200,000 монет)";
                }
            }
        } catch (error) {
            console.error("Помилка при оновленні UI VIP завдання:", error);
        }
    }
    
    function openVIPTelegramChannel() {
        try {
            window.open('https://t.me/mititcoin_vip', '_blank');
            isVIPSubscribeTaskCompleted = true;
            currentScore += 200000; // Додаємо 200к монет за підписку на VIP
            scoreDisplayElement.textContent = currentScore;
            localStorage.setItem('isVIPSubscribeTaskCompleted', 'true');
            saveGameState();
            updateVIPTaskUI();
            
            // Показуємо повідомлення про нагороду
            showTaskCompleteMessage("+200,000 монет за VIP підписку!");
            
            console.log("Завдання на VIP підписку виконано, додано 200000 монет");
        } catch (error) {
            console.error("Помилка при відкритті VIP каналу Telegram:", error);
        }
    }
    
    // Додаємо нове завдання - пройти навчання
    let isTutorialCompleted = localStorage.getItem('isTutorialCompleted') === 'true';
    
    function updateTutorialTaskUI() {
        try {
            const tutorialTaskElement = document.getElementById('tutorial-task-button');
            if (tutorialTaskElement) {
                if (isTutorialCompleted) {
                    tutorialTaskElement.disabled = true;
                    tutorialTaskElement.textContent = "Виконано";
                } else {
                    tutorialTaskElement.disabled = false;
                    tutorialTaskElement.textContent = "Пройти навчання (+15,000 монет)";
                }
            }
        } catch (error) {
            console.error("Помилка при оновленні UI завдання навчання:", error);
        }
    }
    
    function completeTutorial() {
        try {
            // Показуємо навчальний інтерфейс
            const tutorialScreen = document.getElementById('tutorialScreen');
            if (tutorialScreen) {
                tutorialScreen.style.display = 'flex';
                
                // Після завершення навчання (може бути закрито кнопкою)
                const closeTutorialButton = document.getElementById('close-tutorial-button');
                if (closeTutorialButton) {
                    closeTutorialButton.addEventListener('click', () => {
                        tutorialScreen.style.display = 'none';
                        if (!isTutorialCompleted) {
                            isTutorialCompleted = true;
                            currentScore += 15000;
                            scoreDisplayElement.textContent = currentScore;
                            localStorage.setItem('isTutorialCompleted', 'true');
                            saveGameState();
                            updateTutorialTaskUI();
                            showTaskCompleteMessage("+15,000 монет за проходження навчання!");
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Помилка при проходженні навчання:", error);
        }
    }
    
    // Розширимо функцію оновлення екрана завдань, щоб включити нові завдання
    function updateTasksScreenUI() {
        try {
            if (subscribeTaskButtonElement) {
                if (isSubscribeTaskCompleted) {
                    subscribeTaskButtonElement.disabled = true;
                    subscribeTaskButtonElement.textContent = "Виконано";
                } else {
                    subscribeTaskButtonElement.disabled = false;
                    subscribeTaskButtonElement.textContent = "Підписатись (+100,000 монет)";
                }
            }
            
            // Оновлення кнопки запрошення друга
            if (inviteFriendButtonElement) {
                if (isInviteFriendTaskCompleted) {
                    inviteFriendButtonElement.disabled = true;
                    inviteFriendButtonElement.textContent = "Виконано";
                } else {
                    inviteFriendButtonElement.disabled = false;
                    inviteFriendButtonElement.textContent = "Запросити (+50,000 монет)";
                }
            }
            
            // Оновлення кнопки щоденного бонусу
            if (dailyBonusButtonElement) {
                const today = new Date().toDateString();
                if (lastDailyBonusDate === today) {
                    dailyBonusButtonElement.disabled = true;
                    dailyBonusButtonElement.textContent = "Отримано сьогодні";
                } else {
                    dailyBonusButtonElement.disabled = false;
                    dailyBonusButtonElement.textContent = "Отримати (+10,000 монет)";
                }
            }
            
            // Оновлення нових завдань
            updateSessionTaskUI();
            updateComboTaskUI();
            updateVIPTaskUI();
            updateTutorialTaskUI();
        } catch (error) {
            console.error("Помилка при оновленні UI екрану завдань:", error);
        }
    }
    
    // Додамо прокачку для мульті-тапу
    function upgradeMultiTap() {
        try {
            if (currentScore >= multiTapUpgradeCost) {
                currentScore -= multiTapUpgradeCost;
                multiTapLevel += 1;
                multiTapUpgradeCost = calculateUpgradeCost(multiTapLevel + 1) * 2; // Мульті-тап дорожче
                
                // Зупиняємо старий авто-тап і запускаємо новий з покращеними параметрами
                stopAutoTap();
                startAutoTap();
                
                scoreDisplayElement.textContent = currentScore;
                updateUpgradeScreenUI();
                saveGameState();
                
                // Показуємо повідомлення про успішну прокачку
                showTaskCompleteMessage(`Мульті-тап покращено до рівня ${multiTapLevel}!`);
            }
        } catch (error) {
            console.error("Помилка при прокачці мульті-тапу:", error);
        }
    }
    
    // Розширимо функцію ініціалізації гри
    function initializeGame() {
        try {
            console.log("Ініціалізація гри.");
            const savedScore = localStorage.getItem('tapka_score');
            currentScore = savedScore ? parseInt(savedScore) : 0;
            scoreDisplayElement.textContent = currentScore;
            
            // Завантаження даних прокачки
            currentCoinLevel = parseInt(localStorage.getItem('currentCoinLevel')) || 1;
            currentEnergyLevelLevel = parseInt(localStorage.getItem('currentEnergyLevelLevel')) || 1;
            multiTapLevel = parseInt(localStorage.getItem('multiTapLevel')) || 0;
            
            // Розрахунок вартості прокачок
            coinUpgradeCost = calculateUpgradeCost(currentCoinLevel);
            energyUpgradeCost = calculateUpgradeCost(currentEnergyLevelLevel);
            multiTapUpgradeCost = calculateUpgradeCost(multiTapLevel + 1) * 2; // Мульті-тап дорожче
            
            // Налаштування параметрів гри
            tapValue = baseTapValue * currentCoinLevel;
            maximumEnergy = 1000 + (currentEnergyLevelLevel - 1) * 100;
            energyRegenerationRate = 0.5 + (currentEnergyLevelLevel - 1) * 0.1;
            
            // Завантаження даних завдань
            isSubscribeTaskCompleted = localStorage.getItem('isSubscribeTaskCompleted') === 'true';
            isInviteFriendTaskCompleted = localStorage.getItem('isInviteFriendTaskCompleted') === 'true';
            lastDailyBonusDate = localStorage.getItem('lastDailyBonusDate') || '';
            sessionTask10kCompleted = localStorage.getItem('sessionTask10kCompleted') === 'true';
            comboTask5xCompleted = localStorage.getItem('comboTask5xCompleted') === 'true';
            isVIPSubscribeTaskCompleted = localStorage.getItem('isVIPSubscribeTaskCompleted') === 'true';
            isTutorialCompleted = localStorage.getItem('isTutorialCompleted') === 'true';
            maxComboReached = parseInt(localStorage.getItem('maxComboReached')) || 1;
            
            // Обнуляємо лічильник монет за сесію
            sessionCoins = 0;
            
            // Оновлюємо інтерфейс
            updateEnergyDisplayUI();
            updateUpgradeScreenUI();
            updateTasksScreenUI();
            
            // Відновлюємо енергію після оффлайн режиму
            calculateOfflineEnergyRegen();
            updateEnergyDisplayUI();
            
            // Запускаємо гру
            isGameActive = true;
            startEnergyRegeneration();
            startAutoTap(); // Запускаємо авто-тап, якщо він прокачаний
            if (coinElement) coinElement.classList.remove('disabled');
            console.log("Гра ініціалізована.");
        } catch (error) {
            console.error("Помилка при ініціалізації гри:", error);
        }
    }
    
    // Додамо HTML елементи для нових завдань в HTML
    function setupTasksScreen() {
        if (tasksScreenElement) {
            // Додаємо VIP завдання, якщо воно ще не існує
            if (!document.getElementById('vip-task-button')) {
                const vipTaskButton = document.createElement('button');
                vipTaskButton.id = 'vip-task-button';
                vipTaskButton.className = 'task-button';
                vipTaskButton.textContent = "Підписатись на VIP (+200,000 монет)";
                vipTaskButton.addEventListener('click', openVIPTelegramChannel);
                tasksScreenElement.appendChild(vipTaskButton);
            }
            
            // Додаємо завдання навчання, якщо воно ще не існує
            if (!document.getElementById('tutorial-task-button')) {
                const tutorialTaskButton = document.createElement('button');
                tutorialTaskButton.id = 'tutorial-task-button';
                tutorialTaskButton.className = 'task-button';
                tutorialTaskButton.textContent = "Пройти навчання (+15,000 монет)";
                tutorialTaskButton.addEventListener('click', completeTutorial);
                tasksScreenElement.appendChild(tutorialTaskButton);
            }
        }
    }
    
    // Додамо кнопку прокачки мульті-тапу в HTML
    function setupUpgradeScreen() {
        if (upgradeScreenElement) {
            // Додаємо секцію для мульті-тапу, якщо вона ще не існує
            if (!document.getElementById('multi-tap-section')) {
                const multiTapSection = document.createElement('div');
                multiTapSection.id = 'multi-tap-section';
                multiTapSection.className = 'upgrade-section';
                
                const multiTapTitle = document.createElement('h3');
                multiTapTitle.textContent = 'Мульті-тап';
                
                const multiTapLevelDisplay = document.createElement('div');
                multiTapLevelDisplay.id = 'multi-tap-level-display';
                multiTapLevelDisplay.textContent = multiTapLevel;
                
                const upgradeMultiTapButton = document.createElement('button');
                upgradeMultiTapButton.id = 'upgrade-multi-tap-button';
                upgradeMultiTapButton.className = 'upgrade-button';
                upgradeMultiTapButton.textContent = 'Прокачати';
                upgradeMultiTapButton.addEventListener('click', upgradeMultiTap);
                
                const upgradeMultiTapCostContainer = document.createElement('div');
                upgradeMultiTapCostContainer.textContent = 'Вартість: ';
                
                const upgradeMultiTapCost = document.createElement('span');
                upgradeMultiTapCost.id = 'upgrade-multi-tap-cost';
                upgradeMultiTapCost.textContent = multiTapUpgradeCost;
                
                upgradeMultiTapCostContainer.appendChild(upgradeMultiTapCost);
                
                multiTapSection.appendChild(multiTapTitle);
                multiTapSection.appendChild(multiTapLevelDisplay);
                multiTapSection.appendChild(upgradeMultiTapButton);
                multiTapSection.appendChild(upgradeMultiTapCostContainer);
                
                upgradeScreenElement.appendChild(multiTapSection);
            }
        }
    }
    
    // Додамо екран навчання
    function setupTutorialScreen() {
        // Перевіряємо, чи вже існує екран навчання
        if (!document.getElementById('tutorialScreen')) {
            const tutorialScreen = document.createElement('div');
            tutorialScreen.id = 'tutorialScreen';
            tutorialScreen.className = 'screen';
            tutorialScreen.style.display = 'none';
            
            const tutorialContent = document.createElement('div');
            tutorialContent.className = 'tutorial-content';
            
            const tutorialTitle = document.createElement('h2');
            tutorialTitle.textContent = 'Ласкаво просимо до MITIT Coin!';
            
            const tutorialInstructions = document.createElement('div');
            tutorialInstructions.innerHTML = `
                <p>Натискайте на монету, щоб заробляти MITIT Coins!</p>
                <p>Швидкі натискання створюють комбо і збільшують нагороду.</p>
                <p>Використовуйте зароблені монети для прокачки:</p>
                <ul>
                    <li>Монета - збільшує кількість монет за клік</li>
                    <li>Енергія - збільшує максимальну енергію і швидкість її відновлення</li>
                    <li>Мульті-тап - автоматично збирає монети без натискання</li>
                </ul>
                <p>Виконуйте завдання для отримання додаткових монет!</p>
            `;
            
            const closeTutorialButton = document.createElement('button');
            closeTutorialButton.id = 'close-tutorial-button';
            closeTutorialButton.className = 'button';
            closeTutorialButton.textContent = 'Зрозуміло!';
            
            tutorialContent.appendChild(tutorialTitle);
            tutorialContent.appendChild(tutorialInstructions);
            tutorialContent.appendChild(closeTutorialButton);
            
            tutorialScreen.appendChild(tutorialContent);
            
            document.body.appendChild(tutorialScreen);
        }
    }
    
    // Додамо новий метод для збереження всіх даних гри
    function saveGameState() {
        try {
            localStorage.setItem('currentCoinLevel', currentCoinLevel.toString());
            localStorage.setItem('currentEnergyLevelLevel', currentEnergyLevelLevel.toString());
            localStorage.setItem('multiTapLevel', multiTapLevel.toString());
            localStorage.setItem('maximumEnergy', maximumEnergy.toString());
            localStorage.setItem('currentEnergyLevel', currentEnergyLevel.toString());
            localStorage.setItem('energyRegenerationRate', energyRegenerationRate.toString());
            localStorage.setItem('tapka_score', currentScore.toString());
            localStorage.setItem('isSubscribeTaskCompleted', isSubscribeTaskCompleted.toString());
            localStorage.setItem('isInviteFriendTaskCompleted', isInviteFriendTaskCompleted.toString());
            localStorage.setItem('lastDailyBonusDate', lastDailyBonusDate);
            localStorage.setItem('sessionTask10kCompleted', sessionTask10kCompleted.toString());
            localStorage.setItem('comboTask5xCompleted', comboTask5xCompleted.toString());
            localStorage.setItem('maxComboReached', maxComboReached.toString());
            localStorage.setItem('isVIPSubscribeTaskCompleted', isVIPSubscribeTaskCompleted.toString());
            localStorage.setItem('isTutorialCompleted', isTutorialCompleted.toString());
            console.log("Стан гри збережено.");
        } catch (error) {
            console.error("Помилка при збереженні стану гри:", error);
        }
    }

    // Ініціалізація графічного інтерфейсу
    function setupUI() {
        setupTasksScreen();
        setupUpgradeScreen();
        setupTutorialScreen();
        
        // Оновлюємо інтерфейс
        updateTasksScreenUI();
        updateUpgradeScreenUI();
    }

    // Основні обробники подій
    if (coinElement) {
        coinElement.addEventListener('click', (e) => {
            if (isGameActive && currentEnergyLevel > 0) {
                // Розрахунок значення кліку з урахуванням комбо
                updateComboCounter();
                const clickValue = tapValue * currentCombo;
                
                currentScore += clickValue;
                sessionCoins += clickValue; // Додаємо до рахунку сесії
                scoreDisplayElement.textContent = currentScore;
                
                // Візуальні ефекти
                const rect = coinElement.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                spawnParticles(centerX, centerY);
                showScoreSplash(centerX, centerY - 40, clickValue);
                
                // Анімація натискання
                coinElement.classList.add('clicked');
                setTimeout(() => coinElement.classList.remove('clicked'), 100);
                
                // Витрата енергії
                currentEnergyLevel -= 1;
                updateEnergyDisplayUI();
                
                // Зберігаємо стан гри
                localStorage.setItem('tapka_score', currentScore.toString());
                localStorage.setItem('currentEnergyLevel', currentEnergyLevel.toString());
                
                // Перевіряємо завдання на 10k монет
                checkSessionTask();
            }
        });
    }

    // Обробники для кнопок меню
    if (leaderboardButtonElement) {
        leaderboardButtonElement.addEventListener('click', () => {
            leaderboardScreenElement.style.display = 'flex';
            fetchLeaderboardData();
        });
    }

    if (closeLeaderboardButtonElement) {
        closeLeaderboardButtonElement.addEventListener('click', () => {
            leaderboardScreenElement.style.display = 'none';
        });
    }

    if (upgradeButtonElement) {
        upgradeButtonElement.addEventListener('click', () => {
            updateUpgradeScreenUI();
            upgradeScreenElement.style.display = 'flex';
        });
    }

    if (closeUpgradeButtonElement) {
        closeUpgradeButtonElement.addEventListener('click', () => {
            upgradeScreenElement.style.display = 'none';
        });
    }

    if (tasksButtonElement) {
        tasksButtonElement.addEventListener('click', () => {
            updateTasksScreenUI();
            tasksScreenElement.style.display = 'flex';
        });
    }

    if (closeTasksButtonElement) {
        closeTasksButtonElement.addEventListener('click', () => {
            tasksScreenElement.style.display = 'none';
        });
    }

    // Обробники для кнопок прокачки
    if (upgradeCoinButtonElement) {
        upgradeCoinButtonElement.addEventListener('click', () => {
            if (currentScore >= coinUpgradeCost) {
                currentScore -= coinUpgradeCost;
                currentCoinLevel += 1;
                coinUpgradeCost = calculateUpgradeCost(currentCoinLevel);
                tapValue = baseTapValue * currentCoinLevel;
                scoreDisplayElement.textContent = currentScore;
                updateUpgradeScreenUI();
                saveGameState();
                
                // Показуємо повідомлення про успішну прокачку
                showTaskCompleteMessage(`Прокачка монети до рівня ${currentCoinLevel}!`);
            }
        });
    }

    if (upgradeEnergyButtonElement) {
        upgradeEnergyButtonElement.addEventListener('click', () => {
            if (currentScore >= energyUpgradeCost) {
                currentScore -= energyUpgradeCost;
                currentEnergyLevelLevel += 1;
                energyUpgradeCost = calculateUpgradeCost(currentEnergyLevelLevel);
                maximumEnergy = 1000 + (currentEnergyLevelLevel - 1) * 100;
                energyRegenerationRate = 0.5 + (currentEnergyLevelLevel - 1) * 0.1;
                scoreDisplayElement.textContent = currentScore;
                updateUpgradeScreenUI();
                saveGameState();
                
                // Показуємо повідомлення про успішну прокачку
                showTaskCompleteMessage(`Прокачка енергії до рівня ${currentEnergyLevelLevel}!`);
            }
        });
    }

    // Обробники для кнопок завдань
    if (subscribeTaskButtonElement) {
        subscribeTaskButtonElement.addEventListener('click', openTelegramChannel);
    }

    if (inviteFriendButtonElement) {
        inviteFriendButtonElement.addEventListener('click', inviteFriend);
    }

    if (dailyBonusButtonElement) {
        dailyBonusButtonElement.addEventListener('click', claimDailyBonus);
    }

    if (playAgainButtonElement) {
        playAgainButtonElement.addEventListener('click', () => {
            endScreenElement.style.display = 'none';
            initializeGame();
        });
    }

    if (sendScoreButtonElement) {
        sendScoreButtonElement.addEventListener('click', () => {
            try {
                webApp.close();
            } catch (error) {
                console.error("Помилка при закритті WebApp:", error);
            }
        });
    }

    // Видаляємо частинки через певний час
    setInterval(() => {
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => {
            if (particle.getAttribute('data-removed') !== 'true') {
                particle.remove();
            }
        });
    }, 2000);

    // Ініціалізуємо гру при завантаженні
    setupUI();
    initializeGame();

    // Автозбереження даних гри
    setInterval(saveGameState, 30000);
});
