FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

# Must be present before 'npm ci' so the postinstall script (prisma generate) can run
COPY prisma ./prisma/

RUN npm ci

# Copy the rest of the application code
COPY . .

RUN npm run build

EXPOSE 3000

# Run migrations, run the generic seed command, and start the app in production mode.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run start:prod"]