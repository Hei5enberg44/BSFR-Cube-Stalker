import { Collection, LocaleString } from 'discord.js'
import locales from './locales.json' assert { type: 'json' }

type StringKey = keyof typeof locales[keyof typeof locales]

const _locales: Collection<LocaleString, Record<StringKey, string>> = new Collection()

for(const [key, strings] of Object.entries(locales)) {
    _locales.set(<LocaleString>key, strings)
}

export default class Locales {
    static get(locale: LocaleString, string: StringKey, ...subs: (string | number)[]): string {
        const localeStrings = _locales.has(locale) ? _locales.get(locale) : _locales.get('en-US')
        if(localeStrings) {
            let translatedString = localeStrings[string]
            for(const sub of subs) {
                translatedString = translatedString.replace('%s', sub.toString())
            }
            return translatedString
        }
        return string
    }
}