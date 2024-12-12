import { OAuthModel } from './database.js'
import { BeatLeaderError } from '../utils/error.js'
import Logger from '../utils/logger.js'

type OAuthToken = {
    access_token: string,
    token_type: string,
    expires_in: number,
    scope: string,
    refresh_token: string
}

export class BeatLeaderOAuth {
    public static async getToken(name: string) {
        const token = await OAuthModel.findOne({
            where: { name }
        })
        return token
    }

    public static async checkToken(token: OAuthModel) {
        const date = Math.floor(Date.now() / 1000)
        if(token && token.expires < date - 300) {
            await this.refreshToken(token)
        }
    }

    public static async refreshToken(token: OAuthModel) {
        const req = await fetch('https://api.beatleader.xyz/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: token.client_id,
                client_secret: token.client_secret,
                refresh_token: token.refresh_token
            })
        })
        if(req.ok) {
            const newToken: OAuthToken = await req.json()
            token.access_token = newToken.access_token
            token.refresh_token = newToken.refresh_token
            token.expires = Math.floor(Date.now() / 1000) + newToken.expires_in
            await token.save()
        }
    }

    static async sendClanInvitation(playerId: string) {
        const token = await this.getToken('beatleader_clan_invite')
        if(!token) {
            Logger.log('BeatLeaderOAuth', 'ERROR', 'Token « beatleader_clan_invite » introuvable')
            throw new BeatLeaderError('Envoi de l\'invitation impossible')
        }

        const params = new URLSearchParams({
            player: playerId
        }).toString()
        const req = await fetch(`https://api.beatleader.xyz/clan/invite?${params}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.access_token}`
            }
        })
        if(!req.ok) {
            const error = await req.text()
            if(req.status === 400) {
                throw new BeatLeaderError(`Une erreur est survenue lors de l'envoi de l'invitation à rejoindre le clan BSFR (${error})`)
            } else {
                Logger.log('BeatLeaderOAuth', 'ERROR', `Une erreur est survenue lors de l'envoi de l'invitation à rejoindre le clan BSFR (${error})`)
                throw new BeatLeaderError('Envoi de l\'invitation impossible')
            }
        }
    }
}