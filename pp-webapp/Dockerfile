# Build Stage
FROM node:16.17.0-bullseye-slim as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Carry over the virtual environment to Runtime
FROM node:16.17.0-bullseye-slim as runtime

RUN npm install -g serve

ENV BUILD_DIR=/app/build

COPY --from=builder ${BUILD_DIR} ${BUILD_DIR}

WORKDIR /app

CMD ["serve", "-s", "build"]
