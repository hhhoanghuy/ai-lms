# Hệ thống LMS Chấm bài bằng AI (Gemini Edition)

Dự án này là một Hệ thống Quản lý Học tập (LMS) hoàn chỉnh với tính năng chấm mã nguồn tự động bằng AI Gemini từ các kho lưu trữ GitHub.

## 🚀 Hướng dẫn Thiết lập

### Yêu cầu Tiên quyết
- Node.js (v16+)
- MongoDB (Atlas Cloud hoặc Local)
- Khóa API Gemini (Google AI Studio)

### Thiết lập Backend
1. Di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các phụ thuộc:
   ```bash
   npm install
   ```
3. Cập nhật tệp `.env` với `MONGODB_URI` và các `GEMINI_API_KEY` của bạn.
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
- **AI Engine:** Google Gemini AI (với cơ chế Round-Robin xoay vòng nhiều API Key)
- **Automation:** Puppeteer (Chụp ảnh và soi giao diện Vercel)

## ✨ Tính năng Nổi bật: Golden Match
Hệ thống tích hợp thuật toán so sánh chuỗi thông minh. Nếu mã nguồn sinh viên giống đáp án mẫu > 92%, hệ thống sẽ tự động gán điểm 10 mà không cần gọi AI, giúp tiết kiệm Quota và tăng tốc độ chấm bài lên gấp 10 lần.

## 🔑 Các Vai trò Mặc định
- **Giáo viên (Teacher):** Có thể tạo bài tập với tiêu chí chấm bài và kích hoạt chấm bài bằng AI.
- **Sinh viên (Student):** Có thể nộp kho lưu trữ GitHub và yêu cầu phúc khảo.
- **Trợ giảng (TA):** Có thể xem các bài nộp và hỗ trợ trong quá trình chấm bài.

