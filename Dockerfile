# Stage 1: Build the Vite React Frontend
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:20-slim
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy built frontend assets and server file
COPY --from=builder /app/dist ./dist
COPY server.js ./

# Hugging Face Spaces requires user with UID 1000
RUN useradd -m -u 1000 user && chown -R user:user /app
USER user

# Hugging Face default container port
ENV PORT=7860
ENV NODE_ENV=production
EXPOSE 7860

CMD ["node", "server.js"]
