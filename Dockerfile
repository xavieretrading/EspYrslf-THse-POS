FROM node:22-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Start server
CMD ["npm", "start"]
