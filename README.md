# NFT-Mailing-List/Application

This application allows holders of a specific NFT to sign up to an email mailing list. The ownership of the Ethereum address is authorised through SIWE and updates to the user profile are cryptographically signed before inserting into the database.

### Development

```bash
npx prisma migrate reset # Reset database
npx prisma studio # Opens a web GUI for the database
```