"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const NeverForget_1 = __importDefault(require("./NeverForget"));
const DataBase_1 = __importDefault(require("./DataBase"));
const mongodb_1 = require("mongodb");
const token = '5166430893:AAFiOVXAk7h69W5PCoEB-8QDjlNpixQjHeM';
const url = 'mongodb+srv://admin:Qwerty12345@cluster0.zuooa.mongodb.net/NeverForgetBot?retryWrites=true&w=majority';
const bot = new node_telegram_bot_api_1.default(token, { polling: true });
const mongo = new mongodb_1.MongoClient(url);
const db = new DataBase_1.default(mongo);
const nf = new NeverForget_1.default(bot, db);
nf.init();
