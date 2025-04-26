# Use official Node.js image with Debian (so we can install Python)
FROM node:18-bullseye-slim

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Copy everything into the container
COPY . .

# Install Python dependencies
RUN pip3 install torch transformers

# Expose the port your Node.js server runs on (e.g., 3000)
EXPOSE 3000

# Start Node.js server
CMD ["npm", "start"]
