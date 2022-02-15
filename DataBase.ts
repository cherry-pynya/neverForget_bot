import { MongoClient, Collection, Document, FindCursor, WithId, ObjectId } from 'mongodb';
import { Reminder } from './Interfaces/Reminder/Reminder';
import User from './Interfaces/User/User';

export default class DataBase {
    private db: MongoClient;
    private users!: Collection<User>;
    private reminders!: Collection<Reminder>;
    constructor(db: MongoClient) {
        this.db = db;
    }

    //подключаемся к базе данных
    public async init(): Promise<void> {
        try {
            await this.db.connect();
            this.users = this.db.db().collection<User>('users');
            this.reminders = this.db.db().collection<Reminder>('reminders');
            console.log('DB conected!');
        } catch(e) {
            console.log(e);
        }
    }
    // сохранияем напоминание в базу
    public async addReminder(item: Reminder): Promise<void> {
        try {
            await this.reminders.insertOne(item);
        } catch(e) {
            console.log(e);
        }
    }
    // добавляем юзера в базу
    public async addUser(user: User): Promise<void> {
        try {
            await this.users.insertOne(user);
        } catch(e) {
            console.log(e);
        }
    }
    // получаем массив напоминаний
    public async findAllReminders(id: number): Promise<Reminder[]> {
        const result: Array<Reminder> = [];
        try {
            const remiders = this.reminders.find<Reminder>({"userId": id});
            if ((await remiders.count()) === 0) {
                return result;
            }
            return remiders.toArray();
        } catch(e) {
            console.log(e);
        }
        return result;
    }
    //удаляем напоминнаие
    public async deleteReminder(id: string): Promise<void> {
        try {
            this.reminders.deleteOne({id});
        } catch(e) {
            console.log(e);
        }
    }
}