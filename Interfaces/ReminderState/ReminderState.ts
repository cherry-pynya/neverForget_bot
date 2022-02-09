export interface ReminderState {
    status: boolean
    dateSend: boolean
    date: string
    timeSend: boolean
    time: string
    textSend: boolean
    text: string
}

export const initialReminderState: ReminderState = {
    status: false,
    dateSend: false,
    date: '',
    timeSend: false,
    time: '',
    textSend: false,
    text: ''
}