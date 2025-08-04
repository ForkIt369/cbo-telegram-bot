FROM node:18-alpine

WORKDIR /app

# Install dependencies for bot
COPY package*.json ./
RUN npm ci --only=production

# Copy Mini App package.json first
COPY mini-app/package*.json ./mini-app/
WORKDIR /app/mini-app
RUN npm ci

# Build Mini App
WORKDIR /app
COPY . .
RUN npm run build

EXPOSE 3000

USER node

CMD ["node", "src/index.js"]