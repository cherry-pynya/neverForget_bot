import TelegramApi, { SendMessageOptions, Message } from 'node-telegram-bot-api';
import messages from './messages';
import { regTime, regDate } from './regexp';

interface Reminder {
    date: string,
    text: string,
    id: number,
}

interface ReminderState {
    status: boolean
    dateSend: boolean
    date: string
    timeSend: boolean
    time: string
    textSend: boolean
    text: string
}

const initialReminderState: ReminderState = {
    status: false,
    dateSend: false,
    date: '',
    timeSend: false,
    time: '',
    textSend: false,
    text: ''
}

const menu: SendMessageOptions = {
    "reply_markup": {
        inline_keyboard:  [
            [
                {text: 'Новое напоминание', callback_data: '/newReminder'},
                {text: 'Настройки', callback_data: '/settings'},
                {text: 'Показать все напоминания', callback_data: '/showList'},
                {text: 'Удалить напоминание', callback_data: '/deleteMessage'},
            ]
        ]
    }
}

export default class NeverForget {
    public reminders: Array<Reminder>;
    public user: number;
    public reminderState: ReminderState
    constructor(
        public bot: TelegramApi,
    ) {
        this.reminders = [];
        this.user = 0;
        this.reminderState = initialReminderState;
    }

    //запуск бота и всех его методов
    init(): void {
        this.startBot();
        this.listenForCallback();
        this.listenForMessage();
    }

    //обработка команды /start, сохранияем id юзера и показываем ему меню
    startBot(): void {
        this.bot.onText(/\/start/, (msg): Promise<Message> => {
            console.log(msg)
            if (msg.from !== undefined) {
                this.user = msg.from.id;
            }
            return this.bot.sendMessage(this.user, messages.greeting, menu);
        });
    }

    //слушаем callback_query
    async listenForCallback(): Promise<void> {
        this.bot.on('callback_query', (msg): Promise<Message> => {
            let data: string;
            if (msg.data !== undefined) {
                data = msg.data;
                if (data ==='/newReminder') {
                    this.reminderState.status = true;
                    this.reminderState.dateSend = true;
                    return this.bot.sendMessage(this.user, 'Введите число в формате ДД.ММ.ГГГГ.');
                }
            }
            return this.bot.sendMessage(this.user, 'Неизыестная команда, Попробуйте выбрать одну их этих команд:', menu);
        });
    }
    //слушаем сообщения пользователя
    async listenForMessage(): Promise<void> {
        this.bot.on('message', (msg): Promise<Message> => {
            const { status }: { status: boolean } = this.reminderState; 
            if (status) {
                const { dateSend, timeSend, textSend }: { dateSend: boolean, timeSend: boolean, textSend: boolean  } = this.reminderState; 
                if (msg.text !== undefined) {
                    const text: string = msg.text.trim();
                    //проверяем дату и сохранияем ее
                    if (dateSend && regDate.test(text)) {
                        //нужно добавить проверку даты, чтобы она была в будущем
                        this.reminderState.date = text;
                        this.reminderState.timeSend = true;
                        return this.bot.sendMessage(this.user, 'Отлично! А теперь введите время в формате ЧЧ:ММ.');
                    }
                    //сохранияем время
                    if (dateSend && timeSend && regTime.test(text)) {
                        this.reminderState.time = text;
                        this.reminderState.textSend = true;
                        return this.bot.sendMessage(this.user, 'Круто! А теперь введите текст напоминания');
                    }
                    //сохранияем текс, сохраняем напоминание и очмщаес стейт
                    if (dateSend && timeSend && textSend) {
                        this.reminderState.text = text;
                        const { date, time }: {date: string, time: string } = this.reminderState
                        this.saveReminder(date, time, text);
                        this.reminderState = initialReminderState;
                        return this.bot.sendMessage(this.user, 'Поздравляю! Напоминание сохранено', menu);
                    }
                    return this.bot.sendMessage(this.user, 'Не совсем Вас понял, попробуйте еще раз!');
                }
            }
            return this.bot.sendMessage(this.user, 'бла, бла, бла! тупые слова!');
        });
    }

    //сохранияем уведомление
    private saveReminder(date: string, time: string, reminder: string): void {
        const item: Reminder = {
            text: reminder,
            id: this.user,
            date: this.getDateFromSting(date, time),
        }
        this.reminders.push(item);
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
    //парсим строку с датой и создаем строку из объекта даты
    public getDateFromSting(d: string, t: string): string {
        const day: number = +(d.slice(0, 2));
        const month: number = +(d.slice(3, 5)) - 1;
        const year: number = +(d.slice(6));
        const hour: number = +(t.slice(0, 2));
        const mins: number = +(t.slice(3));
        return (new Date(year, month, day, hour, mins, 0)).toString();
    }
};
