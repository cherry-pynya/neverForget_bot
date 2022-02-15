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
Object.defineProperty(exports, "__esModule", { value: true });
class DataBase {
    constructor(db) {
        this.db = db;
    }
    //подключаемся к базе данных
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.db.connect();
                this.users = this.db.db().collection('users');
                this.reminders = this.db.db().collection('reminders');
                console.log('DB conected!');
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    // сохранияем напоминание в базу
    addReminder(item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.reminders.insertOne(item);
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    // добавляем юзера в базу
    addUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.users.insertOne(user);
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    // получаем массив напоминаний
    findAllReminders(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = [];
            try {
                const remiders = this.reminders.find({ "userId": id });
                if ((yield remiders.count()) === 0) {
                    return result;
                }
                return remiders.toArray();
            }
            catch (e) {
                console.log(e);
            }
            return result;
        });
    }
    //удаляем напоминнаие
    deleteReminder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.reminders.deleteOne({ id });
            }
            catch (e) {
                console.log(e);
            }
        });
    }
}
exports.default = DataBase;
