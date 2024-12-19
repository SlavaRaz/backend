import { utilService } from './util.service.js'

export const ansService = {
    getAns
}

function getAns() {
    return utilService.httpGet('https://yesno.wtf/api')
}

