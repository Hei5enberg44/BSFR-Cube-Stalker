const members = require('../controllers/members')
const Logger = require('../utils/logger')

module.exports = {
	async execute(member) {
		const memberId = member.id
		const memberTag = member.user.tag

		await members.delMember(memberId)

		Logger.log('EventManager', 'INFO', `Le membre "${memberTag}" vient de quitter le serveur. Celui-ci a été supprimé du classement de Cube Stalker.`)
	}
}