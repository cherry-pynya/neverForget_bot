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
const nanoid_1 = require("nanoid");
const markUps_1 = require("./markUps");
const messages_1 = __importDefault(require("./messages"));
const regexp_1 = require("./regexp");
const ReminderState_1 = require("./Interfaces/ReminderState/ReminderState");
const MarkUpFactory_1 = __importDefault(require("./MarkUpFactory"));
const TimeZoneState_1 = require("./Interfaces/TimeZoneState/TimeZoneState");
class NeverForget {
    constructor(bot, db) {
        this.bot = bot;
        this.reminders = [];
        this.user = 0;
        this.reminderState = ReminderState_1.initialReminderState;
        this.timeZone = "";
        this.timeZoneState = TimeZoneState_1.initialTimeZoneState;
        this.countries = ["RU", "UA", "BY", "CN"];
        this.db = db;
    }
    //запуск бота и всех его методов
    init() {
        this.db.init();
        this.startBot();
        this.listenForCallback();
        this.listenForReminder();
        this.checkForReminders();
    }
    //обработка команды /start, сохранияем id юзера и показываем ему меню
    startBot() {
        this.bot.onText(/\/start/, (msg) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (msg.from !== undefined) {
                    this.user = msg.from.id;
                }
                yield this.bot.sendMessage(this.user, messages_1.default.greeting);
                this.timeZoneState.status = true;
                return this.bot.sendMessage(this.user, messages_1.default.timeZone, markUps_1.countrySelection);
            }
            catch (e) {
                console.log(e);
            }
        }));
    }
    //слушаем callback_query
    listenForCallback() {
        this.bot.on("callback_query", (msg) => __awaiter(this, void 0, void 0, function* () {
            try {
                let data;
                const { status, countrySelected, } = this.timeZoneState;
                if (msg.data !== undefined) {
                    data = msg.data;
                    //запускваем сохоанение напоминания
                    if (data === "/newReminder") {
                        this.reminderState.status = true;
                        this.reminderState.dateSend = true;
                        return this.bot.sendMessage(this.user, "Введите число в формате ДД.ММ.ГГГГ.");
                    }
                    //возвращанмся в главное меню
                    if (data === "/backToMenu") {
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
                    if (status &&
                        countrySelected &&
                        this.timeZoneState.avalibleZones.includes(data)) {
                        this.timeZoneState.timeZoneSelected = true;
                        this.timeZone = data;
                        this.relaodStates();
                        yield this.bot.sendMessage(this.user, "Часовой пояс выбран!");
                        return this.sendMainMenu();
                    }
                    //показываем лист всех напоминаний пользователю
                    if (data === "/showList") {
                        try {
                            this.db.findAllReminders(this.user).then((reminders) => __awaiter(this, void 0, void 0, function* () {
                                //если напоминаний нет
                                if (reminders.length === 0) {
                                    yield this.bot.sendMessage(this.user, 'У вас нет сохраненных напоминаний!');
                                    yield this.sendMainMenu();
                                }
                                for (let i = 0; i < reminders.length; i++) {
                                    const { date, text, id } = reminders[i];
                                    const formatedDate = (0, moment_timezone_1.default)(date).tz(this.timeZone).locale('ru').format('LLLL');
                                    yield this.bot.sendMessage(this.user, `Напоминаие № раз\n${formatedDate}\n${text}`, this.createDeleteMarkUp(id));
                                }
                                yield this.sendMainMenu();
                            }));
                        }
                        catch (e) {
                            return this.bot.sendMessage(this.user, "Что-то пошло не так!", markUps_1.menu);
                        }
                        //это нужно чтобы не отрабатывал блок "неизвестная команда"
                        return undefined;
                    }
                    if (regexp_1.regDeleteReminder.test(data)) {
                        const id = data.slice(15);
                        try {
                            this.db.deleteReminder(id);
                            yield this.bot.sendMessage(this.user, 'Напоминание удалено!');
                            return this.sendMainMenu();
                        }
                        catch (e) {
                            return this.bot.sendMessage(this.user, "Что-то пошло не так!", markUps_1.menu);
                        }
                    }
                    //это нужно чтобы не отрабатывал блок "неизвестная команда"
                    return undefined;
                }
                // если приходит неизвестная команда, то обнуляем стейты и выдаем меню пользователю
                // блок неизвестная команда
                this.relaodStates();
                return this.bot.sendMessage(this.user, "Неизыестная команда, Попробуйте выбрать одну их этих команд:", markUps_1.menu);
            }
            catch (e) {
                console.log(e);
            }
        }));
    }
    createDeleteMarkUp(id) {
        const mk = {
            "reply_markup": {
                inline_keyboard: [
                    [
                        { text: 'Удалить это напоминание', callback_data: `/deleteReminder${id}` }
                    ],
                ]
            }
        };
        return mk;
    }
    //слушаем сообщения пользователя
    listenForReminder() {
        this.bot.on("message", (msg) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { status } = this.reminderState;
                if (status) {
                    const { dateSend, timeSend, textSend, } = this.reminderState;
                    if (msg.text !== undefined) {
                        const text = msg.text.trim();
                        //проверяем дату и сохранияем ее
                        if (dateSend && regexp_1.regDate.test(text)) {
                            //нужно добавить проверку даты, чтобы она была в будущем
                            this.reminderState.date = text;
                            this.reminderState.timeSend = true;
                            return this.bot.sendMessage(this.user, "Отлично! А теперь введите время в формате ЧЧ:ММ.");
                        }
                        //сохранияем время
                        if (dateSend && timeSend && regexp_1.regTime.test(text)) {
                            this.reminderState.time = text;
                            this.reminderState.textSend = true;
                            //если дата пользователя в прошлом, то обнуляем весь ввод
                            const { date, time } = this.reminderState;
                            if (this.compareDate(this.getDateFromSting(date, time))) {
                                return this.bot.sendMessage(this.user, "Круто! А теперь введите текст напоминания");
                            }
                            else {
                                this.relaodStates();
                                yield this.bot.sendMessage(this.user, messages_1.default.messahesToFuture);
                                return this.sendMainMenu();
                            }
                        }
                        //сохранияем текс, сохраняем напоминание и очищаем стейт
                        if (dateSend && timeSend && textSend) {
                            this.reminderState.text = text;
                            const { date, time } = this.reminderState;
                            this.saveReminder(date, time, text);
                            this.relaodStates();
                            yield this.bot.sendMessage(this.user, "Поздравляю! Напоминание сохранено");
                            return this.sendMainMenu();
                        }
                        return this.bot.sendMessage(this.user, "Не совсем Вас понял, попробуйте еще раз!");
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
        }));
    }
    //проверяем установлен ли часовой пояс
    checkTZexist() {
        if (this.timeZone === "") {
            this.relaodStates();
            this.timeZoneState.status = true;
            return this.bot.sendMessage(this.user, messages_1.default.timeZone, markUps_1.countrySelection);
        }
        return false;
    }
    //пирсылаем пользователю главное меню
    sendMainMenu() {
        return this.bot.sendMessage(this.user, messages_1.default.main, markUps_1.menu);
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
            userId: this.user,
            date: this.getDateFromSting(date, time),
            id: (0, nanoid_1.nanoid)(),
        };
        try {
            this.db.addReminder(item);
        }
        catch (e) {
            this.relaodStates();
            this.bot.sendMessage(this.user, "Упс, что-то пошло не так! Попробуйте еще раз!", markUps_1.menu);
        }
    }
    //парсим строку с датой и создаем строку в подходящем формате для moment
    getDateFromSting(d, t) {
        const day = +d.slice(0, 2);
        const month = +d.slice(3, 5);
        const year = +d.slice(6);
        const hour = +t.slice(0, 2);
        const mins = +t.slice(3);
        return `${year}-${month}-${day} ${hour}:${mins}`;
    }
    //проверям будущая ли дата
    compareDate(date) {
        const now = new Date();
        const compared = new Date(date);
        return compared > now;
    }
    //запускваем проверку напоминаний
    checkForReminders() {
        setInterval(() => {
            if (this.user !== 0 && this.timeZone !== '') {
                try {
                    this.db.findAllReminders(this.user).then((arr) => {
                        console.log(arr);
                        this.sendReminders(arr);
                    });
                }
                catch (e) {
                    this.relaodStates();
                    this.bot.sendMessage(this.user, "Упс, что-то пошло не так! Попробуйте еще раз!", markUps_1.menu);
                }
            }
        }, 60000);
    }
    // получаем массив активных напоминаний и отправляем просроченные 
    sendReminders(arr) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = (0, moment_timezone_1.default)().tz(this.timeZone);
            for (let i = 0; i < arr.length; i++) {
                const { date, text, id, } = arr[i];
                if ((0, moment_timezone_1.default)(date).tz(this.timeZone).isBefore(now)) {
                    yield this.db.deleteReminder(id);
                    const message = `Сегодня в ${(0, moment_timezone_1.default)(date).tz(this.timeZone).locale('ru').format('LT')} вы хотели: ${text}`;
                    yield this.bot.sendMessage(this.user, message);
                }
            }
        });
    }
}
exports.default = NeverForget;
