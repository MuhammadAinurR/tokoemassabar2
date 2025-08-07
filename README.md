npx prisma generate

npx prisma migrate dev --name init

reset db
npx prisma db push --force-reset && npx prisma db seed

# From your local machine, use scp or rsync

rsync -avz --exclude 'node_modules' --exclude '.next' /path/to/your/nextjs/app/ root@your_vps_ip:/var/www/nextjs-app/

install on vps with low spec
npm install --no-optional --maxsocket=3

backup

```terminal
pg_dump -U admin -h localhost -p 5432 -F c -b -v -f "tokoemasdb_backup_$(date +%Y%m%d%H%M%S).sqlc" tokoemasdb
scp -r TokoEmasSB2@103.196.153.236:~/backup ~/Downloads
```

restore

```terminal
pg_restore --clean -U postgres -d tokoemasdb tokoemasdb_backup_20250709004131.sqlc
```

# How to add column or modify without wipe all the data

edit your schema.prisma
npx prisma db push
npx prisma generate
