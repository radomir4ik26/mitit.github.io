document.addEventListener('DOMContentLoaded', () => {
    const tapButton = document.getElementById('tapButton');
    const balanceElement = document.getElementById('balance');
    const timeLeftElement = document.createElement('div');
    timeLeftElement.className = 'time-left';
    document.querySelector('.container').appendChild(timeLeftElement);
    
    // Створюємо кнопку завершення гри
    const finishButton = document.createElement('button');
    finishButton.id = 'finishButton';
    finishButton.className = 'finish-button';
    finishButton.textContent = 'Завершити гру';
    finishButton.style.display = 'none'; // Спочатку приховуємо кнопку
    document.querySelector('.container').appendChild(finishButton);

    // Створюємо повідомлення про результат
    const resultMessage = document.createElement('div');
    resultMessage.className = 'result-message';
    resultMessage.style.display = 'none';
    document.querySelector('.container').appendChild(resultMessage);

    // Змінні для гри
    let balance = 0;
    let gameActive = false;
    let gameTime = 10; // Тривалість гри в секундах
    let timeLeft = gameTime;
    let timer;

    // Отримання інформації про користувача Telegram
    const webApp = window.Telegram.WebApp;
    webApp.expand(); // Розгортаємо веб-додаток на весь екран
    const initData = webApp.initDataUnsafe || {};
    const userId = initData.user && initData.user.id;
    const userName = initData.user && (initData.user.first_name + (initData.user.last_name ? ' ' + initData.user.last_name : ''));

    console.log('Telegram WebApp object:', webApp);
    console.log('User ID:', userId);
    console.log('User Name:', userName);

    // Змінюємо кнопку тап на кнопку старту
    tapButton.textContent = 'Почати гру';
    
    // Функція для старту гри
    function startGame() {
        // Змінюємо текст кнопки
        tapButton.textContent = 'Tap!';
        balanceElement.textContent = `Очки: 0`;
        
        // Скидаємо баланс і стартуємо гру
        balance = 0;
        gameActive = true;
        timeLeft = gameTime;
        updateTimeDisplay();
        
        // Запускаємо таймер
        timer = setInterval(() => {
            timeLeft--;
            updateTimeDisplay();
            
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }
    
    // Функція оновлення відображення часу
    function updateTimeDisplay() {
        timeLeftElement.textContent = `Час: ${timeLeft} сек.`;
    }
    
    // Функція завершення гри
    function endGame() {
        clearInterval(timer);
        gameActive = false;
        
        resultMessage.textContent = `Гра завершена! Ви набрали ${balance} очок!`;
        resultMessage.style.display = 'block';
        
        tapButton.style.display = 'none';
        finishButton.style.display = 'block';
    }
    
    // Обробник кліку по основній кнопці
    tapButton.addEventListener('click', () => {
        if (!gameActive) {
            // Якщо гра не активна, то стартуємо її
            startGame();
            resultMessage.style.display = 'none';
        } else {
            // Якщо гра активна, збільшуємо баланс
            balance++;
            balanceElement.textContent = `Очки: ${balance}`;
        }
    });
    
    // Обробник кліку по кнопці завершення
    finishButton.addEventListener('click', () => {
        // Відправляємо дані назад у Telegram бота
        console.log('Відправляємо дані до бота:', { score: balance });
        
        webApp.sendData(JSON.stringify({
            score: balance
        }));
        
        // Приховуємо повідомлення
        finishButton.style.display = 'none';
        resultMessage.textContent = 'Результат відправлено!';
        
        // Повертаємо кнопку старту гри
        setTimeout(() => {
            tapButton.textContent = 'Зіграти ще раз';
            tapButton.style.display = 'block';
        }, 1500);
    });
});
