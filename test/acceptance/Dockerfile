FROM node:18

# Install necessary dependencies for Chrome/Chromium
RUN --mount=type=cache,target=/var/cache/apt --mount=type=cache,target=/var/lib/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    curl \
    fonts-liberation \
    libcups2 \
    libasound2 \
    libatk1.0-0 \
    libgbm1 \
    libgconf-2-4 \
    libgtk-3-0 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxss1 \
    unzip \
    wget \
    xdg-utils

# Switch to the built-in node user
USER node

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json with specified ownership
COPY --chown=node:node package*.json ./

# Install dependencies as the node user
RUN npm install

# Copy the rest of the application files with specified ownership
COPY --chown=node:node . .

# Make the start-tests.sh script executable
RUN chmod +x start-tests.sh

# Set the entrypoint to the start-tests.sh script
ENTRYPOINT ["./start-tests.sh"]
