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
import playlist from '../controllers/playlist.js'
import players from '../controllers/players.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' with { type: 'json' }

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
                .addUserOption(option =>
                    option.setName('joueur')
                        .setDescription('Génère une playlist pour un autre joueur')
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('stars_min')
                        .setDescription('Nombre d\'étoiles minimum')
                        .setMinValue(0)
                        .setMaxValue(100)
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('stars_max')
                        .setDescription('Nombre d\'étoiles maximum')
                        .setMinValue(0)
                        .setMaxValue(100)
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('acc_min')
                        .setDescription('Accuracy minimum')
                        .setMinValue(0)
                        .setMaxValue(100)
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('acc_max')
                        .setDescription('Accuracy maximum')
                        .setMinValue(0)
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
                        .setMaxValue(100)
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('stars_max')
                        .setDescription('Nombre d\'étoiles maximum')
                        .setMinValue(0)
                        .setMaxValue(100)
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
        .addSubcommand(subcommand =>
            subcommand.setName('clan-wars')
                .setDescription('Génénérer une playlist de maps à capturer pour la guerre de clans BeatLeader')
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

            switch(action) {
                case 'played': {
                    const leaderboardChoice = interaction.options.getString('leaderboard', true) as Leaderboards
                    const targetMember = interaction.options.getUser('joueur')
                    const playedSubCommand = <APIApplicationCommandSubcommandOption>this.data.options.find(o => o.toJSON().name === 'played')?.toJSON()
                    const playedOptions = <APIApplicationCommandBasicOption[]>playedSubCommand.options
                    const starsMin = interaction.options.getNumber('stars_min') ?? (<APIApplicationCommandNumberOption>playedOptions.find(o => o.name === 'stars_min')).min_value as number
                    const starsMax = interaction.options.getNumber('stars_max') ?? (<APIApplicationCommandNumberOption>playedOptions.find(o => o.name === 'stars_max')).max_value as number
                    const accMin = interaction.options.getNumber('acc_min') ?? (<APIApplicationCommandNumberOption>playedOptions.find(o => o.name === 'acc_min')).min_value as number
                    const accMax = interaction.options.getNumber('acc_max') ?? (<APIApplicationCommandNumberOption>playedOptions.find(o => o.name === 'acc_max')).max_value as number

                    // Identifiant du membre pour lequel générer la playlist
                    const memberId = targetMember ? targetMember.id : interaction.user.id

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

                    // Génération de la playlist
                    try {
                        const playlistData = await playlist.getPlayed(leaderboardChoice, member.playerId, starsMin, starsMax, accMin, accMax)

                        const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(playlistData)), { name: playlistData.playlistTitle + '.json' })

                        await interaction.editReply({ content: `Ta playlist est prête ! (${playlistData.songs.length} maps)`, embeds: [], files: [attachment] })
                    } catch(error) {
                        if(error.name === 'PLAYLIST_ERROR') throw new CommandInteractionError(error.message)
                    }

                    break
                }
                case 'ranked': {
                    const leaderboardChoice = interaction.options.getString('leaderboard', true) as Leaderboards
                    const rankedSubCommand = <APIApplicationCommandSubcommandOption>this.data.options.find(o => o.toJSON().name === 'ranked')?.toJSON()
                    const rankedOptions = <APIApplicationCommandBasicOption[]>rankedSubCommand.options
                    const starsMin = interaction.options.getNumber('stars_min') ?? (<APIApplicationCommandNumberOption>rankedOptions.find(o => o.name === 'stars_min')).min_value as number
                    const starsMax = interaction.options.getNumber('stars_max') ?? (<APIApplicationCommandNumberOption>rankedOptions.find(o => o.name === 'stars_max')).max_value as number

                    // On vérifie la cohérence des données renseignées par l'utilisateur
                    if(starsMin > starsMax) throw new CommandInteractionError('Le nombre d\'étoiles minimum ne peut pas être supérieur au nombre d\'étoiles maximum')

                    const embed = new Embed()
                        .setColor('#F1C40F')
                        .setDescription('🛠️ Génération de la playlist en cours...')

                    await interaction.editReply({ embeds: [embed] })

                    // Génération de la playlist
                    try {
                        const playlistData = await playlist.getRanked(leaderboardChoice, starsMin, starsMax)

                        const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(playlistData)), { name: playlistData.playlistTitle + '.json' })

                        await interaction.editReply({ content: `Ta playlist est prête ! (${playlistData.songs.length} maps)`, embeds: [], files: [attachment] })
                    } catch(error) {
                        if(error.name === 'PLAYLIST_ERROR') throw new CommandInteractionError(error.message)
                    }

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

                    // Génération de la playlist
                    try {
                        const playlistData = await playlist.getSnipe(leaderboardChoice, member.playerId, memberToSnipe.playerId)

                        const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(playlistData)), { name: playlistData.playlistTitle + '.json' })

                        await interaction.editReply({ content: `Ta playlist est prête ! (${playlistData.songs.length} maps)`, embeds: [], files: [attachment] })
                    } catch(error) {
                        if(error.name === 'PLAYLIST_ERROR') throw new CommandInteractionError(error.message)
                    }

                    break
                }
                case 'clan-wars': {
                    const embed = new Embed()
                        .setColor('#F1C40F')
                        .setDescription('🛠️ Génération de la playlist en cours...')

                    await interaction.editReply({ embeds: [embed] })

                    // Génération de la playlist
                    try {
                        const playlistData = await playlist.getClan()

                        const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(playlistData)), { name: playlistData.playlistTitle + '.json' })

                        await interaction.editReply({ content: `Ta playlist est prête ! (${playlistData.songs.length} maps)`, embeds: [], files: [attachment] })
                    } catch(error) {
                        if(error.name === 'PLAYLIST_ERROR') throw new CommandInteractionError(error.message)
                    }

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