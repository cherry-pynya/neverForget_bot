"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const NeverForget_1 = __importDefault(require("./NeverForget"));
const token = '5166430893:AAFiOVXAk7h69W5PCoEB-8QDjlNpixQjHeM';
const options = {
    poling: true,
};
const bot = new node_telegram_bot_api_1.default(token, { polling: true });
const nf = new NeverForget_1.default(bot);
nf.init();
