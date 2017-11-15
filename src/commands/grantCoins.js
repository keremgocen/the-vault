const isAdmin = require('../utils/isAdmin');
const { extractMentionedUsers } = require('../utils/extractMentionedUsers');
const { notifyUserAboutCoinGranted, notifyActivityLogChannel } = require('../services/slack');

class GrantCoinsCommand {
  constructor (slack, coinsService) {
    this.slack = slack;
    this.coinsService = coinsService;

    this.init();
  }

  init () {
    this.slack.on('/grantcoin', async (msg, bot) => {
      const users = await extractMentionedUsers(msg.text);

      if (isAdmin(msg.user_name)) {
        for (let i = 0; i < users.length; i += 1) {
          try {
            const user = await this.coinsService.get(users[i].userId);

            if (!user) {
              await this.coinsService.put({
                id: users[i].userId,
                name: users[i].userName,
                coins: 0
              });
            }

            await this.coinsService.update(users[i].userId, 'SET coins = coins + :one', { ':one': 1 });
            await notifyUserAboutCoinGranted(users[i].userName);
            await notifyActivityLogChannel(`${users[i].userName} was granted 1 :coin: by @${msg.user_name}`);

            bot.replyPrivate(`Coin added! ${users[i].userName} now has ${user ? user.coins + 1 : 1} :coin:.`);
          } catch (error) {
            bot.replyPrivate('Whoops! An Error occured!');
          }
        }
      } else {
        bot.replyPrivate('You don\'t have a permission to do that!');
      }
    });
  }
}

module.exports = GrantCoinsCommand;
