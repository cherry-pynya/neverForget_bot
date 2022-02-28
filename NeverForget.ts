import TelegramApi, {
  Message,
  SendMessageOptions,
} from "node-telegram-bot-api";
import moment from "moment-timezone";
import DataBase from "./DataBase";
import { nanoid } from "nanoid";

import { menu, countrySelection } from "./markUps";
import messages from "./messages";
import { regTime, regDate, regDeleteReminder } from "./regexp";
import { Reminder } from "./Interfaces/Reminder/Reminder";
import {
  ReminderState,
  initialReminderState,
} from "./Interfaces/ReminderState/ReminderState";
import MarkUpFactory from "./MarkUpFactory";
import TimeZoneState, {
  initialTimeZoneState,
} from "./Interfaces/TimeZoneState/TimeZoneState";
import { comamds } from "./comands";

export default class NeverForget {
  private db: DataBase;
  public reminders: Array<Reminder>;
  public user: number;
  public reminderState: ReminderState;
  public timeZone: string;
  private timeZoneState: TimeZoneState;
  private countries: Array<string>;
  constructor(public bot: TelegramApi, db: DataBase) {
    this.reminders = [];
    this.user = 0;
    this.reminderState = initialReminderState;
    this.timeZone = "";
    this.timeZoneState = initialTimeZoneState;
    this.countries = ["RU", "UA", "BY", "CN"];
    this.db = db;
  }

  //запуск бота и всех его методов
  public init(): void {
    this.db.init();
    this.startBot();
    this.listemComands();
    this.listenForCallback();
    this.listenForReminder();
    this.checkForReminders();
  }

  //обработка команды /start, сохранияем id юзера и показываем ему меню
  public startBot(): void {
    this.bot.onText(/\/start/, async (msg): Promise<Message | void> => {
      try {
        if (msg.from !== undefined) {
          this.user = msg.from.id;
        }
        await this.bot.sendMessage(this.user, messages.greeting);
        this.timeZoneState.status = true;
        return this.bot.sendMessage(
          this.user,
          messages.timeZone,
          countrySelection
        );
      } catch (e) {
        console.log('startBot');
      }
    });
  }
  //слушаем команды
  public listemComands(): void {
    this.bot.onText(/\/cancel/, async (msg): Promise<Message | void> => {
      try {
        this.checkTZexist();
        this.relaodStates();
      return this.bot.sendMessage(this.user, 'Все действия отменены!');
      } catch (e) {
        return this.bot.sendMessage(this.user, 'Что-то пошло не так! Попробуй еще раз!');
      }
    });
    //запускаем создание нового уведомления
    this.bot.onText(/\/newreminder/, async (msg): Promise<Message | void> => {
      try {
        this.checkTZexist();
        this.reminderState.status = true;
        this.reminderState.dateSend = true;
        return this.bot.sendMessage(
          this.user,
          "Введите число в формате ДД.ММ.ГГГГ."
        );
      } catch (e) {
        return this.bot.sendMessage(this.user, 'Что-то пошло не так! Попробуй еще раз!');
      }
    });
    //показываем список напоминаний
    this.bot.onText(/\/showlist/, async (msg): Promise<Message | void> => {
      try {
        this.checkTZexist();
        this.db.findAllReminders(this.user).then(async (reminders: Array<Reminder>): Promise<void | Message> => {
          //если напоминаний нет
          if (reminders.length === 0) {
            return this.bot.sendMessage(this.user, 'У вас нет сохраненных напоминаний!')
          }
          for (let i = 0; i < reminders.length; i++) {
            const {
              date,
              text,
              id
            }: { date: string, text: string, id: string } =
              reminders[i];
            const formatedDate: string = moment(date).tz(this.timeZone).locale('ru').format('LLLL');
            await this.bot.sendMessage(this.user, `Напоминаие № раз\n${formatedDate}\n${text}`, this.createDeleteMarkUp(id));
          }
        });
      } catch (e) {
        return this.bot.sendMessage(this.user, 'Что-то пошло не так! Попробуй еще раз!');
      }
    });
    //меняем часовой пояс
    this.bot.onText(/\/changezone/, async (msg): Promise<Message | void> => {
      try {
        this.timeZoneState.status = true;
        return this.bot.sendMessage(
          this.user,
          'Выберите страну',
          countrySelection
        );
      } catch (e) {
        return this.bot.sendMessage(this.user, 'Что-то пошло не так! Попробуй еще раз!');
      }
    });
  }

  //слушаем callback_query
  public listenForCallback(): void {
    this.bot.on("callback_query", async (msg): Promise<Message | void> => {
      try {
        let data: string;
        const {
          status,
          countrySelected,
        }: {
          status: boolean;
          countrySelected: boolean;
          timeZoneSelected: boolean;
        } = this.timeZoneState;
        if (msg.data !== undefined) {
          data = msg.data;
          //выбираем страну для часового пояса
          if (this.countries.includes(data) && status) {
            this.timeZoneState.countrySelected = true;
            this.timeZoneState.avalibleZones = moment.tz.zonesForCountry(data);
            const tzMarkUp: SendMessageOptions = new MarkUpFactory(
              this.timeZoneState.avalibleZones
            ).doMarkUp();
            return this.bot.sendMessage(
              this.user,
              "Выберите часовой пояс!",
              tzMarkUp
            );
          }
          //выбираем и сохраняем часовой пояс и обнудяем стейт часового пояса
          if (
            status &&
            countrySelected &&
            this.timeZoneState.avalibleZones.includes(data)
          ) {
            this.timeZoneState.timeZoneSelected = true;
            this.timeZone = data;
            this.relaodStates();
            return this.bot.sendMessage(this.user, "Часовой пояс выбран!");
          }
          if (regDeleteReminder.test(data)) {
            const id: string = data.slice(15);
            try {
              this.db.deleteReminder(id);
              await this.bot.sendMessage(this.user, 'Напоминание удалено!')
            } catch (e) {
              return this.bot.sendMessage(
                this.user,
                "Что-то пошло не так!",
                menu
              );
            }
          }
          //это нужно чтобы не отрабатывал блок "неизвестная команда"
          return undefined;
        }
      } catch (e) {
        console.log('listenForCallback');
        return this.bot.sendMessage(this.user, 'Что-то пошло не так! Попробуй еще раз!');
      }
    });
  }

  private createDeleteMarkUp(id: string): SendMessageOptions {
    const mk: SendMessageOptions = {
      "reply_markup": {
        inline_keyboard: [
          [
            { text: 'Удалить это напоминание', callback_data: `/deleteReminder${id}` }
          ],
        ]
      }
    }
    return mk;
  }

  //слушаем сообщения пользователя
  public listenForReminder(): void {
    this.bot.on("message", async (msg): Promise<Message | void> => {
      try {
        const reminderStatus: boolean = this.reminderState.status;
        const timeZoneStatus: boolean = this.timeZoneState.status;
        if (reminderStatus) {
          this.checkTZexist();
          const {
            dateSend,
            timeSend,
            textSend,
          }: { dateSend: boolean; timeSend: boolean; textSend: boolean } =
            this.reminderState;
          if (msg.text !== undefined) {
            const text: string = msg.text.trim();
            //проверяем дату и сохранияем ее
            if (dateSend && regDate.test(text)) {
              //нужно добавить проверку даты, чтобы она была в будущем
              this.reminderState.date = text;
              this.reminderState.timeSend = true;
              return this.bot.sendMessage(
                this.user,
                "Отлично! А теперь введите время в формате ЧЧ:ММ."
              );
            }
            //сохранияем время
            if (dateSend && timeSend && regTime.test(text)) {
              this.reminderState.time = text;
              this.reminderState.textSend = true;
              //если дата пользователя в прошлом, то обнуляем весь ввод
              const { date, time }: { date: string; time: string } =
                this.reminderState;
              if (this.compareDate(this.getDateFromSting(date, time))) {
                return this.bot.sendMessage(
                  this.user,
                  "Круто! А теперь введите текст напоминания"
                );
              } else {
                this.relaodStates();
                return this.bot.sendMessage(
                  this.user,
                  messages.messahesToFuture
                );
              }
            }
            //сохранияем текс, сохраняем напоминание и очищаем стейт
            if (dateSend && timeSend && textSend) {
              this.reminderState.text = text;
              const { date, time }: { date: string; time: string } =
                this.reminderState;
              this.saveReminder(date, time, text);
              this.relaodStates();
              return this.bot.sendMessage(
                this.user,
                "Поздравляю! Напоминание сохранено"
              );
            }
            if (!comamds.includes(text) && reminderStatus) {
              console.log(comamds.includes(text));
              return this.bot.sendMessage(
                this.user,
                "Не совсем Вас понял, попробуйте еще раз!"
              );
            }
          }
        }
        if (timeZoneStatus) {
          return this.bot.sendMessage(this.user, 'Сначала нужно выбрать часовой пояс!')
        }
      } catch (e) {
        this.relaodStates();
        console.log('listenForReminder');
        this.bot.sendMessage(this.user, 'Упс! Что-то пошло не так!')
      }
    });
  }

  //проверяем установлен ли часовой пояс
  private checkTZexist(): Promise<Message> | boolean {
    if (this.timeZone === "" && !this.timeZoneState.status) {
      this.relaodStates();
      this.timeZoneState.status = true;
      return this.bot.sendMessage(
        this.user,
        messages.timeZone,
        countrySelection
      );
    }
    return false;
  }

  //пирсылаем пользователю главное меню
  private sendMainMenu(): Promise<Message> {
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
      userId: this.user,
      date: this.getDateFromSting(date, time),
      id: nanoid(),
    };
    try {
      this.db.addReminder(item);
    } catch (e) {
      this.relaodStates();
      this.bot.sendMessage(
        this.user,
        "Упс, что-то пошло не так! Попробуйте еще раз!",
        menu
      );
    }
  }

  //парсим строку с датой и создаем строку в подходящем формате для moment
  public getDateFromSting(d: string, t: string): string {
    const day: number = +d.slice(0, 2);
    const month: number = +d.slice(3, 5);
    const year: number = +d.slice(6);
    const hour: number = +t.slice(0, 2);
    const mins: number = +t.slice(3);
    return `${year}-${month}-${day} ${hour}:${mins}`;
  }

  //проверям будущая ли дата
  public compareDate(date: string): boolean {
    const now = new Date();
    const compared = new Date(date);
    return compared > now;
  }

  //запускваем проверку напоминаний
  public checkForReminders(): void {
    setInterval((): void => {
      if (this.user !== 0 && this.timeZone !== '') {
        try {
          this.db.findAllReminders(this.user).then((arr) => {
            this.sendReminders(arr);
          });
        } catch (e) {
          this.relaodStates();
          this.bot.sendMessage(
            this.user,
            "Упс, что-то пошло не так! Попробуйте еще раз!",
            menu
          );
        }
      }
    }, 60000);
  }

  // получаем массив активных напоминаний и отправляем просроченные 
  public async sendReminders(arr: Array<Reminder>): Promise<void> {
    const now: moment.Moment = moment().tz(this.timeZone);
    for (let i = 0; i < arr.length; i++) {
      const {
        date,
        text,
        id,
      }: { date: string, text: string, id: string } =
        arr[i];
      if (moment(date).tz(this.timeZone).isBefore(now)) {

        await this.db.deleteReminder(id);
        const message: string = `Сегодня в ${moment(date).tz(this.timeZone).locale('ru').format('LT')} вы хотели: ${text}`
        await this.bot.sendMessage(this.user, message);
      }
    }
  }
}
