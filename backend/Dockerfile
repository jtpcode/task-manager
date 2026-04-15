FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy Prisma schema and generate the Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

RUN npm run build

EXPOSE 3000

# Run migrations, run the generic seed command, and start the app in production mode.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run start:prod"]