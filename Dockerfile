# AI Trace production image. Builds the Next.js app and runs it with the
# SQLite database on a persistent volume (see AI_TRACE_DB in DEPLOY.md).
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "scripts/start.sh"]
