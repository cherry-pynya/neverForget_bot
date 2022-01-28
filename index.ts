import TelegramApi from 'node-telegram-bot-api';
import NeverForget from './NeverForget';

const token: string = '5187554884:AAExfVgK2NwBP-XF2rbrbpcNAAkk9HumASc';
const options: object = {
    poling: true,
}

const bot: TelegramApi = new TelegramApi(token, {polling: true});

const nf: NeverForget = new NeverForget(bot);
nf.init();