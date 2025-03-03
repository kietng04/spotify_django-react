FROM node:18-alpine

WORKDIR /app

# Add tini for better process handling
RUN apk add --no-cache tini

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Enable file watching and polling
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true
ENV NODE_ENV=development

# Expose port
EXPOSE 3000

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Command to start the development server with proper host binding
CMD ["npx", "next", "dev", "--port", "3000", "--hostname", "0.0.0.0"]