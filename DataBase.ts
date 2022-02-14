import { MongoClient, Collection, Document, FindCursor, WithId, ObjectId } from 'mongodb';
import { Reminder } from './Interfaces/Reminder/Reminder';
import User from './Interfaces/User/User';

export default class DataBase {
    private db: MongoClient;
    private users!: Collection;
    private reminders!: Collection;
    constructor(db: MongoClient) {
        this.db = db;
    }

    //подключаемся к базе данных
    public async init(): Promise<void> {
        try {
            await this.db.connect();
            this.users = this.db.db().collection('users');
            this.reminders = this.db.db().collection('reminders');
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
    public async findAllReminders(id: number): Promise<WithId<Document>[]> {
        try {
            const remiders: FindCursor<WithId<Document>> = this.reminders.find({"userId": id});
            if ((await remiders.count()) === 0) {
                return [];
            }
            return remiders.toArray();
        } catch(e) {
            console.log(e);
        }
        return [];
    }
    //удаляем напоминнаие
    public async deleteReminder(_id: ObjectId): Promise<void> {
        try {
            this.reminders.deleteOne({_id});
        } catch(e) {
            console.log(e);
        }
    }
}