import TelegramApi from 'node-telegram-bot-api';
import messages from './messages';

export default class NeverForget {
    public dates: Array<string>;
    constructor(
        public bot: TelegramApi,
    ) {
        this.dates = [];
    }

    init(): void {
        this.startBot();
    }

    startBot(): void {
        this.bot.onText(/\/start/, (msg) => {
            this.bot.sendMessage(msg.chat.id, messages.greeting);
        });
    }
};
