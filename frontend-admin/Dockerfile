FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache tini

COPY package*.json ./
RUN npm install

ENV VITE_WATCH_POLLING=true
ENV CHOKIDAR_USEPOLLING=true
ENV NODE_ENV=development

EXPOSE 5173

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]