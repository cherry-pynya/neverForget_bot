"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//делаем маркап из массива строк
//знаечение === калбек_дата
class MarkUpFactory {
    constructor(items) {
        this.items = items;
    }
    doMarkUp() {
        // ай ай ай 
        // была бы адекватная документация я бы так не делал
        const arr = [];
        this.items.forEach((el) => {
            arr.push([{ text: el, callback_data: el }]);
        });
        const result = {
            "reply_markup": {
                inline_keyboard: arr,
            }
        };
        return result;
    }
}
exports.default = MarkUpFactory;
