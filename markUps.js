"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countrySelection = exports.backToMenu = exports.menu = void 0;
//файл с инлайн разметкой клавиатуры боты
//главное меню
exports.menu = {
    "reply_markup": {
        inline_keyboard: [
            [
                { text: 'Новое напоминание', callback_data: '/newReminder' },
            ], [
                { text: 'Настройки', callback_data: '/settings' },
            ], [
                { text: 'Показать все напоминания', callback_data: '/showList' },
            ], [
                { text: 'Удалить напоминание', callback_data: '/deleteMessage' },
            ]
        ]
    }
};
//кнопка возвращения в главное меню
exports.backToMenu = {
    "reply_markup": {
        inline_keyboard: [
            [
                { text: 'Вернуться в меню', callback_data: '/backToMenu' }
            ]
        ]
    }
};
exports.countrySelection = {
    "reply_markup": {
        inline_keyboard: [
            [
                { text: 'Россия', callback_data: 'RU' }
            ],
            [
                { text: 'Украина', callback_data: 'UA' }
            ],
            [
                { text: 'Беларусь', callback_data: 'BY' }
            ],
            [
                { text: 'Китай', callback_data: 'СN' }
            ],
        ]
    }
};
