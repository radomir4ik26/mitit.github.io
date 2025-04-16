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
    const tasksButtonElement = document.getElementById('tasksButton');
    const tasksScreenElement = document.getElementById('tasksScreen');
    const closeTasksButtonElement = document.getElementById('close-tasks-button');
    const subscribeTgButtonElement = document.getElementById('subscribe-task-button');
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

    // Змінні енергії
    let maximumEnergy = parseInt(localStorage.getItem('maximumEnergy')) || 1000;
    let currentEnergyLevel = parseInt(localStorage.getItem('currentEnergyLevel')) || maximumEnergy;
    let energyRegenerationRate = parseFloat(localStorage.getItem('energyRegenerationRate')) || 0.5;
    let energyRegenIntervalId;

    // Змінні прокачки
    let currentCoinLevel = parseInt(localStorage.getItem('currentCoinLevel')) || 1;
    let currentEnergyLevelLevel = parseInt(localStorage.getItem('currentEnergyLevelLevel')) || 1;
    
    // Формула для розрахунку вартості прокачки
    function calculateUpgradeCost(level) {
        // Базова вартість 1000, кожен наступний рівень на 30% дорожче
        return Math.floor(1000 * Math.pow(1.3, level - 1));
    }

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
                
                // Розраховуємо вартість прокачки для монети і енергії
                const coinUpgradeCost = calculateUpgradeCost(currentCoinLevel);
                const energyUpgradeCost = calculateUpgradeCost(currentEnergyLevelLevel);
                
                upgradeCoinCostElement.textContent = coinUpgradeCost;
                upgradeEnergyCostElement.textContent = energyUpgradeCost;
                
                // Вимикаємо кнопки, якщо недостатньо коштів
                upgradeCoinButtonElement.disabled = currentScore < coinUpgradeCost;
                upgradeEnergyButtonElement.disabled = currentScore < energyUpgradeCost;
            }
        } catch (error) {
            console.error("Помилка при оновленні UI екрану прокачки:", error);
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
                const coinUpgradeCost = calculateUpgradeCost(currentCoinLevel);
                if (currentScore >= coinUpgradeCost) {
                    currentScore -= coinUpgradeCost;
                    currentCoinLevel++;
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
                const energyUpgradeCost = calculateUpgradeCost(currentEnergyLevelLevel);
                if (currentScore >= energyUpgradeCost) {
                    currentScore -= energyUpgradeCost;
                    currentEnergyLevelLevel++;
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
if (tasksButtonElement) {
        tasksButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Завдання'.");
                if (tasksScreenElement) {
                    tasksScreenElement.style.display = 'flex';
                    stopGamePlay();
                    
                    // Проверяем, выполнены ли задания
                    const taskStatuses = JSON.parse(localStorage.getItem('task_statuses') || '{}');
                    
                    if (taskStatuses.subscribed) {
                        subscribeTgButtonElement.textContent = 'Отримано';
                        subscribeTgButtonElement.disabled = true;
                    }
                    
                    if (taskStatuses.invited) {
                        inviteFriendButtonElement.textContent = 'Отримано';
                        inviteFriendButtonElement.disabled = true;
                    }
                    
                    const lastDailyBonus = localStorage.getItem('last_daily_bonus');
                    const today = new Date().toDateString();
                    if (lastDailyBonus === today) {
                        dailyBonusButtonElement.textContent = 'Отримано';
                        dailyBonusButtonElement.disabled = true;
                    } else {
                        dailyBonusButtonElement.textContent = 'Отримати';
                        dailyBonusButtonElement.disabled = false;
                    }
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

    if (subscribeTgButtonElement) {
        subscribeTgButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Підписатися на Telegram канал'.");
                // Открываем ссылку на канал в Telegram
                webApp.openLink('https://t.me/mitit_official');
                
                // Начисляем награду
                currentScore += 100000;
                scoreDisplayElement.textContent = currentScore;
                localStorage.setItem('tapka_score', currentScore.toString());
                
                // Помечаем задание как выполненное
                const taskStatuses = JSON.parse(localStorage.getItem('task_statuses') || '{}');
                taskStatuses.subscribed = true;
                localStorage.setItem('task_statuses', JSON.stringify(taskStatuses));
                
                // Обновляем интерфейс
                subscribeTgButtonElement.textContent = 'Отримано';
                subscribeTgButtonElement.disabled = true;
                
                // Показываем награду
                alert('Вітаємо! Ви отримали 100,000 монет за підписку!');
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Підписатися':", error);
            }
        });
    }

    if (inviteFriendButtonElement) {
        inviteFriendButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Запросити друга'.");
                // Создаем ссылку для приглашения
                const shareUrl = 'https://t.me/share/url?url=https://t.me/MITITCoinBot&text=Приєднуйся до гри MITIT Coin та отримай бонусні монети!';
                webApp.openLink(shareUrl);
                
                // Начисляем награду
                currentScore += 50000;
                scoreDisplayElement.textContent = currentScore;
                localStorage.setItem('tapka_score', currentScore.toString());
                
                // Помечаем задание как выполненное
                const taskStatuses = JSON.parse(localStorage.getItem('task_statuses') || '{}');
                taskStatuses.invited = true;
                localStorage.setItem('task_statuses', JSON.stringify(taskStatuses));
                
                // Обновляем интерфейс
                inviteFriendButtonElement.textContent = 'Отримано';
                inviteFriendButtonElement.disabled = true;
                
                // Показываем награду
                alert('Вітаємо! Ви отримали 50,000 монет за запрошення друга!');
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Запросити друга':", error);
            }
        });
    }

    if (dailyBonusButtonElement) {
        dailyBonusButtonElement.addEventListener('click', () => {
            try {
                console.log("Натиснуто кнопку 'Щоденний бонус'.");
                const today = new Date().toDateString();
                const lastDailyBonus = localStorage.getItem('last_daily_bonus');
                
                if (lastDailyBonus !== today) {
                    // Начисляем награду
                    currentScore += 10000;
                    scoreDisplayElement.textContent = currentScore;
                    localStorage.setItem('tapka_score', currentScore.toString());
                    
                    // Запоминаем дату получения бонуса
                    localStorage.setItem('last_daily_bonus', today);
                    
                    // Обновляем интерфейс
                    dailyBonusButtonElement.textContent = 'Отримано';
                    dailyBonusButtonElement.disabled = true;
                    
                    // Показываем награду
                    alert('Вітаємо! Ви отримали 10,000 монет щоденного бонусу!');
                }
            } catch (error) {
                console.error("Помилка в обробнику кнопки 'Щоденний бонус':", error);
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
