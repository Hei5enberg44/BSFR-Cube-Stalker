/**
 * Renvoie la date du jour au format DD/MM
 * @returns {string}
 */
export function getTodayDate() {
        const d = Intl.DateTimeFormat('FR-fr', { dateStyle: 'short' }).format(Date.now())
        const dateArray = d.split('/')
        dateArray.pop()
        return dateArray.join('/')
}