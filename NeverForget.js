"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = __importDefault(require("./messages"));
const regexp_1 = require("./regexp");
const initialReminderState = {
    status: false,
    dateSend: false,
    date: '',
    timeSend: false,
    time: '',
    textSend: false,
    text: ''
};
const menu = {
    "reply_markup": {
        inline_keyboard: [
            [
                { text: 'Новое напоминание', callback_data: '/newReminder' },
                { text: 'Настройки', callback_data: '/settings' },
                { text: 'Показать все напоминания', callback_data: '/showList' },
                { text: 'Удалить напоминание', callback_data: '/deleteMessage' },
            ]
        ]
    }
};
class NeverForget {
    constructor(bot) {
        this.bot = bot;
        this.reminders = [];
        this.user = 0;
        this.reminderState = initialReminderState;
    }
    //запуск бота и всех его методов
    init() {
        this.startBot();
        this.listenForCallback();
        this.listenForMessage();
    }
    //обработка команды /start, сохранияем id юзера и показываем ему меню
    startBot() {
        this.bot.onText(/\/start/, (msg) => {
            console.log(msg);
            if (msg.from !== undefined) {
                this.user = msg.from.id;
            }
            return this.bot.sendMessage(this.user, messages_1.default.greeting, menu);
        });
    }
    //слушаем callback_query
    listenForCallback() {
        return __awaiter(this, void 0, void 0, function* () {
            this.bot.on('callback_query', (msg) => {
                let data;
                if (msg.data !== undefined) {
                    data = msg.data;
                    if (data === '/newReminder') {
                        this.reminderState.status = true;
                        this.reminderState.dateSend = true;
                        return this.bot.sendMessage(this.user, 'Введите число в формате ДД.ММ.ГГГГ.');
                    }
                }
                return this.bot.sendMessage(this.user, 'Неизыестная команда, Попробуйте выбрать одну их этих команд:', menu);
            });
        });
    }
    //слушаем сообщения пользователя
    listenForMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            this.bot.on('message', (msg) => {
                const { status } = this.reminderState;
                if (status) {
                    const { dateSend, timeSend, textSend } = this.reminderState;
                    if (msg.text !== undefined) {
                        const text = msg.text.trim();
                        //проверяем дату и сохранияем ее
                        if (dateSend && regexp_1.regDate.test(text)) {
                            //нужно добавить проверку даты, чтобы она была в будущем
                            this.reminderState.date = text;
                            this.reminderState.timeSend = true;
                            return this.bot.sendMessage(this.user, 'Отлично! А теперь введите время в формате ЧЧ:ММ.');
                        }
                        //сохранияем время
                        if (dateSend && timeSend && regexp_1.regTime.test(text)) {
                            this.reminderState.time = text;
                            this.reminderState.textSend = true;
                            return this.bot.sendMessage(this.user, 'Круто! А теперь введите текст напоминания');
                        }
                        //сохранияем текс, сохраняем напоминание и очмщаес стейт
                        if (dateSend && timeSend && textSend) {
                            this.reminderState.text = text;
                            const { date, time } = this.reminderState;
                            this.saveReminder(date, time, text);
                            this.reminderState = initialReminderState;
                            return this.bot.sendMessage(this.user, 'Поздравляю! Напоминание сохранено', menu);
                        }
                        return this.bot.sendMessage(this.user, 'Не совсем Вас понял, попробуйте еще раз!');
                    }
                }
                return this.bot.sendMessage(this.user, 'бла, бла, бла! тупые слова!');
            });
        });
    }
    //сохранияем уведомление
    saveReminder(date, time, reminder) {
        const item = {
            text: reminder,
            id: this.user,
            date: this.getDateFromSting(date, time),
        };
        this.reminders.push(item);
    }
    //проверяем сообщение на соотвествие шаблону
    checkForReminder(str) {
        const d = str.slice(0, 10); // выбираем дату
        const t = str.slice(11, 16); // выбираем время
        const reminder = str.slice(17); // выбираем текст напоминания
        if (regexp_1.regDate.test(d) && regexp_1.regTime.test(t)) {
            return true;
        }
        return false;
    }
    //парсим строку с датой и создаем строку из объекта даты
    getDateFromSting(d, t) {
        const day = +(d.slice(0, 2));
        const month = +(d.slice(3, 5)) - 1;
        const year = +(d.slice(6));
        const hour = +(t.slice(0, 2));
        const mins = +(t.slice(3));
        return (new Date(year, month, day, hour, mins, 0)).toString();
    }
}
exports.default = NeverForget;
;
