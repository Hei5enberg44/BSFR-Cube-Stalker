// country code regex
const CC_REGEX = /^[a-z]{2}$/i

// flag emoji use 2 regional indicator symbols, and each symbol is 2 chars
const FLAG_LENGTH = 4;

// offset between uppercase ascii and regional indicator symbols
const OFFSET = 127397

module.exports = {
    countryCodeEmoji: function countryCodeEmoji(cc) {
        if (!CC_REGEX.test(cc)) {
            const type = typeof cc
            throw new TypeError(
                `cc argument must be an ISO 3166-1 alpha-2 string, but got '${type === 'string' ? cc : type}' instead.`
            )
        }

        const codePoints = [...cc.toUpperCase()].map(c => c.codePointAt() + OFFSET)
        return String.fromCodePoint(...codePoints)
    },

    emojiCountryCode: function (flag) {
        if (flag.length !== FLAG_LENGTH) {
            const type = typeof flag
            throw new TypeError(
                `flag argument must be a flag emoji, but got '${type === 'string' ? flag : type}' instead.`
            )
        }

        const codePoints = [...flag].map(c => c.codePointAt() - OFFSET)
        return String.fromCodePoint(...codePoints)
    }
}