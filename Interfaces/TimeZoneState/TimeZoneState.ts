export default interface TimeZoneState {
    status: boolean,
    countrySelected: boolean,
    timeZoneSelected: boolean,
    avalibleZones: Array<string>
}

export const initialTimeZoneState: TimeZoneState = {
    status: false,
    countrySelected: false,
    timeZoneSelected: false,
    avalibleZones: []
}