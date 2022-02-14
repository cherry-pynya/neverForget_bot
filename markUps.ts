import { SendMessageOptions } from 'node-telegram-bot-api';

//файл с инлайн разметкой клавиатуры боты

//главное меню
export const menu: SendMessageOptions = {
    "reply_markup": {
        inline_keyboard:  [
            [
                {text: 'Новое напоминание', callback_data: '/newReminder'},
            ], [
                {text: 'Показать все напоминания', callback_data: '/showList'},
            ], [
                {text: 'Удалить напоминание', callback_data: '/deleteMessage'},
            ], [
                {text: 'Изменить часовой пояс', callback_data: '/settings'},
            ]
        ]
    }
}

//кнопка возвращения в главное меню
export const backToMenu: SendMessageOptions = {
    "reply_markup": {
        inline_keyboard:  [
            [
                {text: 'Вернуться в меню', callback_data: '/backToMenu'}
            ]
        ]
    }
}

export const countrySelection: SendMessageOptions = {
    "reply_markup": {
        inline_keyboard:  [
            [
                {text: 'Россия', callback_data: 'RU'}
            ], 
            [
                {text: 'Украина', callback_data: 'UA'}
            ], 
            [
                {text: 'Беларусь', callback_data: 'BY'}
            ], 
            [
                {text: 'Китай', callback_data: 'СN'}
            ], 
        ]
    }
}