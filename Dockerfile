# Multi-stage: build Umi/Ant Design Pro -> serve static via Nginx

FROM node:18-alpine AS build
WORKDIR /app

# Install deps first (better cache)
COPY package*.json ./
RUN npm ci || npm install

# Copy source & build
COPY . .
# Umi/Ant Design Pro build output is usually /dist
RUN npm run build

FROM nginx:1.25-alpine AS runtime
# SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
