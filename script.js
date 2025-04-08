document.addEventListener('DOMContentLoaded', () => {
    const tapButton = document.getElementById('tapButton');
    const balanceElement = document.getElementById('balance');
    let balance = 0;

    tapButton.addEventListener('click', () => {
        balance++;
        balanceElement.textContent = `Баланс: ${balance}`;

        // Тут ми пізніше додамо відправку даних боту
    });

    // Тут ми пізніше додамо логіку отримання даних від бота (якщо потрібно)
});
