"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = __importDefault(require("./messages"));
class NeverForget {
    constructor(bot) {
        this.bot = bot;
        this.dates = [];
    }
    init() {
        this.startBot();
    }
    startBot() {
        this.bot.onText(/\/start/, (msg) => {
            this.bot.sendMessage(msg.chat.id, messages_1.default.greeting);
        });
    }
}
exports.default = NeverForget;
;
