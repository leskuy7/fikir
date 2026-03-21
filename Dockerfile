# Repo kokunde oldugu icin Railway (Root Directory bos) bu dosyayi gorur, Railpack kullanilmaz.
FROM node:20.19.4-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ .
EXPOSE 3001

CMD ["node", "server.js"]
