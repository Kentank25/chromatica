# Stage 1: Build the React Application
FROM node:22-alpine AS build-stage

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install exact dependencies
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Compile for production
RUN npm run build

# Stage 2: Serve the Static Files using Nginx
FROM nginx:stable-alpine AS production-stage

# Copy the compiled output files
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 3002

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
