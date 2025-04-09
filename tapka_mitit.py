from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import json

TOKEN = "7996923376:AAFB5dKxz5Wyfybvtny4vcChZcnJ6SGV50Q"
balances = {}  # Зберігаємо баланси користувачів

async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Отримує дані, надіслані з веб-аплікації."""
    data = json.loads(update.message.web_app_data.data)
    user_id = data.get('user_id')
    balance = data.get('balance')
    if user_id is not None and balance is not None:
        balances[user_id] = balance
        await update.message.reply_text(f"Отримано оновлення балансу від веб-аплікації!\nТвій баланс: {balance}")
        print(f"Оновлено баланс користувача {user_id}: {balance}")
    else:
        await update.message.reply_text("Отримано некоректні дані від веб-аплікації.")
        print("Отримано некоректні дані від веб-аплікації:", data)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    web_app_url = "https://radomir4ik26.github.io/mitit.github.io/"  # Заміни на свій URL
    web_app_info = WebAppInfo(url=web_app_url)
    keyboard = [[InlineKeyboardButton("Відкрити гру", web_app=web_app_info)]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Натисніть кнопку, щоб відкрити міні-гру!", reply_markup=reply_markup)
    user_id = update.effective_user.id
    if user_id in balances:
        await update.message.reply_text(f"Твій поточний баланс: {balances[user_id]}")

async def main() -> None:
    application = Application.builder().token(TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    # Використовуємо фільтр для WebApp даних
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))
    await application.run_polling()

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
