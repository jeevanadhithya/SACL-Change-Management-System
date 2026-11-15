FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY config ./config
COPY controllers ./controllers
COPY middleware ./middleware
COPY routes ./routes
COPY utils ./utils
COPY server.js ./server.js

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1

CMD ["node", "server.js"]
