import { SendMessageOptions } from 'node-telegram-bot-api';

//делаем маркап из массива строк
//знаечение === калбек_дата
export default class MarkUpFactory {
    private items: Array<string>;
    constructor(items: Array<string>) {
        this.items = items;
    }

    public doMarkUp(): SendMessageOptions {
        // ай ай ай 
        // была бы адекватная документация я бы так не делал
        const arr: Array<any> = [];
        this.items.forEach((el: string): void => {
            arr.push([{text: el, callback_data: el}]);
        });
        const result: SendMessageOptions = {
            "reply_markup": {
                inline_keyboard: arr,
            }
        }
        return result;
    }
}