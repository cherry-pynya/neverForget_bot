import TelegramApi, { Message, SendMessageOptions } from 'node-telegram-bot-api';
import moment from 'moment-timezone';

import { backToMenu, menu, countrySelection } from './markUps';
import messages from './messages';
import { regTime, regDate } from './regexp';
import { Reminder } from './Interfaces/Reminder/Reminder';
import { ReminderState, initialReminderState } from './Interfaces/ReminderState/ReminderState';
import MarkUpFactory from './MarkUpFactory';
import TimeZoneState, { initialTimeZoneState } from './Interfaces/TimeZoneState/TimeZoneState';

export default class NeverForget {
    public reminders: Array<Reminder>;
    public user: number;
    public reminderState: ReminderState;
    public timeZone: string;
    private timeZoneState: TimeZoneState;
    private countries: Array<string>;
    constructor(
        public bot: TelegramApi,
    ) {
        this.reminders = [];
        this.user = 0;
        this.reminderState = initialReminderState;
        this.timeZone = '';
        this.timeZoneState = initialTimeZoneState;
        this.countries = ['RU', 'UA', 'BY', 'CN'];
    }

    //запуск бота и всех его методов
    init(): void {
        this.startBot();
        this.listenForCallback();
        this.listenForReminder();
    }

    //обработка команды /start, сохранияем id юзера и показываем ему меню
    startBot(): void {
        this.bot.onText(/\/start/, async (msg): Promise<Message | void> => {
            if (msg.from !== undefined) {
                this.user = msg.from.id;
            }
            await this.bot.sendMessage(this.user, messages.greeting);
            return this.checkTZexist();
        });
    }

    //слушаем callback_query
    async listenForCallback(): Promise<void> {
        this.bot.on('callback_query', async (msg): Promise<Message> => {
            let data: string;
            const { status, countrySelected, timeZoneSelected }: {status: boolean, countrySelected: boolean, timeZoneSelected: boolean} = this.timeZoneState;
            if (msg.data !== undefined) {
                data = msg.data;
                //запускваем сохоанение напоминания
                if (data ==='/newReminder') {
                    console.log(msg)
                    this.reminderState.status = true;
                    this.reminderState.dateSend = true;
                    return this.bot.sendMessage(this.user, 'Введите число в формате ДД.ММ.ГГГГ.');
                }
                //возвращанмся в главное меню
                if (data ==='/backToMenu') {
                    return this.sendMainMenu();
                }
                //выбираем страну для часового пояса
                if (this.countries.includes(data) && status) {
                    this.timeZoneState.countrySelected = true;
                    this.timeZoneState.avalibleZones = moment.tz.zonesForCountry(data);
                    const tzMarkUp: SendMessageOptions = new MarkUpFactory(this.timeZoneState.avalibleZones).doMarkUp();
                    return this.bot.sendMessage(this.user, "Выберите часовой пояс!", tzMarkUp);
                }
                //выбираем и сохраняем часовой пояс и обнудяем стейт часового пояса
                if (status && countrySelected && this.timeZoneState.avalibleZones.includes(data)) {
                    this.timeZoneState.timeZoneSelected = true;
                    this.timeZone = data;
                    this.relaodStates();
                    await this.bot.sendMessage(this.user, 'Часовой пояс выбран!');
                    return this.sendMainMenu();
                }
            }
            return this.bot.sendMessage(this.user, 'Неизыестная команда, Попробуйте выбрать одну их этих команд:', menu);
        });
    }
    //слушаем сообщения пользователя
    async listenForReminder(): Promise<void> {
        this.checkTZexist();
        this.bot.on('message', async (msg): Promise<Message> => {
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
                        //если дата пользователя в прошлом, то обнуляем весь ввод
                        const { date, time }: {date: string, time: string } = this.reminderState;
                        if (this.compareDate(this.getDateFromSting(date, time))) {
                            return this.bot.sendMessage(this.user, 'Круто! А теперь введите текст напоминания');
                        } else {
                            this.relaodStates();
                            await this.bot.sendMessage(this.user, messages.messahesToFuture);
                            return this.sendMainMenu();
                        }                        
                    }
                    //сохранияем текс, сохраняем напоминание и очмщаес стейт
                    if (dateSend && timeSend && textSend) {
                        this.reminderState.text = text;
                        const { date, time }: {date: string, time: string } = this.reminderState
                        this.saveReminder(date, time, text);
                        this.relaodStates();
                        await this.bot.sendMessage(this.user, 'Поздравляю! Напоминание сохранено');
                        return this.sendMainMenu();
                    }
                    return this.bot.sendMessage(this.user, 'Не совсем Вас понял, попробуйте еще раз!');
                }
            }
            return this.bot.sendMessage(this.user, 'Упс, что-то пошло не так!', backToMenu);
        });
    }
    //проверяем установлен ли часовой пояс
    private async checkTZexist():Promise<Message | void>  {
        if (this.timeZone === '') {
            this.relaodStates();
            this.timeZoneState.status = true;
            return this.bot.sendMessage(this.user, messages.timeZone, countrySelection);
        }
    }

    //пирсылаем пользователю главное меню
    private async sendMainMenu(): Promise<Message> {
        return this.bot.sendMessage(this.user, messages.main, menu);
    }

    //обгуляем все стейты
    private relaodStates(): void {
        this.timeZoneState = initialTimeZoneState;
        this.reminderState = initialReminderState;
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

    //парсим строку с датой и создаем строку из объекта даты
    public getDateFromSting(d: string, t: string): string {
        const day: number = +(d.slice(0, 2));
        const month: number = +(d.slice(3, 5)) - 1;
        const year: number = +(d.slice(6));
        const hour: number = +(t.slice(0, 2));
        const mins: number = +(t.slice(3));
        return (new Date(year, month, day, hour, mins, 0)).toString();
    }

    //проверям будущая ли дата
    public compareDate(date: string): boolean {
        const now = new Date();
        const compared = new Date(date);
        return compared > now;
    }
};
