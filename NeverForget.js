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
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const markUps_1 = require("./markUps");
const messages_1 = __importDefault(require("./messages"));
const regexp_1 = require("./regexp");
const ReminderState_1 = require("./Interfaces/ReminderState/ReminderState");
const MarkUpFactory_1 = __importDefault(require("./MarkUpFactory"));
const TimeZoneState_1 = require("./Interfaces/TimeZoneState/TimeZoneState");
class NeverForget {
    constructor(bot) {
        this.bot = bot;
        this.reminders = [];
        this.user = 0;
        this.reminderState = ReminderState_1.initialReminderState;
        this.timeZone = '';
        this.timeZoneState = TimeZoneState_1.initialTimeZoneState;
        this.countries = ['RU', 'UA', 'BY', 'CN'];
    }
    //запуск бота и всех его методов
    init() {
        this.startBot();
        this.listenForCallback();
        this.listenForReminder();
    }
    //обработка команды /start, сохранияем id юзера и показываем ему меню
    startBot() {
        this.bot.onText(/\/start/, (msg) => __awaiter(this, void 0, void 0, function* () {
            if (msg.from !== undefined) {
                this.user = msg.from.id;
            }
            yield this.bot.sendMessage(this.user, messages_1.default.greeting);
            return this.checkTZexist();
        }));
    }
    //слушаем callback_query
    listenForCallback() {
        return __awaiter(this, void 0, void 0, function* () {
            this.bot.on('callback_query', (msg) => __awaiter(this, void 0, void 0, function* () {
                let data;
                const { status, countrySelected, timeZoneSelected } = this.timeZoneState;
                if (msg.data !== undefined) {
                    data = msg.data;
                    //запускваем сохоанение напоминания
                    if (data === '/newReminder') {
                        console.log(msg);
                        this.reminderState.status = true;
                        this.reminderState.dateSend = true;
                        return this.bot.sendMessage(this.user, 'Введите число в формате ДД.ММ.ГГГГ.');
                    }
                    //возвращанмся в главное меню
                    if (data === '/backToMenu') {
                        return this.sendMainMenu();
                    }
                    //выбираем страну для часового пояса
                    if (this.countries.includes(data) && status) {
                        this.timeZoneState.countrySelected = true;
                        this.timeZoneState.avalibleZones = moment_timezone_1.default.tz.zonesForCountry(data);
                        const tzMarkUp = new MarkUpFactory_1.default(this.timeZoneState.avalibleZones).doMarkUp();
                        return this.bot.sendMessage(this.user, "Выберите часовой пояс!", tzMarkUp);
                    }
                    //выбираем и сохраняем часовой пояс и обнудяем стейт часового пояса
                    if (status && countrySelected && this.timeZoneState.avalibleZones.includes(data)) {
                        this.timeZoneState.timeZoneSelected = true;
                        this.timeZone = data;
                        this.relaodStates();
                        yield this.bot.sendMessage(this.user, 'Часовой пояс выбран!');
                        return this.sendMainMenu();
                    }
                }
                return this.bot.sendMessage(this.user, 'Неизыестная команда, Попробуйте выбрать одну их этих команд:', markUps_1.menu);
            }));
        });
    }
    //слушаем сообщения пользователя
    listenForReminder() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkTZexist();
            this.bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
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
                            //если дата пользователя в прошлом, то обнуляем весь ввод
                            const { date, time } = this.reminderState;
                            if (this.compareDate(this.getDateFromSting(date, time))) {
                                return this.bot.sendMessage(this.user, 'Круто! А теперь введите текст напоминания');
                            }
                            else {
                                this.relaodStates();
                                yield this.bot.sendMessage(this.user, messages_1.default.messahesToFuture);
                                return this.sendMainMenu();
                            }
                        }
                        //сохранияем текс, сохраняем напоминание и очмщаес стейт
                        if (dateSend && timeSend && textSend) {
                            this.reminderState.text = text;
                            const { date, time } = this.reminderState;
                            this.saveReminder(date, time, text);
                            this.relaodStates();
                            yield this.bot.sendMessage(this.user, 'Поздравляю! Напоминание сохранено');
                            return this.sendMainMenu();
                        }
                        return this.bot.sendMessage(this.user, 'Не совсем Вас понял, попробуйте еще раз!');
                    }
                }
                return this.bot.sendMessage(this.user, 'Упс, что-то пошло не так!', markUps_1.backToMenu);
            }));
        });
    }
    //проверяем установлен ли часовой пояс
    checkTZexist() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.timeZone === '') {
                this.relaodStates();
                this.timeZoneState.status = true;
                return this.bot.sendMessage(this.user, messages_1.default.timeZone, markUps_1.countrySelection);
            }
        });
    }
    //пирсылаем пользователю главное меню
    sendMainMenu() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bot.sendMessage(this.user, messages_1.default.main, markUps_1.menu);
        });
    }
    //обгуляем все стейты
    relaodStates() {
        this.timeZoneState = TimeZoneState_1.initialTimeZoneState;
        this.reminderState = ReminderState_1.initialReminderState;
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
    //парсим строку с датой и создаем строку из объекта даты
    getDateFromSting(d, t) {
        const day = +(d.slice(0, 2));
        const month = +(d.slice(3, 5)) - 1;
        const year = +(d.slice(6));
        const hour = +(t.slice(0, 2));
        const mins = +(t.slice(3));
        return (new Date(year, month, day, hour, mins, 0)).toString();
    }
    //проверям будущая ли дата
    compareDate(date) {
        const now = new Date();
        const compared = new Date(date);
        return compared > now;
    }
}
exports.default = NeverForget;
;
