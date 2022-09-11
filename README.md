# NFT-Mailing-List/Application

This application allows holders of a specific NFT to sign up to an email mailing list. The ownership of the Ethereum address is authorised through SIWE and updates to the user profile are cryptographically signed before inserting into the database.

### Development

```bash
npx prisma migrate reset # Reset database
npx prisma studio # Opens a web GUI for the database
```

## Deployment

### Database

We need a database to store all the records and data on the application. As this is aimed at a self-host, you need to have a postgresql instance. You can either set this up yourself, or use our ["one-click initalise database"](https://github.com/nft-mailing-list/init-database-heroku) to host it on Heroku.

**Hosting it with one-click**

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://dashboard.heroku.com/new?template=https%3A%2F%2Fgithub.com%2Fnft-mailing-list%2Finit-database-heroku)

* Write a suitable app name, something like "nft-mailing-list-database"
* Press "Deploy App"
* Wait for the build to happen (it should take a minute or two)
* Press "View" to test it was all correct (you should see a positive message in your browser)
* Press "Manage App" to be taken to the app dashboard

🎉 You now have a postgresql database to host your data!

Now we need to grab the connection details for `nft-mailing-list/application`. 

* Navigate, if you're not on it already, to the app dashboard
* Click "Settings"
* Press "Reveal Config Vars"
* Copy the whole field starting with `postgres://...`

This `postgres://...` value is needed for this project, specificall the `DB_URL` environment variable.

### Application

We now need to host this application. We can do it again with one-click to use Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnft-mailing-list%2Fapplication&env=NEXTAUTH_SECRET,NEXTAUTH_URL,DB_URL,RPC_NODE,NEXT_PUBLIC_ENABLE_TESTNETS,NEXT_PUBLIC_SITE_TITLE,NEXT_PUBLIC_ALCHEMY_API_KEY,NEXT_PUBLIC_EVM_CHAIN_ID,NEXT_PUBLIC_EVM_NFT_CONTRACT_ADDRESS,NEXT_PUBLIC_ADMIN_ADDRESS,MAILGUN_PRIVATE_API_KEY,MAILGUN_API_DOMAIN,MAILGUN_FROM_EMAIL&build-command=vercel-build)

Take a look at `.env.local.example` for some defaults on the environment variables. If you're not using Vercel and the platform does not support ENV variables through a GUI, make this into a `.env` file.

| ENV Name                             	| Notes                                                                                                                           	|
|--------------------------------------	|---------------------------------------------------------------------------------------------------------------------------------	|
| NEXTAUTH_SECRET                      	| Go to https://generate-secret.now.sh/32 and copy the output                                                                     	|
| NEXTAUTH_URL                         	|                                                                                                                                 	|
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

### Mailgun (Optional)

If you want to send emails from the application to your active subscribers (ones who have subscribed and ones who are still holding the NFTs), then you'll need a [mailgun account](https://mailgun.com). It has a free trial (with limited features), then it is a paid package.

* Create an account at [MailGun](https://mailgun.com)
* Grab your API key https://app.mailgun.com/app/account/security/api_keys
* Put this value in `MAILGUN_PRIVATE_API_KEY` environment variable
* Next, you need to get your mailgun domain. You can get that from here: https://app.mailgun.com/app/sending/domains/
   * If you upgrade your mailgun account then you can send email to non-limited/verified email addresses
* Configure the `MAILGUN_FROM_EMAIL` to be something specific, ie: `OnChainMonkey <admin@onchainmonkey.com>` (this format is strict!)

**Reminders**

* 🔒 Make sure you add 2FA to your MailGun account: https://app.mailgun.com/app/account/settings