📑 Luồng chấm bài hàng loạt (Step-by-Step)
Step 1: Backend (Máy chủ của bạn) thu thập dữ liệu
Khi bạn nhấn lệnh "Chấm hàng loạt", Backend (Node.js) sẽ tự mình đi làm "thám tử" cho 10 sinh viên cùng lúc:

Vào GitHub: Backend dùng githubService để quét toàn bộ mã nguồn (HTML/CSS/JS) và gom lại thành một đoạn văn bản khổng lồ.
Vào Vercel: Backend dùng Puppeteer (một trình duyệt ẩn danh) để truy cập Link demo, chụp ảnh màn hình và "soi" các thông số CSS thực tế (màu sắc, kích thước...).
Step 2: Backend xử lý "Thông minh" (Golden Match)
Trước khi hỏi AI, Backend thực hiện một bước kiểm tra nội bộ:

Nó so sánh mã nguồn vừa lấy về với "Bài chuẩn 10 điểm" của lượt chấm đó.
Nếu giống > 92%: Backend tự gán 1 điểm 10 luôn. Kết thúc luồng cho sinh viên này (Tiết kiệm Token).
Step 3: Backend viết "Hồ sơ chấm bài" (Prompt Construction)
Nếu bài không giống mẫu, Backend sẽ tổng hợp một bản báo cáo cực kỳ chi tiết gửi cho Gemini:

"Này Gemini, đây là Đề bài và Rubric."
"Đây là Mã nguồn tôi vừa lấy từ GitHub của SV."
"Đây là Thông số giao diện tôi vừa soi được ở Vercel."
"Dựa vào Lưu ý chấm bài của Giảng viên này, hãy chấm điểm đi!"
Step 4: AI phân tích và trả kết quả
Backend gửi "Hồ sơ" trên cho Gemini qua API:

Gemini nhận toàn bộ "gói dữ liệu" này, đọc và đối chiếu Code với Rubric.
Gemini trả về một chuỗi dữ liệu (JSON) chứa: Điểm từng tiêu chí, Lời phê gạch đầu dòng theo đúng phong cách giảng viên.
Step 5: Backend lưu trữ và hiển thị
Backend nhận kết quả từ AI, lưu vào Database.
Bạn (Giảng viên) nhìn thấy bảng điểm hiện lên ở Dashboard để duyệt lại lần cuối.