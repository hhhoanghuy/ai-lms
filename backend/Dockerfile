# Sử dụng image Puppeteer chính thức đã cài sẵn Node.js và Chrome
FROM ghcr.io/puppeteer/puppeteer:latest

# Chuyển sang quyền root để cài đặt (nếu cần) và tạo thư mục
USER root

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json trước để tận dụng cache của Docker
COPY package*.json ./

# Cài đặt các phụ thuộc (loại bỏ các gói dev)
RUN npm install --production

# Copy toàn bộ mã nguồn backend vào container
COPY . .

# Mở cổng 5000 cho Render
EXPOSE 5000

# Chạy server bằng node (không dùng nodemon trên production)
CMD ["node", "server.js"]
