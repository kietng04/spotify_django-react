FROM node:18-alpine

WORKDIR /app

# Thêm tini để xử lý tín hiệu tốt hơn
RUN apk add --no-cache tini

# Sao chép package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Bật chế độ theo dõi file thay đổi
ENV VITE_WATCH_POLLING=true
ENV CHOKIDAR_USEPOLLING=true
ENV NODE_ENV=development

# Mở cổng
EXPOSE 5173

# Sử dụng tini làm entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Lệnh khởi động server phát triển
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]