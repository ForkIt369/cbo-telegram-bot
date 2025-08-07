FROM node:18-alpine

# Install necessary tools
RUN apk add --no-cache bash curl

WORKDIR /app

# Copy package files
COPY server/package*.json ./server/

# Install dependencies
RUN cd server && npm install

# Copy application files
COPY . .

# Expose ports
EXPOSE 8082 8084

# Start the application
CMD ["npm", "--prefix", "server", "start"]