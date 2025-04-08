from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext
import json

TOKEN = "7996923376:AAFB5dKxz5Wyfybvtny4vcChZcnJ6SGV50Q"
balances = {} # Зберігаємо баланси користувачів

def web_app_data(update: Update, context: CallbackContext) -> None:
    """Отримує дані, надіслані з веб-аплікації."""
    data = json.loads(update.message.web_app_data.data)
    user_id = data.get('user_id')
    balance = data.get('balance')
    if user_id is not None and balance is not None:
        balances[user_id] = balance
        update.message.reply_text(f"Отримано оновлення балансу від веб-аплікації!\nТвій баланс: {balance}")
        print(f"Оновлено баланс користувача {user_id}: {balance}")
    else:
        update.message.reply_text("Отримано некоректні дані від веб-аплікації.")
        print("Отримано некоректні дані від веб-аплікації:", data)

def start(update: Update, context: CallbackContext) -> None:
    web_app_url = "https://radomir4ik26.github.io/mitit.github.io/" # Заміни на свій URL
    web_app_info = WebAppInfo(url=web_app_url)
    keyboard = [[InlineKeyboardButton("Відкрити гру", web_app=web_app_info)]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    update.message.reply_text("Натисніть кнопку, щоб відкрити міні-гру!", reply_markup=reply_markup)
    user_id = update.effective_user.id
    if user_id in balances:
        update.message.reply_text(f"Твій поточний баланс: {balances[user_id]}")

def main() -> None:
    updater = Updater(TOKEN)
    dispatcher = updater.dispatcher

    dispatcher.add_handler(CommandHandler("start", start))
    dispatcher.add_handler(MessageHandler(Filters.web_app_data, web_app_data))

    updater.start_polling(poll_interval=3)
    updater.idle()

if __name__ == '__main__':
    main()
