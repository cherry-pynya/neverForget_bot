import TelegramApi from 'node-telegram-bot-api';
import NeverForget from './NeverForget';
import DataBase from './DataBase';
import { MongoClient } from 'mongodb';
import moment from 'moment-timezone';

const token: string = '5166430893:AAFiOVXAk7h69W5PCoEB-8QDjlNpixQjHeM';
const url: string = 'mongodb+srv://admin:Qwerty12345@cluster0.zuooa.mongodb.net/NeverForgetBot?retryWrites=true&w=majority';

const bot: TelegramApi = new TelegramApi(token, {polling: true});
const mongo: MongoClient = new MongoClient(url);
const db: DataBase = new DataBase(mongo);

const nf: NeverForget = new NeverForget(bot, db);
nf.init();
