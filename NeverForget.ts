import TelegramApi from 'node-telegram-bot-api';
import messages from './messages';
import { regTime, regDate } from './regexp';

interface Reminder {
    date: Date,
    reminder: string
}

const settings = {
    "reply_markup": JSON.stringify({
        inline_keyboard: [
            [{text: 'Настроить', callback_data: '/settings'}]
        ]
    })
}

export default class NeverForget {
    public reminders: Array<Reminder>;
    public user: number;
    constructor(
        public bot: TelegramApi,
    ) {
        this.reminders = [];
        this.user = 0;
    }

    init(): void {
        this.startBot();
        this.setReminder();
    }

    startBot(): void {
        this.bot.onText(/\/start/, (msg): void => {
            if (msg.from !== undefined) {
                this.user = msg.from.id;
            }
            this.bot.sendMessage(this.user, messages.greeting, settings as any);
        });
        this.bot.on('callback_query', (msg): void => {
            console.log(msg)
        });
    }

    setReminder(): void {
        this.bot.on('message', (msg): void => {
            this.bot.sendMessage(this.user, 'выбери дату');
        });
    }

    //проверяем сообщение на соотвествие шаблону
    checkForReminder(str: string): boolean {
        const d: string = str.slice(0, 10) // выбираем дату
        const t: string = str.slice(11, 16) // выбираем время
        const reminder: string = str.slice(17) // выбираем текст напоминания
        if (regDate.test(d) && regTime.test(t)) {
            return true;
        }
        return false;
    }
    //парсим строку с датой и создаем объект даты
    getStringForDate(d: string, t: string): Date {
        const day: number = +(d.slice(0, 2));
        const month: number = +(d.slice(3, 5)) - 1;
        const year: number = +(d.slice(6));
        const hour: number = +(t.slice(0, 2));
        const mins: number = +(t.slice(3));
        return new Date(year, month, day, hour, mins, 0);
    }
};
