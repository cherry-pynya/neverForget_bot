import TelegramApi, {
  Message,
  SendMessageOptions,
} from "node-telegram-bot-api";
import moment from "moment-timezone";
import DataBase from "./DataBase";
import { nanoid } from "nanoid";
import { Document, WithId } from "mongodb";

import { backToMenu, menu, countrySelection } from "./markUps";
import messages from "./messages";
import { regTime, regDate } from "./regexp";
import { Reminder } from "./Interfaces/Reminder/Reminder";
import {
  ReminderState,
  initialReminderState,
} from "./Interfaces/ReminderState/ReminderState";
import MarkUpFactory from "./MarkUpFactory";
import TimeZoneState, {
  initialTimeZoneState,
} from "./Interfaces/TimeZoneState/TimeZoneState";

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
        console.log(e);
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
          //запускваем сохоанение напоминания
          if (data === "/newReminder") {
            this.reminderState.status = true;
            this.reminderState.dateSend = true;
            return this.bot.sendMessage(
              this.user,
              "Введите число в формате ДД.ММ.ГГГГ."
            );
          }
          //возвращанмся в главное меню
          if (data === "/backToMenu") {
            return this.sendMainMenu();
          }
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
            await this.bot.sendMessage(this.user, "Часовой пояс выбран!");
            return this.sendMainMenu();
          }
          //показываем лист всех напоминаний пользователю
          if (data === "/showList") {
            if (this.reminders.length === 0)
              return this.bot.sendMessage(
                this.user,
                "У вас нет сохоаненный напоминаний.",
                menu
              );
            this.reminders.forEach(async (el: Reminder): Promise<void> => {
              await this.bot.sendMessage(this.user, el.text);
            });
            return this.sendMainMenu();
          }
        }
        // если приходит неизвестная команда, то обнуляем стейты и выдаем меню пользователю
        this.relaodStates();
        return this.bot.sendMessage(
          this.user,
          "Неизыестная команда, Попробуйте выбрать одну их этих команд:",
          menu
        );
      } catch (e) {
        console.log(e);
      }
    });
  }
  //слушаем сообщения пользователя
  public listenForReminder(): void {
    this.checkTZexist();
    this.bot.on("message", async (msg): Promise<Message | void> => {
      try {
        const { status }: { status: boolean } = this.reminderState;
        if (status) {
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
                await this.bot.sendMessage(
                  this.user,
                  messages.messahesToFuture
                );
                return this.sendMainMenu();
              }
            }
            //сохранияем текс, сохраняем напоминание и очмщаес стейт
            if (dateSend && timeSend && textSend) {
              this.reminderState.text = text;
              const { date, time }: { date: string; time: string } =
                this.reminderState;
              this.saveReminder(date, time, text);
              this.relaodStates();
              await this.bot.sendMessage(
                this.user,
                "Поздравляю! Напоминание сохранено"
              );
              return this.sendMainMenu();
            }
            return this.bot.sendMessage(
              this.user,
              "Не совсем Вас понял, попробуйте еще раз!"
            );
          }
        }
      } catch (e) {
        console.log(e);
      }
    });
  }
  //проверяем установлен ли часовой пояс
  private checkTZexist(): Promise<Message> | boolean {
    if (this.timeZone === "") {
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
      this.fetchReminders();
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
  // обновляем напоминания
  private async fetchReminders(): Promise<void> {
    this.reminders = [];
    await this.db.findAllReminders(this.user).then((res) => {
      res.forEach((el) => {
        const item: Reminder = {
          userId: el["userId"],
          text: el["text"],
          id: el["id"],
          date: el["date"],
        };
        this.reminders.push(item);
      });
    });
  }

  //запускваем проверку напоминаний
  public checkForReminders(): void {
    setInterval((): void => {
      if (this.user !== 0) {
        const now: moment.Moment = moment().tz(this.timeZone);
        try {
          this.fetchReminders().then(() => {
            this.reminders.forEach(
              async (el: Reminder, index: number): Promise<Message | void> => {
                try {
                  const {
                    date,
                    text,
                    userId,
                    id,
                  }: { date: string; text: string; userId: number; id: string } =
                    el;
                  if (moment(date).tz(this.timeZone).isBefore(now)) {
                    await this.db.deleteReminder(userId, id);
                    await this.bot.sendMessage(this.user, text);
                    await this.sendMainMenu();
                  }
                } catch (e) {
                  console.log(e);
                }
              }
            );
          })
        } catch (e) {
          this.relaodStates();
          this.bot.sendMessage(
            this.user,
            "Упс, что-то пошло не так! Попробуйте еще раз!",
            menu
          );
        }
      }
    }, 10000);
  }
}
