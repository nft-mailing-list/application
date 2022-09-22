web: next start -p $PORT

release: npx prisma generate && npx prisma migrate deploy && npx prisma db push && npm run prisma:seed
