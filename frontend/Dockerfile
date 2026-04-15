FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy the rest of the application code
COPY . .

EXPOSE 5173

# Start the Vite dev server and expose it to the Docker network
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]