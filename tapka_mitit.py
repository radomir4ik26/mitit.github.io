import sqlite3
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
import json

TOKEN = "YOUR_BOT_TOKEN"  # Замініть на свій токен бота
DATABASE_NAME = 'tapka_data.db'

def create_connection():
    """Створює з'єднання з базою даних SQLite."""
    conn = None
    try:
        conn = sqlite3.connect(DATABASE_NAME)
        return conn
    except sqlite3.Error as e:
        print(e)
    return conn

def create_tables():
    """Створює таблиці для користувачів та рейтингу, якщо їх немає."""
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            best_score INTEGER DEFAULT 0
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leaderboard (
            user_id INTEGER PRIMARY KEY,
            score INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    conn.commit()
    conn.close()

def get_best_score(user_id):
    """Отримує найкращий рахунок користувача з бази даних."""
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT best_score FROM users WHERE user_id=?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else 0

def update_best_score(user_id, score):
    """Оновлює найкращий рахунок користувача в базі даних."""
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO users (user_id, best_score) VALUES (?, ?)", (user_id, score))
    conn.commit()
    conn.close()

def update_leaderboard(user_id, score):
    """Оновлює рейтинг користувача в таблиці лідерів."""
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO leaderboard (user_id, score) VALUES (?, ?)", (user_id, score))
    conn.commit()
    conn.close()

def get_leaderboard(limit=10):
    """Отримує топ N гравців з таблиці лідерів."""
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT u.user_id, u.best_score FROM users u INNER JOIN leaderboard l ON u.user_id = l.user_id ORDER BY l.score DESC LIMIT ?", (limit,))
    results = cursor.fetchall()
    conn.close()
    return results

async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Отримує дані з веб-аплікації (фінальний рахунок) та оновлює рахунок."""
    try:
        data = json.loads(update.message.web_app_data.data)
        score = data.get('score')
        user_id = update.effective_user.id
        if user_id is not None and score is not None:
            old_best_score = get_best_score(user_id)
            if score > old_best_score:
                update_best_score(user_id, score)
                update_leaderboard(user_id, score)
                await update.message.reply_text(f"Новий рекорд! Твій рахунок: {score}")
            else:
                update_leaderboard(user_id, score)
                await update.message.reply_text(f"Твій рахунок: {score}")
            print(f"Рахунок користувача {user_id}: {score} збережено.")
        else:
            await update.message.reply_text("Отримано некоректні дані від веб-аплікації.")
            print("Отримано некоректні дані від веб-аплікації:", data)
    except json.JSONDecodeError:
        await update.message.reply_text("Помилка обробки даних від веб-аплікації.")
        print("Помилка декодування JSON від веб-аплікації:", update.message.web_app_data.data)
    except Exception as e:
        print(f"Виникла помилка при обробці даних веб-аплікації: {e}")
        await update.message.reply_text("Виникла невідома помилка.")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    create_tables()
    best_score = get_best_score(user_id)
    web_app_url = "https://radomir4ik26.github.io/mitit.github.io/"
    web_app_info = WebAppInfo(url=web_app_url)
    keyboard = [[InlineKeyboardButton("Відкрити гру", web_app=web_app_info)],
                [InlineKeyboardButton("Рейтинг", callback_data='leaderboard')]] # Кнопка рейтингу
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(f"Натисніть кнопку, щоб відкрити міні-гру!\nТвій найкращий рахунок: {best_score}", reply_markup=reply_markup)

async def leaderboard_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Виводить топ гравців."""
    leaderboard = get_leaderboard()
    if leaderboard:
        message = "🏆 **Топ гравців:** 🏆\n"
        for i, (user_id, score) in enumerate(leaderboard):
            message += f"{i+1}. Користувач {user_id}: {score}\n"
    else:
        message = "Рейтинг поки що порожній."
    await update.message.reply_text(message, parse_mode='Markdown')

async def leaderboard_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обробляє натискання на кнопку рейтингу."""
    await leaderboard_command(update, context)

async def main() -> None:
    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))
    application.add_handler(CommandHandler("leaderboard", leaderboard_command))
    application.add_handler(CallbackQueryHandler(leaderboard_callback, pattern='^leaderboard$'))

    # Створюємо таблиці при запуску бота
    create_tables()

    await application.run_polling()

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
