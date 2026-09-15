FROM node:20-alpine

WORKDIR /app

# better-sqlite3 has a native addon; build tools cover platforms without a
# prebuilt binary (e.g. some arm64 Docker hosts).
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV PORT=4000
ENV DB_PATH=/app/data/netatlas.sqlite
EXPOSE 4000

CMD ["node", "src/server.js"]
