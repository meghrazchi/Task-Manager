FROM node:24-alpine

WORKDIR /usr/src/app

# Install deps first (better caching)
COPY package*.json ./
COPY tsconfig*.json nest-cli.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Build the app
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run migration:run && npm run start:prod"]
