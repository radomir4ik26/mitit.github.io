document.addEventListener('DOMContentLoaded', () => {
    const tapButton = document.getElementById('tapButton');
    const balanceElement = document.getElementById('balance');
    let balance = 0;

    // Отримання інформації про користувача Telegram
    const webApp = window.Telegram.WebApp;
    const initData = webApp.initDataUnsafe || {};
    const userId = initData.user && initData.user.id;
    const userName = initData.user && (initData.user.first_name + (initData.user.last_name ? ' ' + initData.user.last_name : ''));

    console.log('Telegram WebApp object:', webApp);
    console.log('Initialization data:', initData);
    console.log('User ID:', userId);
    console.log('User Name:', userName);

    if (userName) {
        console.log(`Привіт, ${userName}!`);
        // Можеш відобразити вітання на сторінці, якщо хочеш
    }

    tapButton.addEventListener('click', () => {
        balance++;
        balanceElement.textContent = `Баланс: ${balance}`;

        // Тут ми пізніше додамо відправку даних боту
    });

    // Тут ми пізніше додамо логіку отримання даних від бота (якщо потрібно)
});