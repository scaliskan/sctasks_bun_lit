FROM oven/bun:latest

WORKDIR /app

# Copy lockfile and package.json
COPY bun.lock package.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Expose the port (matches your server.js)
EXPOSE 3000

# Run the application
CMD ["bun", "run", "src/server.js"]
