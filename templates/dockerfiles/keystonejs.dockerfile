FROM node:18-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create package.json with stable versions
COPY package.json .
RUN npm install

# Copy application files
COPY . .

# Build application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]