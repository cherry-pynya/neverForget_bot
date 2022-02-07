import TelegramApi from 'node-telegram-bot-api';
import NeverForget from './NeverForget';

const token: string = '5166430893:AAFiOVXAk7h69W5PCoEB-8QDjlNpixQjHeM';
const options: object = {
    poling: true,
}

const bot: TelegramApi = new TelegramApi(token, {polling: true});

const nf: NeverForget = new NeverForget(bot);
nf.init();