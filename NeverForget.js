"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = __importDefault(require("./messages"));
const regexp_1 = require("./regexp");
const settings = {
    "reply_markup": JSON.stringify({
        inline_keyboard: [
            [{ text: 'Настроить', callback_data: '/settings' }]
        ]
    })
};
class NeverForget {
    constructor(bot) {
        this.bot = bot;
        this.reminders = [];
        this.user = 0;
    }
    init() {
        this.startBot();
        this.setReminder();
    }
    startBot() {
        this.bot.onText(/\/start/, (msg) => {
            if (msg.from !== undefined) {
                this.user = msg.from.id;
            }
            this.bot.sendMessage(this.user, messages_1.default.greeting, settings);
        });
        this.bot.on('callback_query', (msg) => {
            console.log(msg);
        });
    }
    setReminder() {
        this.bot.on('message', (msg) => {
            this.bot.sendMessage(this.user, 'выбери дату');
        });
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
    //парсим строку с датой и создаем объект даты
    getStringForDate(d, t) {
        const day = +(d.slice(0, 2));
        const month = +(d.slice(3, 5)) - 1;
        const year = +(d.slice(6));
        const hour = +(t.slice(0, 2));
        const mins = +(t.slice(3));
        return new Date(year, month, day, hour, mins, 0);
    }
}
exports.default = NeverForget;
;
