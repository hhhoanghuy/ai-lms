# Hệ thống LMS Chấm bài bằng AI

Dự án này là một Hệ thống Quản lý Học tập (LMS) hoàn chỉnh với tính năng chấm mã nguồn tự động bằng AI từ các kho lưu trữ GitHub.

## 🚀 Hướng dẫn Thiết lập

### Yêu cầu Tiên quyết
- Node.js (v16+)
- MongoDB (đang chạy cục bộ hoặc URI đám mây)
- Khóa API OpenAI

### Thiết lập Backend
1. Di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các phụ thuộc:
   ```bash
   npm install
   ```
3. Cập nhật tệp `.env` với `MONGODB_URI` và `OPENAI_API_KEY` của bạn.
4. Khởi động máy chủ:
   ```bash
   npm run dev
   ```

### Thiết lập Frontend
1. Di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi động máy chủ phát triển:
   ```bash
   npm run dev
   ```
4. Truy cập ứng dụng tại `http://localhost:5173`.

## 🛠️ Công nghệ Sử dụng
- **Backend:** Node.js, Express, MongoDB/Mongoose
- **Frontend:** React, Vite, Vanilla CSS
- **AI Engine:** GPT-4 (thông qua API OpenAI)

## 🔑 Các Vai trò Mặc định
- **Giáo viên (Teacher):** Có thể tạo bài tập với tiêu chí chấm bài và kích hoạt chấm bài bằng AI.
- **Sinh viên (Student):** Có thể nộp kho lưu trữ GitHub và yêu cầu phúc khảo.
- **Trợ giảng (TA):** Có thể xem các bài nộp và hỗ trợ trong quá trình chấm bài.
