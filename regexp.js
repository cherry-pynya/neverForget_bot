"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regDeleteReminder = exports.regTime = exports.regDate = void 0;
exports.regDate = new RegExp(/(^(((0[1-9]|1[0-9]|2[0-8])[\/|-|\.](0[1-9]|1[012]))|((29|30|31)[\/](0[13578]|1[02]))|((29|30)[\/|-|\.](0[4,6,9]|11)))[\/|-|\.](19|[2-9][0-9])\d\d$)|(^29[\/]02[\/](19|[2-9][0-9])(00|04|08|12|16|20|24|28|32|36|40|44|48|52|56|60|64|68|72|76|80|84|88|92|96)$)/);
exports.regTime = new RegExp(/^(0[0-9]|1[0-9]|2[0-3]|[0-9]):[0-5][0-9]$/);
exports.regDeleteReminder = new RegExp(/^\/deleteReminder(.*)/);
