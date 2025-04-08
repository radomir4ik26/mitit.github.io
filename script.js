document.addEventListener('DOMContentLoaded', () => {
    const tapButton = document.getElementById('tapButton');
    const balanceElement = document.getElementById('balance');
    let balance = 0;

    const webApp = window.Telegram.WebApp;
    webApp.ready();

    const initData = webApp.initDataUnsafe || {};
    const userId = initData.user && initData.user.id;
    const userName = initData.user && (initData.user.first_name + (initData.user.last_name ? ' ' + initData.user.last_name : ''));

    console.log('Telegram WebApp object:', webApp);
    console.log('Initialization data:', initData);
    console.log('User ID:', userId);
    console.log('User Name:', userName);

    if (userName) {
        console.log(`Привіт, ${userName}!`);
    }

    tapButton.addEventListener('click', () => {
        balance++;
        balanceElement.textContent = `Баланс: ${balance}`;

        // Відправка даних боту
        if (webApp && webApp.sendData) {
            const dataToSend = {
                user_id: userId,
                balance: balance
            };
            webApp.sendData(JSON.stringify(dataToSend));
            console.log('Дані відправлено боту:', dataToSend);
        } else {
            console.log('Об'єкт webApp або метод sendData не доступні.');
        }
    });

    // Тут ми пізніше додамо логіку отримання даних від бота (якщо потрібно)
});
