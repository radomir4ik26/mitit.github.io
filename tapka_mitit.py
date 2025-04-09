from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import json
import logging
import sqlite3
from datetime import datetime

# Налаштовуємо логування
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

TOKEN = "7996923376:AAFB5dKxz5Wyfybvtny4vcChZcnJ6SGV50Q"

# Ініціалізація бази даних SQLite
def init_db():
    conn = sqlite3.connect('tapka_game.db')
    cursor = conn.cursor()
    # Створюємо таблицю для балансу користувачів
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_balances (
        user_id INTEGER PRIMARY KEY,
        balance INTEGER DEFAULT 0,
        last_updated TEXT
    )
    ''')
    
    # Створюємо таблицю для історії ігор
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS game_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        score INTEGER,
        timestamp TEXT,
        FOREIGN KEY (user_id) REFERENCES user_balances (user_id)
    )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("База даних ініціалізована")

# Функція для отримання балансу користувача
def get_user_balance(user_id):
    conn = sqlite3.connect('tapka_game.db')
    cursor = conn.cursor()
    cursor.execute('SELECT balance FROM user_balances WHERE user_id = ?', (user_id,))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return result[0]
    return 0  # Повертаємо 0, якщо користувач не має запису в БД

# Функція для оновлення балансу користувача
def update_user_balance(user_id, balance):
    conn = sqlite3.connect('tapka_game.db')
    cursor = conn.cursor()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Використовуємо INSERT OR REPLACE для додавання нового запису або оновлення існуючого
    cursor.execute('''
    INSERT OR REPLACE INTO user_balances (user_id, balance, last_updated) 
    VALUES (?, ?, ?)
    ''', (user_id, balance, now))
    
    conn.commit()
    conn.close()
    logger.info(f"Оновлено баланс користувача {user_id}: {balance}")

# Функція для додавання запису в історію ігор
def add_game_history(user_id, score):
    conn = sqlite3.connect('tapka_game.db')
    cursor = conn.cursor()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    cursor.execute('''
    INSERT INTO game_history (user_id, score, timestamp) 
    VALUES (?, ?, ?)
    ''', (user_id, score, now))
    
    conn.commit()
    conn.close()
    logger.info(f"Збережено результат гри для користувача {user_id}: {score}")

# Функція для отримання топ-гравців
def get_top_players(limit=5):
    conn = sqlite3.connect('tapka_game.db')
    cursor = conn.cursor()
    cursor.execute('SELECT user_id, balance FROM user_balances ORDER BY balance DESC LIMIT ?', (limit,))
    results = cursor.fetchall()
    conn.close()
    return results

async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Отримує дані, надіслані з веб-аплікації."""
    try:
        data = json.loads(update.effective_message.web_app_data.data)
        user_id = update.effective_user.id  # Використовуємо ID користувача з Telegram
        
        if 'score' in data:
            score = data.get('score', 0)
            
            # Отримуємо поточний баланс
            current_balance = get_user_balance(user_id)
            
            # Оновлюємо баланс - додаємо очки за гру
            new_balance = current_balance + score
            update_user_balance(user_id, new_balance)
            
            # Додаємо запис в історію ігор
            add_game_history(user_id, score)
            
            await update.effective_message.reply_text(
                f"🎮 Гра завершена!\n"
                f"🎯 Ваш результат: {score}\n"
                f"💰 Ваш новий баланс: {new_balance}"
            )
        else:
            await update.effective_message.reply_text("Отримано некоректні дані від гри.")
            logger.warning("Отримано некоректні дані від гри: %s", data)
    except Exception as e:
        logger.error(f"Помилка обробки даних веб-аплікації: {e}")
        await update.effective_message.reply_text(f"Сталась помилка при обробці даних: {e}")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    user_name = update.effective_user.first_name
    balance = get_user_balance(user_id)
    
    web_app_url = "https://radomir4ik26.github.io/mitit.github.io/"
    web_app_info = WebAppInfo(url=web_app_url)
    keyboard = [[InlineKeyboardButton("🎮 Грати в тапку", web_app=web_app_info)]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.effective_message.reply_text(
        f"Привіт, {user_name}! 👋\n\n"
        f"Ласкаво просимо до гри \"Тапка\"!\n"
        f"💰 Твій поточний баланс: {balance}\n\n"
        f"Натисни кнопку нижче, щоб почати гру:",
        reply_markup=reply_markup
    )

async def balance(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    user_name = update.effective_user.first_name
    balance = get_user_balance(user_id)
    
    await update.effective_message.reply_text(
        f"{user_name}, твій поточний баланс: {balance} 💰"
    )

async def top(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    top_players = get_top_players(10)
    
    if not top_players:
        await update.effective_message.reply_text("Поки немає жодних результатів в таблиці лідерів.")
        return
    
    message = "🏆 ТОП ГРАВЦІВ 🏆\n\n"
    for i, (player_id, score) in enumerate(top_players, 1):
        try:
            # Отримуємо інформацію про користувача через бота
            # Це може не працювати, якщо користувач не починав взаємодію з ботом
            chat_member = await context.bot.get_chat(player_id)
            name = chat_member.first_name
        except:
            name = f"Користувач {player_id}"
        
        message += f"{i}. {name}: {score} 💰\n"
    
    await update.effective_message.reply_text(message)

def main() -> None:
    """Запуск бота"""
    # Ініціалізуємо базу даних
    init_db()
    
    # Створюємо застосунок
    application = Application.builder().token(TOKEN).build()

    # Додаємо обробники
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("balance", balance))
    application.add_handler(CommandHandler("top", top))
    
    # Додаємо обробник для даних веб-аплікації
    application.add_handler(MessageHandler(
        lambda update: update.effective_message and hasattr(update.effective_message, 'web_app_data') and update.effective_message.web_app_data is not None,
        web_app_data
    ))
    
    logger.info("Бот для гри 'Тапка' запущено!")
    
    # Запускаємо бота
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
