# node-consumer/Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm i --omit=dev

COPY index.js ./

ENV NODE_ENV=production \
    PROM_PORT=3000 \
    TOPIC=tidb-cdc \
    GROUP_ID=cdc-node-consumer-group \
    KAFKA_BROKERS=kafka:9092

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=2s --retries=6 CMD wget -qO- http://localhost:3000/readyz || exit 1
CMD ["node", "index.js"]
