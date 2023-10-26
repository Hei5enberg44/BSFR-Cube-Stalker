import {
    Guild,
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    APIApplicationCommandSubcommandOption,
    APIApplicationCommandBasicOption,
    APIApplicationCommandNumberOption,
    ApplicationCommand,
    AttachmentBuilder,
    userMention,
    chatInputApplicationCommandMention
} from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import players from '../controllers/players.js'
import beatleader from '../controllers/beatleader.js'
import beatsaver from '../controllers/beatsaver.js'
import { GameLeaderboard, Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' assert { type: 'json' }

type Playlist = {
    playlistTitle: string,
    playlistAuthor: string,
    playlistDescription: string,
    image: string,
    songs: PlaylistSong[]
}

type PlaylistSong = {
    hash: string,
    songName: string,
    difficulties: Array<{ characteristic: string, name: string }>
}

export default {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Génère une playlist de maps')
        .addSubcommand(subcommand =>
            subcommand.setName('played')
                .setDescription('Génénérer une playlist à partir de vos maps jouées')
                .addStringOption(option =>
                    option.setName('leaderboard')
                        .setDescription('Choix du leaderboard')
                        .setChoices(
                            { name: 'ScoreSaber', value: 'scoresaber' },
                            { name: 'BeatLeader', value: 'beatleader' }
                        )
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('stars_min')
                        .setDescription('Nombre d\'étoiles minimum')
                        .setMinValue(0)
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('stars_max')
                        .setDescription('Nombre d\'étoiles maximum')
                        .setMinValue(0)
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('acc_min')
                        .setDescription('Accuracy minimum')
                        .setMinValue(0)
                        .setMaxValue(99)
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('acc_max')
                        .setDescription('Accuracy maximum')
                        .setMinValue(1)
                        .setMaxValue(100)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('ranked')
                .setDescription('Génénérer une playlist à partir des maps ranked')
                .addStringOption(option =>
                    option.setName('leaderboard')
                        .setDescription('Choix du leaderboard')
                        .setChoices(
                            { name: 'ScoreSaber', value: 'scoresaber' },
                            { name: 'BeatLeader', value: 'beatleader' }
                        )
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('stars_min')
                        .setDescription('Nombre d\'étoiles minimum')
                        .setMinValue(0)
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('stars_max')
                        .setDescription('Nombre d\'étoiles maximum')
                        .setMinValue(0)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('snipe')
                .setDescription('Génénérer une playlist de maps à sniper par rapport aux scores d\'un autre joueur')
                .addStringOption(option =>
                    option.setName('leaderboard')
                        .setDescription('Choix du leaderboard')
                        .setChoices(
                            { name: 'ScoreSaber', value: 'scoresaber' },
                            { name: 'BeatLeader', value: 'beatleader' }
                        )
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('joueur')
                        .setDescription('Joueur à sniper')
                        .setRequired(true)
                )
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    ,
    allowedChannels: [
        config.guild.channels['cube-stalker']
    ],

    /**
     * Exécution de la commande
     * @param interaction intéraction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const action = interaction.options.getSubcommand(true)

            const guild = <Guild>interaction.guild

            await interaction.deferReply()

            const createdDate = new Intl.DateTimeFormat('FR-fr', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())

            const playlistAuthor = 'Cube Stalker'
            const playlistDescription = `Playlist générée par Cube-Stalker le ${createdDate.split(' ').join(' à ')}`
            const playlistImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAD7kSURBVHhe7Z1XkJ3Hded7csZE5EwiMYMJlEQwSCQtaW1J67It2pS1rnKQH1y7DuUHvyhZWntf5LL8Qstm2Wslr1WyZCuLtMQEMIMkSOQMEBmDGQwGk9Oe3+k+9/btm2YwIEiI/AM9X+x0Up8OX9+KjjnzplyEiorKcFYYFRVV4awYQvzKCj1UVPijXc8WFW4ynOVjanJKcp90k1M5VSqKSnmN92eDSavvJYNPLy3VVIZ8aX4l6BHoUIoel7r07+IKwyUTADS9VLgcqAhWplLys/AuSuOyW4CJSTGaleWakXdxuVDR2bog1wdI2+qpXBnJ1+bc56Z1U2k64XpsbNzVN9S7muoaNzIy4iYnJ/R+imJWo6QPIG1d5dRkpu0rhwp5rWKqcP7TxWx9gLq6OqHBpNBlzI2Pj7uamjq9n23zPazWU+mDEvQA5WhxWQXACkManI+Ojrra2lq9NudzShhYCr9oAgAoLwFBqKyo1nuTgXz19fV6NL6Pjo77kwzeJgKQMj59LxZcZZQ0AzU11eqhKgHEg7dnpYSglACAisSilCLAWy0AVrbKysqgBBV5FqCxsVGPJhDnzp1zkxOlaRCjVP3BZRcANB0Gt7S0uM6uLrUCgwODbmhoUAvLdSm8nQTAl6S0AJA/tLBjipqaGldVhTL4Y0tLq943etXU1OrRro8dO+aGh4f9xTQwcwEo188v4sDlVS4Igmk4z2n3GxobXGdHp5s3f55ra2tzDWLiBoeGXH9/vwjBkOvu7nbj0h6OjkqbODHuBi5cUMfRpL5a6I2QFiImoAkwkC8h7gfHPQMVgGB5isE072JB/rTvMJj2vqGhIXNeXV2tIYbVK83XBGBkeEwFYGBwQI9YznJMLoU3XQBqpI2noLUiye0d7W7x4sVuzpw5rl2YX1VV7UbHRl2VmECahMoqbwpheq+YOo6nT59WATGpR8O9UE3Ku1774ibjzRCAUkLAYFI5jItzB6NpzxcuXKD30gE3o185AahwVUoz6IETjfVEwC5WCKYtAFawqVDwzHXIOC24EbpapL1J2rF58+a5pUuXKfONYcSFKKbh9Agam5r0fGx8TI+k23222/WcPevOnz/v+s+f08oPD4n0S3wTGmtaLrcAVAlLgNEhBWZ9YmJCjw3S+5m3cGF44pHmn9LRkGkSxIpCG5hOuhcuDM5KCKoa65s/F84VqWQafMGwv/F1FnadkdRwDdNXrFzplixdKsJQrU4NxZyUwo9DGNEMCs77/KuprdHzKrEIaE2lWBLizJ8/382dO9d1dnaIQDW52rpaFR6ts4QJaS58GvlEiO9YuRRyyrPoTh6oj9WpEET8wllhYO6pH3WprfVdPgQSgaAHBB1iWPny8gzXGl8Uw2iG5eToFSgr/NNFRVf7whyKYWJykQhEXhMwqY4bhYBRY8IITDuavmz5Mrdm9erwnkcOAwQmtXYfrdRj0GgQS/ZU4rT19Pa6U6dOioXocWfFSkyMjYQnPl4ctxCKMdBqTQkKCUCmHkGDYShI65epVzimCjKva64eDQgMoHeBr4PFQmDGJkbduNDDus3cx3I66RWOSxNjzULfub6MIKighR4GMFrENJm1ANTWVmtbRKI4No3NTW7JkiWisQvU4WsUpyeGFcZghbH75QRAbGY48UDycRZ5Z//+/W7X9m3hiY+XE7cALpcAGDDt1gzxTJuhcI21Q3GAdS9pEsGU1Hs80nCNi4BMQidfTwRhcHDQnevrU0e6qrpK6WMwWsQ0mbYAWKEnEx+gQmqAxOHd0rW7evUqbe85xzKkDEgJYs8z6YXXpysAOJf9F/rVFJ48ccK9+Pyz4YmPl+afopwATEm5CgmAoSqhR4q8ATEB6eG986RionS8lpZmtQpVteJLSF1QKvLK+DIhvtUVZThz5oz6BZdFANraWr1zI0ynnW7v7FRTBPMwVykutQDgFKkTKQ7k6VOn3aannghPskQphWICkEEBBmbFw5eTnkBcL7Q8rSeIBSlTbzlURmMtGo86hnyxrmLHNUsGzgA9KwQfC9BY26j+hVkgHMSTJ04qD3CQbYANWJ4xTaYhADEoSIV4nhdcvWj8XGm/Fi1a6FrbWkQQ2rUJqKCwEVJCVEXX9owCmWODo6hElWdx3Jhg8f26+hp3ob9fu4oQ6+c/+5ne5/24osVQTADIwzOsMjDU10uFUhhmBAe5ZRKihzNgA2uM9gGrq6Fw7kHw9aEId/RSXHeQdkOxFkPCfJqA9F2Q0mSGAkChKtX7RtvR+s5Oz3gmeMhwrIhXa4gFIB7EsO4caSnzomccJ+j/C+EmpGIMEtG8EHp7u3UACYknPiNlGj/ELYeiFkAYZ9YORlQ4r32WbHZG07+TqWfQ5ljbq4X5OMa8o168tNW+fJ7RZvUMtPdm6SYTi2fI1C9oeGwtjXYp7UFKl4sSgGXLlrmrrrpKR/Kqqz3jLLOJpBuWFiIWAGCFxYxTCTRtIni1E+NemGAuVofjiPT/x8XMoe30fYeGBrw3HEC3aibdIWvDsxANliJOCdM846Ud1SLLe8JcKaW+ZeMlVj+7zhA4CIK22VLH8Qnpp0u5LL9xFQJfv7QEnukSwlHLkUvWbD6RAKTMBXETAGYtABUiyddcc427+uqrg7bmanzq9JQTALotyuABYbAwF21Gs7nHEUZ76+CbhbGR7FwBlZmcHPNaFSqWcY6miWICUCEmHsZPovkwU+tVqV0xYHTKmPhwHQ86gc72dh23aG1tdU3i0e/bs8cNSV0pO0KgiLQchlWoXReGVtr9kGeUtDHSBpLIt5AQXHIBGBMzvHbtWnfzzTeHymYLDzDV3imTgDbKO2PCSNpoNdvCZMb9YbgyUNLjXbxX9QMIUUW8dUmZREWMKP5o73NMhQ7A1BjpO3Ee2uarL1Mt+l6tQqBtuDAbU05aZnUoB5YKjxuHtE26caTdKExfsWK5u2bNOrd02VK1mtUS99nNm91Pfvojd673nNLEW7thFXj1oSSur4vQRYsY6CtCos6mr2a2vsFBsGshZvYcJE1IKhAX1QQwnn/99ddrgcfGR3I0Fs3BXDNsOyBMrsZLF0HgGaN1oschJQ8joPXlqWROBQKMYXmMSwSgGMoJQGVw6jKpSNOmzJ+q16O24RROhIC4KhBCXJKpravy8xtzWt2qVVe7heIfrVmzxnV1delADKOdOI2UcWJsXJjf55544gn38ssvu8NHD6tPJXrjh3i1CSOMB2ZHDIyEwOr7lggAjO/o6NDuR64AjLna+jCfLYwhM4Z7qRDnWAOaAJ34CQzAYlBgK1iueGRxqQTA4tPGe/hjdbAAvAdNYRyaP+GEOXL0pt53bQkNtXXSHat0V69e7FasXOhWrrzKzevscm3tba62qkbMfaO+Z4Nk46F+ddJ9g9kXBgfdgYMH3AvPvOCeef45afpGXG9fv6uuYyic5k5oIrSTPxovZhwltaa3wpxOex69ByTncOaR0mnGAjAwPKICwDQumh1LGCacNpJMkPiq0CWkQkZ49YCTQsbwMfKRx3i7hprTBMwlnpp4KZNNbAHrpgHe45pewISrVQsAQ8CihYvcCjHn1113nZj2hW7uvBY3b267OKSjrl6EQucwJC75TGhz5uOpYMn50OCw+gJM6wImc/bt2+ce/a+fuW27xD8QJZqQl1GgKsop0StobqyeQm/oZ+sYLrsAGNGyDPECgKMGqChQAgcr4H0FD/VvSiDLhsLI77blmrhi8afES7eyqdVUBjs/VC1lH5dk6DuroylMaG1tUYe2tr7BNYg2r7p6pfo9K5Yuk2dtrkN6QD7vUH/OpK7m5Kb1JC+IT08gywRoxHqBSdcjTeaOvfvcjx59zB05fsqdOtvjmhoaXdW4pCl0rJAmQd6U2vv8sADaXGplBOGYTdve88eMoiYCcsUJQFDEDBiKjlFKAPwx0CoIgCSgR0w0Fg2vvbmp2bW0NrsVy5e7De/d4ObN73ILF8x3tcxOimXLqQMaGIhK3kaXQvWEORPQJNDDF13KIYUal/KMiiCcOHPGPfncc+6Fra+7s6fPuopRcapHhiWPUbGewxkBsJVP7wpAEQGwfIw+jOkrjPGi3Zj4qhpp54Xx7Z0dOnW9Upi+fv16HeiaM6fZzWlrddU1wnRJcFSaPwgc12FSEovLbOsDCoG4k8aQABgITZn8YQxlSvyHvuEhd+joMffUU0+5V17a4nrPiiBIPB2KmhgTiyDHhJEIUTjxx4wAhOuMAOTmf8ULgOUP4rTNFJcWAOduvOEGd+NNN6t5X7hggXrk9Q1+DoM6MtCFgzs+MSpRPW3Ix+qfLtOergBoWcV6+IEzoZVEQwiq6sTnkC6l9Jncme4et/W119zTTzzuDkjz0C/NRK28Qw6VE1FlJR2htD/PEQxvbdQKBAHIU6CLFQCDaaANiFhimetEUouTxyNmokkvbavBGGvPpGXXoyFNnzYdRmfERMrV0Nzkbr31VvfBD39I+uorpc8u7bz4Agit/04hK1Saj2mPgLJAgWy9yolsLjJCEJy3yikbaZRbFdJjkvMJeUSOCAW9FdY7vLrlZbdp82Z3eO9+xER6XOPaExkZ8SunjB7mFJIC4ytTU7mDTakAVDU2tOSuCCpXIdOkALvMWgSPzHWSYe5b+Sj0PNRNkY70VcQPAZcSLH+OeiZ/eMScOu38xo13uY133intfYOrkbad1xF90UUlElRAr0gfoYxDUoJwnD5EJ+Wvjwe9pb8gzGYAS/IjfxGEKvHesQ911RWuXpqghQsXunVr1romEd7jIhAXBgfUv6+uZKSStEiT9Kw8aD73gnBokOcJ/a58AUgysKexAADVJq6lAW2Z0+JuvmW9tPlL/FSqEJ8hYRwrTU8y9IxAU8N5CCREirBN0w7XecGYmQTSYzAMA1mJxYFBnCNsEpwwH8YTqtHecWl6JE6NNAuNzQ1u4eIl7qo1a9y4SGtv/3k3Jb0E8pNUSF3g8yFN7uE7UE4Mtx71nSxmLQDaV5WjEoQb4ZorvdbzbDANKhqi59Qo5xlB8tc09Jk3azE0HsdQTo45TYBEbJNu3Ps23umuWrZCnTuFdc9guiYe7ssBimTyjxgOuIbYeQjxEVjKEFLT9PwfIsEon5/VhSbVhEUaCymXvCv/aZ6qdIFtk+vo6nTrrr1OuqIdrud0txvsH5CmQuyIxGXRCElr6ghv8DmsPGlRqxrrW0UAuO2DEa4YrHAWPOMlEzKWoKZTM/aB8zhM0cZqG+hDldyzd/OCpK9tspxng0g0niznSjSO2aDF18r6gGnNOcqha16ne/8997rFSxa5hrp6Vys9gTpxvgiT46J5OpjjA4swOFJP6tZI35zrQCeGvhndq6v1QePJvWpxitVfCUXx8aVGcgsa8ygkEcocbqi0yR85h5rqc4kfIBnJAx5WavpNNfVu+aLF7qbrrtcy9Fzoc8PjI254cixTV+WD/POF0EwkWUlH0/dBBGBOsiqYF6cHioMT5pP2QSU+uk4DEh1fM8JmwlQoKMPTe1RQK5mPvPKHa9NSunQ4fTqXUV/n+vv8nAWePjORMAnC4PEzhl9dUe1lNWRHl3FKHC3VSPUd6O1IP35M+uuMJmUgaqGRyDhb1rTU+bXgfayWeiNyCoWhtNA14zhKPeS8tqradXXNdUtXLHfX3nijNBqTbu/+fZomXcUsmfSPIqVPRVfb4uxTgQ3fFkPskZsAxDDvvxjwWGPYEGsxzGRuH+QJQCiPedr1wnzKwFJ1vldoqK91zc3NuraBI5M6zU0trr29w7U0cd0ShrVFq4Xh/lMtmB7abhEUtMqGkhnomYymyL2lyNYh7hID2ulisC5j3JPKdMPlluZfXetE592o5LNtxzb36U9/Rp5NuWopAl3Fct89vOMEgF4Aw78sOBkXc09XimVoTNzYRxfVVTQHdcp0rEVLowhIe5traGqS62YVFD5vwyNvbGjOLIhFuPgQxsOXm/ge/jpPAJLrGBkByHsny6NKEUonVq1PLNhr27a5L37xC0R0NUEA0riZkcGAPAGoFm8zRn7mWcC7+EscUE4A8scFcuOnuFgBMJOfuQ7lsmva8Sww+bHgY+L9e/HCVkwxgpGFfy8rAI06kNTMh6+dYkFamvSa51iWxsZ6/TwOq0E7zuAZawRYS8CRtFL1Iz6TSn6KeFKFdlIYyzlrEiolLj7AyXNn3bMvPu/+8ZFHlPE1Qja0X53CAGN+zNN3BSCQPCsA/piJl1xnV0X7ZgAflWc6R8BR6KcMrs0yV799lO4S73HeHFYI8SFNZ2enHJt0dTXXXWJZEDoYjwNaX+8tSKY8wg8754g1On+h342IB/CTxx5z//zP/+x9BEYKhdZQz2ihzZbEj61Oxdz2JTkcKScAOdIjp2+1AKRP+bgiRoZwJgA63ENTl1vPHAHA2UrSsSakprouIwQGJao6h/5bR6bEWSdBXaGHjjBGz4ltw8pWPvLnPtaClb28hyDMaRHL0dSoM5CsMeA+k1WtIjDN0iNpa2/V+YxRkcSvffMb7vHHH1cBqITOFyMA5XyAWAAA/UzrSoOZCgD97lJuQCkBKPTkYgXA3pMUeFkO4f1w3wTAX3saZa2M9AiwABJngGVeUmZjeJNoqLcAvufgrQZL4Px0rgke9eSZpiWlBOQFPXkHa+LTwIr45oP7DbU1+vUQcwhHjh11Z7u7lfEqAAKdfQzlNN7lCMD8zqU55M8SYvoo7ceV1uByXqq0YuFsZrBcTSDTesGUcKZ/sxYAZH0Aa0O9YOHhZ8tL8+AFI/t+BiFfFSYOOoXHib8mP+hm8WIlKgYYaFpMPE/3UFNJj2cIliqZBH1Xko+VNnU641orfCbZMB1oJhcZTLOKgeqVCpcKufVGe33AQmnI5GbnjE8wXo8F9CEuUcrQQgym/imgRzmaABxDejSMSxBYlscGXDA/5hvnMN1CiooFXcty7saRQZ5kzxhZohREOQsQ9akvBuUtgAemN0b6vqUTe9UeQaPlfaZzM9D3s9fWBNk9y8/ySeleDKrVgclYALOQcdNqafGuP2aflbUA73R4E+vNbBwMxe4DrEEucq81DsxTBvp8fPcOa2P5Fg/qV8SMzpVRRVqmcqiYNzfXAuCdso6fNgpHwwZuUk0yCbbVtEWh5jML1t3ZalldYy8VK4WpydxFjbNFtvy51LOx/WLIaE5Gkz0qwrZuGU0OOmUaXxmWosVmPYdJwSdIy1MIxOO9OH5qIWMN1/fVucxhcQ7yBIAuBiNcBhv4YOoSpAQcF2EpjVwG4yEz7s6WL6RRruKXWwAKtZMxTOsy8aeCExl6T6kAyBNNGwEwRsRazHNQjg7ABCDGJRcABij47Mt3VcTJKcJ4O85UACgMO3mcPHlSC8vASTHgOCEAllepikwXafkNMxUAg300OlsBmC7ScpcTAKVhZGVTGuYJQEd7hwrAwYMH3QlhEhMm4FI1Aay+GZVmgCYAjDOUVgAUlP4wTk7czYwrQFnSCpVDOQEApYQgRwDEfBsdCgkAadKC4nBejABgLfOd1dxypwJAHHuH/MoKwNxEAJj0uGrlVe7osaO604SNWMXQhKVgNVXMhFVqIbEWMBXLwTSpIc5cBzBChRj40GFSIZmBe4x18wmZIa2wn4L1jNdvDyVOKdigDIMllI8x+BjGQAOCDoP4dpHmD5+FuHSzgDEzW65K/bSNEToriz1nVJWuGU7ewMCgTkJVVYUFp2YhIsUikAbl5Mtnm4fwz4TGcs9VQ29fh3E+shF6M2QMn/TTOzlmy1aA4Qm98gSASYtVq1aVFIDBgQFlBM3F2LAUdpxPn6W9CZWxiQ0yTz/9ooL2rT9psBzLAHFNQMakcjBO3wn3GOTgY0pm3HRnEKmwNiNRhVMgAOw3yHg75cMCxYgFIBZWhmNhOmXniDBQJ6mNPjciMzSM9rMlC8e2jg5dxIkgsxci9RgeHhJhqNG6M5EDLN+ss4i18NpLXrHwwAPKwCgt7xstqU+1OJm8QzzKzLO0GYhx0QJgFTbYWDWfQWmPAQkVhvC5N4yqra1RSW1uaQ4xPDwRvBDoZEls3wXEpbJoAYVHCGI0SJOEAPIezEwrmF4zwQLY0YQPVtP0UgugwixpUAY+f0PIAXEpU0349tGAAPA+4/XUi6+KYYAKujCfSSJWGsFML+B+ujhDzyAApjwM8AwODmj+0BeHeenSpaHsk66+2dcHYHn41A5YmcmnFNKR17IC4Ltq2VcWL17kbrvtdl1Rw0zU3M4uNUEHDhxwL77wotu+fbs7eeqUVp4K/Nmf/VmIKXUV4pj5MgFI1wOQ1wvPP++efvppd+z4cemVZHsk4Atf/KJ2U5977jn3ox//OGMdDHFZwSc/+Um34Y47dAOpL33pS0qkGKkAsE4AU43Jvuuuje6+++9XjfzWv/2b27Fjp1iAXK967tz5rqW5RfOBHvsPHXQ/+clP3JEjRzQvFOUvP/95FQSc39bWdo1nVsssgJWjp+es+8EPfqBfDjPF3CX0/e3f/u1Mz4yp3xgIAMK0c+cu9+yzz7qjR4+GJ4WRCkA17VUMrjVwLqFKClhfV68VYWOIX/vVX1UfYf6C+aoRPT29auqWLl/mPiDEOv7GUS3I17/+dRWA97znPVoRnbES4rK50cDgoGuqb1AtqakS04UlkOeYe5Y7M7357AvPuyXLlrpJkWi0gHZ49erVupR7/oIFuj3Niy+95Hp7erTchpg5fN1z4003uXvuuccdEqeW7esOHjwk7+SawRgIFKYYC7Zw0SL34Q9/WNvel158UbehG8CcS3nVn5Ayc/6nf/qn7r3vfa8uKdt38IAeERre6eho149OKC/7AUAT0349ikJkryvdIRGgnTt3usOHDut+wOwwcvuG292K5Sv0HdKMgSKR34b3vsfdefdGEdRvuVdefUX3TcT6TuRtL5+LXPEvAAjK9/5U4Lceesjdeuttyvzu7rPujTfeUIl7fds2199/QTdrwlzdvmGDu/baa9Wc8lyDWJSjR4+5w6IZtFkwlcWU56XJQFssYHVwgKgoG0efPdeb0dp7771XBRGCrV23zq1ds0bvX0qYD1IMmF12M4XB7Fz6sY99TBWDMmGV/uuxx9xxsVyUn3sm8IA2mr2PT4mFtCM7ep04fkK7xSdOHNc2/Kwwj+aUvKAFtIXRKFBPb09O4Blmv02aqttuvdV96lN/4BYvWqzvp9awEHI9IoFJI6gQYrDjFJ9MQXwqDDO2bt3qfvrTn6pGADKirfzA+9/v1t94kzsmDId5bPny6c98OliAGjciFcBMPvTgb7q77tyoAvKv//pNSe81Vy3tJB56n2j/qJg13ShBisL8+ED/gG5AeZsIVhVbyUpTwhe779u4USzFC1oGg7ibWh4C8em2aRBLxrXeC++CqLoemGJ5l4WfegxxLNBW431zRMjv/+AvuVbR8q2vv+6+9e/fFqb0uqGRYVeJZ84YhwTKSv6bn3vWffVf/kWzyTLHC5xdDwuN2OgKpxKGAyws9Hnisf9yX/vaV/WetZzEWy7W4Z733yvW7ka3QKzWL3/0I6I4Pe7U8ZOuXtcwRkjqW1Dc1VGTAMwzx5R3dXZqW//d737X/fznP1ephdl79+7Vtv/hv3/Yffnvvuy+8Y1vqHVA8tH6N0T7CVgCtKOn75wKGk7NITF1jDlsffVVt0VM13Yxf2ycgJXQTSDFqjTPaVYz2i5dVLTi9ddeVw28RhhQDGiSEZXZMsA15j9LfO75cfZyiBWDuX/8pD/4wz8U4i9Xy/Wtb33LvfjyFtctbTh+FD4Qwg74kQfGPnBAXxdB4Xu/18LxVan3K6+8osctctyxY4cyn54OdaTsbIQJrVC+/fsP5IRdu3a7zZs3uf/8z/90fX19rkN4BK1Q1kaagBxxz0eeAFBRTyg/7EhB2A0E88U1JhoLELdFaCkFxXF66cWXtA0bk+e1QigGkvBsh0ZZtDTl+sWDZyt4AJMtLzxnjroZomgL71ZIn5duFT8scd0N17smsSQvb33V/eDHP3RnRdNWrVnt7v+l+11tfa34K+JP1Ek3KGgq8Ql8FCos1jRV+0PgHiF77f/5c7vndIEHa/24Fk1QDeWL4U/+zv/QXVH7+s+7b3/n392OXTt1A0csFPmwWHNQLIGSn+6bHHDgqAMWDBON3+PTlX6+PPNWI4wsiuVAAQBdWKWN9ECaRBlUeUTA6IG1tczR5njfvr3aU0DwWlrn+DJLHMNqodV8acYNSnMpQ74ASKLajZGAp4rTMi6J0p0yq4Aw0IYjBHTH9J4UnHcZ3ME8UkhCDCWqBCtWXEBgzwHTruSGFrAaF78CDdixc4fbs2evruUnP3ojrLrRvMUhM6hmB4+XuuBgmVXg2sB1Wo4YdO/ovdg7c+fPcx8TRxiHF4L/x/e/5372xOPuVLf4LtKkGWxk0Lp3doSJ1VJWTHoNzR7nlF2YDw21VxPFqUxsNnXEIvMeo7AwkW8dGQ9gfQBOKhaKPYNHpTwoAYg7W77OQh855glAPKiikqYm6IKaezJeuXKle9/73ice9WJ1UGAK+/aZIEDomPlWcWWuHI3BBt7TgkT5ejHzGJ0cV+emUZg8PjXhtouJPHH6lHrbVbXVbuM9d6uV6JcKq8ZLftTVa7/PlwBRTcB4zrFQ0G6ZBLQUC4RG6ibNaK9o3wP3P+B+7eO/oZbg9R3btSnEoYMOaJ/WMQlx3WOrp4s6hBFx4B1gdDNo2SQMiyXFl2I/JrXCItR0ixnBZYEpPDomXd7zwjN6MymM+QDa5wlACjKhbcHso43r1q7VPu/v/d7vuY9+9KPaNcMBVAKo58oInlQkZD417iWN7wk4FgL3Vdii5xCfCvMt3F333qNt2pYtW9zuPXukTe11zz//gnrL3L9JnB+WYcfN0nRhVsLKFpeRMpEmBKZp4luABx/6Tc2LrteANGc0iVZnurGFEI+lsIv6AulF0UXl10MWiIMdB2B0sLIxKojgAOrL7mNdXZ16zscq16xd5x588EHdig7/Y/ee3W5EBAVQh3jZeYrqdKkSpoJ7BM6VuaLpjz76qHZ3rrvmWrdACn+/aAKBPjsCQv//Bekrb335Fe0B8I0du1xRceqjIeSRwgSANy5cGJA2rEWYjyWZ0m4lDheM2Cumnz75qZOndKzhE594SCu8Zs1a98ILL6rzpPGk8KRHMFNscxUM0SpEPrE6vAOh0ThfDv9Y40ofHcaTLuXgk/JVV12t5naOWKTbbrlFx0SOHD4idGrU+QPbJc1Amgzhkt7NN693X/jCX4YnHhhOBp6woDiDf/flL6uPpOWS5zCuhk/ABfQ6/vzP/1xnYOsrhKGiXCgeu5uski7xhNQDh3Tz5s3qPAPyJw2EgHMQD36VtQBne3q0rXtNPNav/MM/6LLjA+K1sysWWo6DSDvMQMjv//7vu7/4i79wD9x3vwoQ0EwhsIRYw4EJm5kkGMH26BDe2qhbhMh+omXC7dq9S8sCU/mVsV07d+k4/4YNt3tfoZEl1bSlfq7A5gyy13zaxQ81iUZIIB0YH5tbKwtAQCgDTij1u/HGG7TPffDQQa072vyRj/yKjpHA/HRUEuCrIHT4KMRZJH303LBQ49PVZhYWGKOgFwNSCC/l5/M13rnp+hvddeuuEeFbqTucLJKuH8J96PAh6SZ+TXtkQ4NDWn6aaRtTQHkQLIKhrAAgnVgBPH1G0xjh+5u/+ZJ75B8fkfbvZ2oZEA6sAPsHr7tmnTYN9EnHk3FpCqRaB9FDQdK2joqqdypCQIXxN2ha2EqN3TXpZ8MEzP/jTzyhTGQRC4LCEXOrs4xiGmGyP/cBTVBtkED6hJQgEN8YANAwaLBWrAxe+Q++/33py39VRxQp53rpcq1ff5Myny5YIcAEysKo6ZNPPZkTnnj8CR1T+fnjT7otL70sb2MtqqQgzK+EYXNhHvVhKJkuN11xutTQgq+QcNARSnizadMmHR2lvuYsal2FTl6xcutXuNGKgCNRLw4QYCjzhPTjGcFiEOj7P/6RjtVjBa4ViUQbVixdLo7iCt2ChS6h1ETjlgKWgEIhjeQhuu/miFMzT5oafl5uUKSZfjI9j7lzu4QhfkIEK0CTsVzaPjSB3TfRBBhjTlKhgGaZtqYCmIL3yRctQgi/973vKfEXSPvNvAh1//jHH3R7hDGM6uG7xIA59JqwAidPnnD/8JWvhCegUsuJZtbXN6rpVyWJSMZsojVjjBF85zvfcRPDIpRVNdoMfeKhT7jV69bq80MilPAGRuM7sbmUiLg+A7F1M2j140DmcQEm2LhQNI7JDJ1JE8kaEMLTD+f3gfA2d+/e7R4XaX744b+XSvSq5N10003qqJSDOToIAZpIgenG4Fg9ECZi+Arm9ttud3/8J3/i/vqv/4/79Gc+4z7/+c+7h37rIdcsBB6UMtxw3XVuycKFrrGuXttMPvpkmFknP0ITxJG+M+MTfLuvM5lym6D5SuBcyxLKRDocjxw87P7fN78pjN7jTonXjyAw2IUjRh97450b1cxrXpaGBK5JY2qCXcbG3PCgmOr9h93RI8fciaMndSu4vt7z7pQIz5AI84Xz/d4qUd4AL6ziZFZVSJ6HxQrsFn9hi/hBm91OcfjGhVYMBTNYt2DuPPW98BNiTTf4pjUbcsW1AGAAL2IKqSCMoYB0jzj29Z3TLhfzAIcOHVKiNIiG0mxkv5QtDCV2OLfCYir5TQC+n8OsM9OG6V0hVuV90g7TJeT+Lbf6gGeuH2NKO3377Rs0DdpahJAmAW2IzSDQ8ss1zpA/WinywfPe3h736GOPqgaisWgpzdG3v/1tt2vXLm3DP3DfB7SMhdLCHF8MECCEUs+LlPH70iQx0kjzc99997l2sUj0DLByc4R2CDlOqNIgWPIYZQXABnxwUvADACaNCRHWAGgbJAynqWD+HIGBiThnaaG5ToO/nx1o8TNxtX4rVvG8AZMkzI5tfW2rmtq9ooX0CAg7d+3UBabMI+AlM+8A81UIpOJe0n3fl6PPN7fa8TWE0/dFAznihFFHnE/acJoXGMqgz6anN+nQLg4X3eP7PvABHfm0uuQC81smhI9Q6P3oUriMKeZ5Lox2+AX4EJSBoWdmS+EBPKPs1C2mt6dFNhQVAMubSDDij//n/3K/+7u/qzuFIwiYNYCDwrAmFUcj10mfFCeNWT8dgxdGmLlh+ZKaxRKgz43G33HHHa5BKgLhvyZOF2b/r/73X7nPfvYz7nOf+5z7zGc/6z7/2c+5L//t32oXkMqsXbtG++gIEI4Xk1GUxYL3gj1BpgsEEusGgellQBccScB07Q+/930x4b1+3yEh/kpxhC19ylQanvHWXJC2Bv9QEARDEDMKeuvAkKSPD8QYDWMjfHp+1913645ijCpSZuig9RfLTf1T5I0DaB9TmEtE2qFWMSO//KH/phMMYO3qNe7ll7e44ydPqsNRJ0RB4m65ab27e+NG1cAzp89on/ZC33mNA5TxQkxMEl+11oq3PzgwpIXCPBnRSIs0Vl+9St6fcj3d3eoA7t29RwUjJSqC2N7arvmzOOXeu+9xb0i/nPWKLeKgsr0rbeJ8aas/+isfUc2IBSAVhldfeVU9auoPbeZIM3J+4rxOXUMPFSC5b/PsO7Ztd5ueetr9+q//mu4j/OCv/4Zu6kiTOTQsDGDJnAT2/V0q3b6P/vKvaDzrErN3MMy1euHwsiCGX0s9IX7B5MJJbQ4pD02jVygph7zLcHmd0A7nlMml5tY56pN86MMfcl//v1/1TqWmmg/qTV3yegGM2GFiMf2YOcbCWeGDqWHUD2vAEQeQRPpZtCBMgNiNdQ3qkD0jXZGXpQfAUKcWVoSY2VVkmTjqiYsU1zPOLgwCWIth8W7ZZeNmYSY9CdpwRv+Y8zatS8F09SFhGL+Vh2eOI2QzYwCBsvBHf/RH0jQN5Hj+qQA8/PDD2sNh5ZIu+JDyERdLFA+uGBj0ovexcsUK9U2wXBvvusv9x3e/q88xy8xVANYwMAIINA0II/TW63BknOLcuR7X89xZEWJpykRzybu+tTkrNNA0HOETo5KbnnzK3XLbra5jzlz3wQ9+yD379GYVTgbk/NiI1CX4ZMZ8jnkCAnPoY8N8CkXmP/rhD90jjzyifWDMDdJtmjq/a67218+L9/rSlpfcP/3TP2l/lGFSmOwzEw9b1IYwNiJaIeH8+XPu9OmTmV8SQQB4j24TI384X7T3zz7zrJo37dMGJy4GYwQMx27fvk2FFPNPuSg7foAx7uTJ45qnEj1jWvPD3Lmd0sZXSP0ZSp0UK3dCy+m3Xad9zhUYfjhz795dbssrL7nTZ06K3+HEUb3ZLVu+VJoMfhl9wB0/9obkf0x8lTParmdCoI0GxkYkYNIBXVy/vcykWIPTblRo5j9C9c2ElcOEmxlYnFTGBnBSWQnFfR0LYewDARCr6PPLWty8j0Ppr7IRAZMdvGj95aY5LZogDLpeHDSWS+mqXOKIZ3zixAl37MgbarLpyrDlOmZ4BEGSvCbC79/AILTghnXXqvQd2Lff7dqzRy0BP5aA5t2w/kb16tFuehUMfFBcBomQ+BjMhKHttHuMkhGf1UesMcA/uf6G6+UZZR1VIuCLUC8DxIpx+MhhFShW6ayV/vXyZct1JJJFGjihVZV+5S2gHUa70ETKy1hEiygDYyU4pygSRNfRzIZ6oV2TCLIwXqKbFcn+4oenDwpI/tSbHcwWLZB6rV7lWjra9P6B/YekV9LrquR1tQRiWhmoYup5vljAZauu0p4TawhefuElpWFzc5Nbu2qNO3HyhB+riC1gKgAZyQhECuVTQVDpQVKDFEE8c0Zom5gQwaRpH1a9Wb96BgGwdDCpNA0qyf6Wglk42jRjiL0PtKLkJRZFcs0QqxBIV8ujmp4PmBmDd62pIn27p0epB46fnss9rm2GjTJoGQNdoA8mFoZiPaEFcXhmR31PrJjE8PejOmYgeWC5dEJN4on+IqUZehAPUE//rr/H7CW9M9v4wtLGoiAANNt86KMCENIA0xYAY4w6cxzDtTFX+6tSIGKphgQGaE9AkHlPNJSKaQUEvM+blk+MPAJliJ9T5BxYuqkAZOvlhTdTfkkLxsdpmobHMK2J0wGUm7dZR8G9rEbnpmHv22bXcfwcjPsl8xYfAVBeBCEgHnUkHT/DGhRD6Kp9fblPTC2XBLUA4ksxWMXKaIQgtnqxEs4IKqUS0Ai6d8xmmeTGlaftJtDm6TcAU+OSqQhFhQ+5bPIMNCbyehyAPY/fA+l1Xly0O4SpCdHQcX6AAd+DETMIng0qPGnwYlogeODNM1LK7tx+h25JJwp2f5zumATfPfPDwDkBzZco+jsChCCg6gAKw22E0Lbro872cQi80EkfKQeKhwNYDpVkUDjAyGygALEX6o9i5iVTyU2DmVCT7hgxcwrBGJjma8HeSWHxYpiwFIIJrgWIavW5WFDb/Bp7xDRN89YgTMoJIgCUCc2MtdPqmRHoBFgJs2QqJBIQElYNMSAGT3hHrYRYCwuZTaLSzZXQ2hgFeKpQ5pBhAG1QYQZI4QqmkR2eZEMjoJUokmGatqWZ3hdyhDODv4boMXQF0EyQvG+/GApSc25NCfXJHrOjnjwnivlX3EeXCgm6IXbgFPSvAzR+UEKjC2MnrDW8QRxUVnWdOnXaPxDA88w+gSnB0y5X5ochaI9iJATN/yVOQ27BsogIiEZIC0ZF0vKoBJcgTH6uhQXAiG9ImVYWJQQAxOnBYPLLzTNbUrSTzaXtuXfgitHPI18xsu+Tnwm4lYNeCJ/Trbz6Kl2RbQJgCv+mC4CZb2OAFSzriOQKQMogg5WP1ON3WPULuI/mZNLP5Bug7bgnkoF3Y4ZNC0K4OP/KsFrHEKdXTgAob2N9g/oC9E7apUubkDMPeQKQWABrhjN0EAGj693W0a5dWVYQx5iVAHCWmtQ3UwAsZXOEgJnwfLOZULKIAMTHaSERAHYTj5EjAIH5cZ6ealmI8dd6M6PIgtvBwdxxjhSxB++RTU/9NHwIzsNr5M/4DeVm6D5uAkDeVrEZTUsomtXA3ALkVof37I53SADHPMkNSO8b0Qq9b4xPm4K4WckpX2A68O9IE5MmG2kQKCUMVp8cBIIXhm/b0zxiTImGlkIxumVRPG2QNrmpBS8d+20Ek0djPtcWuGeBCvmQyxj75YxErmeFNO/CwYtksXApyzMdZC2yx5suALEViEMxQBAGlTjGAZg22LUhvjbCg7z4Re7PFNOpx9sZCIGFK8YCABiYMi3WJHvG0Zh9MbjSGTwTFPUBrP3MOh3+mlU/OBqMdzPqpL9wHYE1eTGMkMXasvJtXATxAZDY2Kmy8llbZ0IyKeWP2z+uQdomxjpAOWfiEJIPo6DFgQ9Quo33NSqOcvRJdy6fKWYcm9kqPltGCCgcExB0M2xa8lJoDlUuFMohtRBcmyWw+6llSAmgTA11mG09rgTMWAAgCqOEushAAqAbYyElmjJF2GfMyAu8kwSYUCjYRApab8FAWjHiePYsvrag9y3YtRwt/KJjxk0AS6NYFInmM8rE5GaM/vDpdwY5feB8pEObZYleJr1s/FzTPFkpwhnODd7c+28QgTUt0rDpEZQaKiavK70JmLYAVEQEvfaaa93vfPKT+pEio1jMObPyht2thgYG3dDgoC7jYlULv7g9PDikCytZ/cM7NB9+5mo8zCL6SRAGMpgRszUHjGJhUXSSQ5jDOYtGmf2ygSrWEPCuX/7MplNSUo0z5q2VToTwLl/fss2cz497CIAxwOY+Mj5AwvhCvsF0BKDUGIBiluMAb4kAbLh9g/vUH35KP0JgBRHjypmFCDBXGKtNAgwIRPLdjildqcrOIXxPwIYSfk1bVmBYes09lpUzl80vZiMsJiRKcLkG+jm1ph2qIPf5Ll6noKtEKLBQQVAmJ/22M9YPNgFwIkw5RA6MTxn+jhcAyUr/Yv7vvvtuXWDZ2dahn0zBADQLBrDiRxkgFWOqGOYxgpfRMLkm6HnCQI4wX+ey5R2u2aCKe3x8OTo0rPsQYlGwOGyGgLW5MBAskAgRTirxsADkjSDpDzpJ9ny2hQBqeUlfqkZRuLZmgNkzYAwvxHjDO1IA8PTZMAoLwBdAEM92n0Tj6SZCFM9oGO/j66JPuWZdHitUPVP4yndI89QFi3LNuTJQ3lcmkb7c0ylTCC7XpEVQxoWg06Djk7oUmjT7+/t8EzQ6ps1OX1+vrmBGmFhbR5DURXAuaPkAtbDVxKAU88E7VgA+9t8/5j7+8Y9L+z+u3+ez6padrGi7uQdhUli66ZKoFOUqzChhMSAIIoV6zH5V44GwoeUs1DRwzeplmg0Ehz0K+cxqy0tb3KtbX1VrkpYnzX+2AmC/BFoM5egx27G84r8dHPpI2QIEgsolHx+wCrezs0u1iH8sStQPSGnr5Z28YE4V6XEqx0LvFbtvwdrogs9Im+e0+ygW55kg9+Q5O242tDS7JkJzs2741NbV4RYsWugWL1miXyTrrmZHj+rKWixTDLq0OUDoioJ3k/dTUOYSKCcAQvlwdnGYsQCMiIPHypIz3d2uvrFev9xlwQGfHuHc1dTVFmUOByMgqWmKaQVhlr5fLPh08u8nIZTX4MVUmgqJr72EEEYmxuT9Ci13nTRf7PG36ZlnVADYyj6TXMA7XgD4BoClWwjB1le3uhOnTur2aE1NTRqsN4BhJIYF/VBTjqQXFxnLkApKHC8NNEnx+8WDsDu5NyFGQB1PSckC932eXjCGRQCeePJJd/zkcSEBkfwSdn1NX+Wvh/oA5QRA6ZiNk0KpUfxxTn6FQPxSJSiHqqbGls+Rh4VgKTVjzyzx4pU8ZOZcdS0fb3hm0kYefeOofrfHXkEIAE0BmsRHI+xmhSOHVtPtou8OPSB8bAlKISVA1ifxwFGLmZwNCEocssyOg/iSUhJxQqtr1Kk9c7rb/fBHP3a9vX1+YIjiS0T7x8CXnROTZ9wr/I9nEuTVwkGInaF3kaC0LxKokNSr0DPqq8QOYUqlOD9UNTW0FLYAAt6B1dxR4nGPK/9fnohFENPPp13HRBD4GoYt01rmtOhIYV1Dg84TUFG8dMYHMJlcZwQgpGtIGV5OANL4xeHrEQdWL1WzpEvKxIpcBpkYd9i8aZN+cs63jhMjo6GkHml5lAgXDRiVpDcTwKCc0mWRR5ci2ZQWAA2+hv6cPyb7eqplYE08I3j02Y8cPuy2bdumO4DzYWRDfYNnmhCZtE1/ACn765Beoes4PwJpRcBs5zElQtZ85wsAZRq8MKhdzpPHT7it4vk//dRT7tVXXnHDg8P6oSv14GV9X3BpBUCilyj79FA4/nQFoGJux6KcKsQa5i1Abjen0Ni49sXFXDKGrjt8SLvZ2t6ma9w+Il1Gtpdjs2esgnBM41gvLe1WpQRO5wrS52ziyD18D/u9fYPl4eHb8hSbn3lOBZb9hxkbYECJKW7GMfQTNsnfrBVILZDV52Ix2348jWkhpGMYxSzljAUgZYA5QdyPM+WaTBk3uHH9evfAhz6o27vzkSlAsxiU4dNyHTksQsc0v1ggGEU06ASVtOOMGOJvsDsGP70+cL5fnzHAw95Bx48fU0a/Jgzni9qzZ7szYwEGrTf1QbAlxEKalme2KDcOUA7FxgHeEgGIwTWFID0sQ3tnp36//t6NG90NN1yvXxnrkO8Ymx5X6Rr5QiglAGp1wmihfvESnExdqCL3iMsuHiePndA9BHZt36GfnDNwxRe2TGTFsDgxUsFMn88WV5wApCYbLQFxPGACoEPAooHshs2++QuWLnbrrr1Wh5PZJLG+qkby8Cbc5gti5I28BQHgTZ0hFCvARJEJgt/EqlKd0cMHD7rXX9/mdu3Y4c4JwwcvDOg7MD5mNueGcgx+RwkAoBsYawEEiK9LCUAGtM/yj0Ek+uJsZ85IIrta3XHb7TqtXEwIiglABmN8DMn+N+yDM+a2CcO3S3j99ddc9+kzatpxUvkAg4kqmh0sBVaC8xTveAEohFICYHMGBmMY1kMhDKMwViAdfMFxEiYwj4CjeOedd7pbb7tN9yCubajX9pq9fdjkqb21VZmFoKmZZ0MGSfOMtN00G8cOHXGnjh3X7VHZvbO7+4wbYnMoZgVxECVPzY+jpBFr+8XgUgmApWMCgNWyqWrKaIpFnUFcbnumFlDioTSkl/NOUsxZCUCMVCOLNRGxAIBYCKygVAQnkV+24ONF9tdhrz32/uM+u5Gx/tBPJ7PVa5U7339et0Pfs2+v271zlzty4KA7d7ZXt5HR/fHkXZudJB/KERMmPr8YXCoByNAgCIAJKTuJIPD66bhYNBa5kGfs+2BtdbpdjsSnC056sfV8ywXAYARLC8Q1hUbCWdgBs1tb29y6dWvdfQ884NZIjwHB0F8Fk/dw5A7u2+8O7t+vmzPSXcNSsESN3bwhENvWMiilxA0ETfF2EYAMoulgrIDBFtBQH4SALjRrMFEaFME2wma24mx3twoMg27F6P22FADA3D3Mpz1G66lE19y57pYNt7k7NtyhXbY9e/a4vbt3uwu9fa63+6yO2unP1kqASPb7w+TFdSwAKcPKCYClUQxperNFQ5PvFhv4SBRG04WlKws9GKbGMrBYhfEJ6+Ly3qEjR7VLi0Kwt5PB6GvlNQFI6zZrAYh9AHyDlEDFCJYWJL62wtsdLjVtCTVSk5wU8THCKWlYuFhGEc+cRM7z6pNjikVj5V1g+QIWvMBImIcGc7RrNNiudbi81u+zyDXxK2v8eAYaTt6WZjEcOHBIh65Z+FJIAAxvmgUo5gQaijEirhjMNccGxIU1X4J3TMByUiwiAIZi+ReDLVeDKYDRRTTPNBBLFTOQRSSc88OWHNmlm4En3sFUM03OkRlT9jqcM6dFy2fdVoyXmXtleHDodMItvFcKZ06f1V8NY2xDV1mF+hazALa1jOEtFwDTbLuOYc/0XAI5oYHcSisISMOCoVj+pQAD2XIOTYSpsQbHAqC7gsn7lAkmW14cWd4G6IkAW+6GYOG0qZM3MeEa6htzysjQdsr0QrQxnDxxSn9BlVXXpKnD7YIrXgC4D3hmrpHmhMZLklahnPSlcrMVAJjPvr933XWXbjjJQFaMND26pGhdhtCSN9bMyuA3jspe541zVDNb6uNqPDnORAB27Njltm/brr0lBsHedAHIG/BJYqcEKsUASKFtbakSiICZMFilQNxMGEqmUwRp+agfmzXcLz0RiKm7fwWthBGl6gPi58a4mIHGWlssKxKkB+LxXtwUmmDprl+McEocrun1sEUtP1xx6I3sj0XTlYx9lOngLRUAMCUCUBKJhbnUYAQyBkxgZJLfCKJbiZmnzmiurnSOGFQOsxUAoPfEUWDii3fYyPrYsePa9aNMA8Mz/6W0GLn26F14govGDQ4MaFvPNdqPFgIVhhLhUoA8LQyz4/jYuG7YzY9TM22N5jPJZWWaDfIWhJRDnoaHo2GmFkBEPpwUwcXY9Rkg6VOo9w3D+YyNRa5afmGENgdyBPwtFgzGwLT+9k72vj/adZwGYE+f/fv26S+C8VELs5j1DQ06m2pN02yQ2ScwD8H08qEHu1cxzEpXA5MYA+/TYM6PDWsC1g3i+dI26ahW5AQpb6M5/YK4zE0AWhybYRzBzo4Ot2TJEh2pZBAGGuD1A7ptAJNuDhbdunhUrxTqpduon9wLbQDnMJbVVWzAzUAY9+h9cH9cfIEY5T4+LYeyAkBF+R0afhGEAhgKtVWAwsbg0y2ke2RkVJ/ZJ+Xg7SgAKai/32V8Srt++Ac4iQQduawX4Zb60R7zjn21ZCgnCExXwVRoS3w0nJ3CWXUNvbhndOcY8wC86QIAYD4DHYxw2QCJwfq7Bvq4MRgAwYP1H4T26bnhShEAmEB7i1PIURkv9eL66jVrdFazra1VBYG+OEzyO5CXtwRDohgIFtaVjRz15+OFVqTBmkqzCCnjDZdFAACEoB3kq6AYZglSB8jaNI4UnmVXSLfdN7Cgw7p5BfEWCwBQBgjjzQoAzlEKfjmlvb1Df6sIQeCcH3pgfoN4CEIpnL8woD/3CvNhNt072ncsCsKUjkOkePMEIICKKgIjIAB+Ab+khUVIJRPtoD0jUCHaLsapGagAsQ8AEKCSAlAG6WTUTFFOAKz+qeBaPdIBF5oIfsWbn4VFIAALZW0ACHqRJm083vyJU2dEOS7oHgsZWgvS/IqjtIUphxkLAJaAuWgmTBAEq6SBisF4M13mpaYVMouR+hIzAYLzVglApvwFomMpYTjKsmzZcrEKbepI0xzAbH7ahja+p6fHXRgc1jwI5DF9xhsukwDY17ZWcQpqghBDGV/A7Nl7aVPxiygAgI0z+CFsLCA9CQLKwq+C8UOU+EOkPS7FvzjGG95CAQD23FCOob/IAmCMJI4FrACWkPYcp47lauxbAPgUbWQst1s3c8xaAHJ/MiaLhLChCUgZPlPJvdIEIEVe+WcWPQ8ThSY1ZgB+MmY2mJ34vIsrHu8KwDsc7wrAOxrO/X8DWo1Sz7d9wAAAAABJRU5ErkJggg=='

            switch(action) {
                case 'played': {
                    const leaderboardChoice = interaction.options.getString('leaderboard', true) as Leaderboards
                    const playedSubCommand = <APIApplicationCommandSubcommandOption>this.data.options.find(o => o.toJSON().name === 'played')?.toJSON()
                    const playedOptions = <APIApplicationCommandBasicOption[]>playedSubCommand.options
                    const starsMin = interaction.options.getNumber('stars_min') ?? (<APIApplicationCommandNumberOption>playedOptions.find(o => o.name === 'stars_min')).min_value as number
                    const starsMax = interaction.options.getNumber('stars_max') ?? 99
                    const accMin = interaction.options.getNumber('acc_min') ?? (<APIApplicationCommandNumberOption>playedOptions.find(o => o.name === 'acc_min')).min_value as number
                    const accMax = interaction.options.getNumber('acc_max') ?? (<APIApplicationCommandNumberOption>playedOptions.find(o => o.name === 'acc_max')).max_value as number

                    // Identifiant du membre exécutant la commande
                    const memberId = interaction.user.id

                    // Informations sur le membre
                    const member = await players.get(memberId, leaderboardChoice)

                    // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                    const linkCommand = <ApplicationCommand>guild.commands.cache.find(c => c.name === 'link')
                    if(!member) throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`)

                    // On vérifie la cohérence des données renseignées par l'utilisateur
                    if(starsMin > starsMax) throw new CommandInteractionError('Le nombre d\'étoiles minimum ne peut pas être supérieur au nombre d\'étoiles maximum')
                    if(accMin > accMax) throw new CommandInteractionError('L\'accuracy minimum ne peut pas être supérieur à l\'accuracy maximum')

                    const embed = new Embed()
                        .setColor('#F1C40F')
                        .setDescription('🛠️ Génération de la playlist en cours...')

                    await interaction.editReply({ embeds: [embed] })

                    // Récupération des scores
                    const gameLeaderboard = new GameLeaderboard(leaderboardChoice)
                    const playerScores = await gameLeaderboard.requests.getPlayerScores(member.playerId)
                    const playerScoresFiltered = playerScores.filter(ps => {
                        if(!ps.ranked || ps.maxScore === 0) return false
                        const acc = ps.score / ps.maxScore * 100
                        return ps.stars >= starsMin && ps.stars <= starsMax && acc >= accMin && acc <= accMax
                    })

                    if(playerScoresFiltered.length === 0) throw new CommandInteractionError('Aucune map correspondant aux critères choisis n\'a été trouvée')

                    // Génération du fichier playlist
                    const playlistName = `[${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}] Maps jouées ${starsMin}⭐ à ${starsMax}⭐ - ${accMin}% à ${accMax}%`

                    const playlist: Playlist = {
                        playlistTitle: playlistName,
                        playlistAuthor: playlistAuthor,
                        playlistDescription: playlistDescription,
                        image: playlistImage,
                        songs: []
                    }

                    const hashes = []
                    for(const score of playerScoresFiltered) {
                        const songName = `${score.songName}${score.songSubName !== '' ? ` ${score.songSubName}` : ''} - ${score.songAuthorName}`
                        const diff = leaderboardChoice === Leaderboards.ScoreSaber ? score.difficultyRaw.split('_')[1].toLowerCase().replace('expertplus', 'expertPlus') : score.difficultyRaw.toLowerCase().replace('expertplus', 'expertPlus')

                        const index = hashes.indexOf(score.songHash)
                        if(index < 0) {
                            hashes.push(score.songHash)
                            const song = { hash: score.songHash, songName: songName, difficulties: [{ characteristic: 'Standard', name: diff }] }
                            playlist.songs.push(song)
                        } else {
                            const song = playlist.songs[index]
                            const difficulty = { characteristic: 'Standard', name: diff }
                            song.difficulties.push(difficulty)
                        }
                    }

                    const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(playlist)), { name: playlistName + '.json' })

                    await interaction.editReply({ content: `Ta playlist est prête ! (${playlist.songs.length} maps)`, embeds: [], files: [attachment] })

                    break
                }
                case 'ranked': {
                    const leaderboardChoice = interaction.options.getString('leaderboard', true) as Leaderboards
                    const rankedSubCommand = <APIApplicationCommandSubcommandOption>this.data.options.find(o => o.toJSON().name === 'ranked')?.toJSON()
                    const rankedOptions = <APIApplicationCommandBasicOption[]>rankedSubCommand.options
                    const starsMin = interaction.options.getNumber('stars_min') ?? (<APIApplicationCommandNumberOption>rankedOptions.find(o => o.name === 'stars_min')).min_value as number
                    const starsMax = interaction.options.getNumber('stars_max') ?? 99

                    // On vérifie la cohérence des données renseignées par l'utilisateur
                    if(starsMin > starsMax) throw new CommandInteractionError('Le nombre d\'étoiles minimum ne peut pas être supérieur au nombre d\'étoiles maximum')

                    const embed = new Embed()
                        .setColor('#F1C40F')
                        .setDescription('🛠️ Génération de la playlist en cours...')

                    await interaction.editReply({ embeds: [embed] })

                    // Génération du fichier playlist
                    const playlistName = `[${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}] Maps ranked ${starsMin}⭐ à ${starsMax}⭐`

                    const playlist: Playlist = {
                        playlistTitle: playlistName,
                        playlistAuthor: playlistAuthor,
                        playlistDescription: playlistDescription,
                        image: playlistImage,
                        songs: []
                    }

                    if(leaderboardChoice === Leaderboards.ScoreSaber) {
                        const maps = await beatsaver.searchRanked(starsMin, starsMax)
                        if(maps.length === 0) throw new CommandInteractionError('Aucune map ranked correspondant aux critères choisis n\'a été trouvée')

                        for(const map of maps) {
                            const version = map.versions[map.versions.length - 1]
                            const hash = version.hash
                            const songName = `${map.metadata.songName}${map.metadata.songSubName !== '' ? ` ${map.metadata.songSubName}` : ''} - ${map.metadata.levelAuthorName}`
                            const difficulties = version.diffs.map(d => {
                                return {
                                    characteristic: d.characteristic,
                                    name: d.difficulty.toLowerCase().replace('expertplus', 'expertPlus')
                                }
                            })

                            const song = { hash: hash, songName: songName, difficulties: difficulties }
                            playlist.songs.push(song)
                        }
                    } else {
                        const maps = await beatleader.searchRanked(starsMin, starsMax)
                        if(maps.length === 0) throw new CommandInteractionError('Aucune map ranked correspondant aux critères choisis n\'a été trouvée')

                        playlist.songs = maps
                    }

                    const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(playlist)), { name: playlistName + '.json' })

                    await interaction.editReply({ content: `Ta playlist est prête ! (${playlist.songs.length} maps)`, embeds: [], files: [attachment] })

                    break
                }
                case 'snipe': {
                    const leaderboardChoice = interaction.options.getString('leaderboard', true) as Leaderboards
                    const targetMember = interaction.options.getUser('joueur', true)

                    // Identifiant du membre exécutant la commande
                    const memberId = interaction.user.id

                    // Identifiant du membre à sniper
                    const targetMemberId = targetMember.id

                    // Informations sur les membres
                    const member = await players.get(memberId, leaderboardChoice)

                    // Informations sur les membres
                    const memberToSnipe = await players.get(targetMemberId, leaderboardChoice)

                    // On vérifie ici si les membres (celui exécutant la commande et celui à sniper) ont lié leur compte ScoreSaber ou BeatLeader
                    const linkCommand = <ApplicationCommand>guild.commands.cache.find(c => c.name === 'link')
                    if(!member) throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`)
                    if(!memberToSnipe) throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} n'est lié pour le compte Discord ${userMention(targetMemberId)}`)

                    const embed = new Embed()
                        .setColor('#F1C40F')
                        .setDescription('🛠️ Génération de la playlist en cours...')

                    await interaction.editReply({ embeds: [embed] })

                    // Récupération des scores des joueurs
                    const gameLeaderboard = new GameLeaderboard(leaderboardChoice)
                    const playerToSnipe = await gameLeaderboard.requests.getPlayerData(memberToSnipe.playerId)
                    const playerScores = await gameLeaderboard.requests.getPlayerScores(member.playerId)
                    const playerToSnipeScores = await gameLeaderboard.requests.getPlayerScores(memberToSnipe.playerId)

                    const scoresToSnipe = []
                    for(const s1 of playerToSnipeScores) {
                        if(playerScores.find(s2 => s1.songHash === s2.songHash && s1.difficulty === s2.difficulty && s1.gameMode === s2.gameMode && s2.score < s1.score)) {
                            scoresToSnipe.push(s1)
                        }
                    }

                    if(scoresToSnipe.length === 0) throw new CommandInteractionError('Aucune map à sniper n\'a été trouvée')

                    // Génération du fichier playlist
                    const playlistName = `[${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}] Snipe ${playerToSnipe.name}`

                    const playlist: Playlist = {
                        playlistTitle: playlistName,
                        playlistAuthor: playlistAuthor,
                        playlistDescription: playlistDescription,
                        image: playlistImage,
                        songs: []
                    }

                    const hashes = []
                    for(const score of scoresToSnipe) {
                        const songName = `${score.songName}${score.songSubName !== '' ? ` ${score.songSubName}` : ''} - ${score.songAuthorName}`
                        const diff = leaderboardChoice === Leaderboards.ScoreSaber ? score.difficultyRaw.split('_')[1].toLowerCase().replace('expertplus', 'expertPlus') : score.difficultyRaw.toLowerCase().replace('expertplus', 'expertPlus')

                        const index = hashes.indexOf(score.songHash)
                        if(index < 0) {
                            hashes.push(score.songHash)
                            const song = { hash: score.songHash, songName: songName, difficulties: [{ characteristic: 'Standard', name: diff }] }
                            playlist.songs.push(song)
                        } else {
                            const song = playlist.songs[index]
                            const difficulty = { characteristic: 'Standard', name: diff }
                            song.difficulties.push(difficulty)
                        }
                    }

                    const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(playlist)), { name: playlistName + '.json' })

                    await interaction.editReply({ content: `Ta playlist est prête ! (${playlist.songs.length} maps)`, embeds: [], files: [attachment] })

                    break
                }
            }
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR' || error.name === 'SCORESABER_ERROR' || error.name === 'BEATLEADER_ERROR' || error.name === 'BEATSAVER_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}