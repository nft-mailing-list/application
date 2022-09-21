# NFT-Mailing-List/Application

This application allows holders of a specific NFT to sign up to an email mailing list. The ownership of the Ethereum address is authorised through SIWE and updates to the user profile are cryptographically signed before inserting into the database.

### Development

```bash
npx prisma migrate reset # Reset database
npx prisma studio # Opens a web GUI for the database
```

## Deployment

Check out [the wiki](https://github.com/nft-mailing-list/application/wiki/Deployment) if you want more installation instructions - such as deploying the database separately and hosting the application on Vercel!

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://dashboard.heroku.com/new?template=https%3A%2F%2Fgithub.com%2Fnft-mailing-list%2Fapplication%2Ftree%2Fmain)

### A note about Heroku

A note about Deploying to Heroku: ***Starting November 28th, 2022, free Heroku Dynos, free Heroku Postgres, and free Heroku Data for Redis® will no longer be available.*** This means minimum costs to operate this application is:

* [PostgresSQL](https://elements.heroku.com/addons/heroku-postgresql): $9/month
* [Dyno](https://www.heroku.com/pricing): $7/month

If you also include the Mailgun subscription...

* [Mailgun](https://www.mailgun.com/pricing/): $35/month

-- Total: $51/month


**Note:** I have included [`init-database-heroku`](https://github.com/nft-mailing-list/init-database-heroku) repo if you want to run your Database on Heroku and the rest of the application elsewhere (this will cost min. $9/month). It is a standard PostgresSQL instance so you can find another provider ([or host your own](https://www.digitalocean.com/community/tutorials/how-to-install-postgresql-on-ubuntu-20-04-quickstart))

Take a look at [`.env.local.example`](https://github.com/nft-mailing-list/application/blob/main/.env.local.example) for some defaults on the environment variables. If you're not using Heroku/Vercel and the platform does not support ENV variables through a GUI, copy the contents into an `.env` file.

| ENV Name                             	| Notes                                                                                                                           	|
|--------------------------------------	|---------------------------------------------------------------------------------------------------------------------------------	|
| NEXTAUTH_SECRET                      	| Go to https://generate-secret.now.sh/32 and copy the output                                                                     	|
| NEXTAUTH_URL                         	| The domain of the application (ie: `https://nft-mailing-list.com/` or `http://localhost:3000`)                                   	|
| DB_URL                               	| The string you copied in the database application, starting with `postgres://`                                                  	|
| RPC_NODE                             	| The RPC node to check chain state (ie: `https://eth-mainnet.alchemyapi.io/v2/_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC`)                 	|
| NEXT_PUBLIC_ENABLE_TESTNETS          	| Have `true` if you want to enable testnets on connection, otherwise `false`                                                     	|
| NEXT_PUBLIC_SITE_TITLE               	| The title of the site                                                                                                           	|
| NEXT_PUBLIC_ALCHEMY_API_KEY          	| If you don't have an [alchemy key](https://www.alchemy.com/) then use the default public one `_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC` 	|
| NEXT_PUBLIC_EVM_CHAIN_ID             	| The chainID that your NFT contract is on, see https://chainlist.org/ if you are unsure                                          	|
| NEXT_PUBLIC_EVM_NFT_CONTRACT_ADDRESS 	| The contract address of your NFTs                                                                                               	|
| NEXT_PUBLIC_ADMIN_ADDRESS            	| Your 0x address. SIWE with this address to access the admin panel                                                               	|
| MAILGUN_PRIVATE_API_KEY               | Your Mailgun API key https://app.mailgun.com/app/account/security/api_keys                                                        |
| MAILGUN_API_DOMAIN                    | The API endpoint for mailgun (this will change if you're using the sandbox)                                                       |
| MAILGUN_FROM_EMAIL                    | The email address to send these emails from (ie: `Harry Denley <hello@harrydenley.com>`)                                          |

🎉 The application is now be running!
### Mailgun (Optional)

If you want to send emails from the application to your active subscribers (ones who have subscribed and ones who are still holding the NFTs), then you'll need a [mailgun account](https://mailgun.com). It has a free trial (with limited features), then it is a paid package.

This is optional as you are able to export your subscribers emails within the admin dashboard and use it with your own mailing software.

* Create an account at [MailGun](https://mailgun.com)
* Grab your API key https://app.mailgun.com/app/account/security/api_keys
* Put this value in `MAILGUN_PRIVATE_API_KEY` environment variable
* Next, you need to get your mailgun domain. You can get that from here: https://app.mailgun.com/app/sending/domains/
   * If you upgrade your mailgun account then you can send email to non-limited/verified email addresses
* Configure the `MAILGUN_FROM_EMAIL` to be something specific, ie: `OnChainMonkey <admin@onchainmonkey.com>` (this format is strict!)

**Reminders**

* 🔒 Make sure you add 2FA to your MailGun account: https://app.mailgun.com/app/account/settings

# Donations 💖

If you want to donate to the project, please send funds to `nft-mailing-list.eth` (proof of key ownership below)

```json
{
  "address": "0x27a04518b0271fC863702e3c4b00896599F058DA",
  "msg": "nft-mailing-list donation address",
  "sig": "0x423ab383ce6d9490260bf2692dcf3d9fe0912a5269dea1d52e36836aee5380ce1a47759adac9d8d9a7e192699636386c0411a4d9bb7200a07045b34e5317d7091c",
  "version": "2"
}
```