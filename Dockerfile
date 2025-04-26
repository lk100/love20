# Use official Node.js image with Debian
FROM node:18-bullseye-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Fix: Create alias so "python" points to "python3"
RUN ln -s /usr/bin/python3 /usr/bin/python

# Copy everything else
COPY . .

# Install Python libraries
RUN pip3 install torch transformers

# Expose server port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
