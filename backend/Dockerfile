
# Base image
FROM node:lts-alpine

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Copy the .env and .env.dev files
# COPY .env.dev.json ./

ARG ENVIRONMENT
ENV ENVIRONMENT=${ENVIRONMENT}

# Creates a "dist" folder with the production build
RUN npm run build

# Expose the port on which the app will run
EXPOSE 3000

# Start the server using the production build
CMD ["sh", "-c", "npm run ${ENVIRONMENT}"]
