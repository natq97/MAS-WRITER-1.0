# MAS-Writer: Agentic Content Authoring

MAS-Writer là một ứng dụng web tiên tiến, được thiết kế để thay đổi cách chúng ta tạo ra các tài liệu có cấu trúc. Bằng cách sử dụng một hệ thống đa tác tử AI (Multi-Agent System), ứng dụng này cho phép người dùng tương tác với các tác tử chuyên biệt cho việc lập dàn ý, nghiên cứu, và viết nội dung, tất cả trong một giao diện trực quan và liền mạch.

## ✨ Tính Năng Nổi Bật

-   **Quản lý theo Dự án:** Dễ dàng tạo và quản lý nhiều dự án viết lách riêng biệt.
-   **Tác tử Điều phối (Coordinator Agent):** Một prompt tổng thể định hướng cho tất cả các tác tử AI khác, đảm bảo sự nhất quán về văn phong và mục tiêu cho toàn bộ tài liệu.
-   **Cơ sở Tri thức Toàn cục (RAG):** Tải lên các tài liệu (PDF, TXT, DOCX) để làm nguồn tri thức tham khảo cho tất cả các tác tử trong một dự án.
-   **Tác tử Lập Dàn ý (Outliner Agent):** Tương tác bằng ngôn ngữ tự nhiên để nhanh chóng tạo và chỉnh sửa cấu trúc, dàn ý của tài liệu.
-   **Tác tử Viết (Writer Agent):** Tự động tạo nội dung chi tiết, chất lượng cao cho từng phần trong dàn ý.
-   **Viết theo Ngữ cảnh:** Tác tử Viết có khả năng tham chiếu đến các phần đã hoàn thành, tài liệu được tải lên trong phiên làm việc, và kết quả nghiên cứu để đảm bảo tính liên kết và chính xác.
-   **Tác tử Nghiên cứu (Research Agent):** Tích hợp Google Search để tìm kiếm và tóm tắt thông tin từ web, cung cấp nguồn tham khảo cập nhật và đáng tin cậy.
-   **Giao diện 3 cột:** Bố cục trực quan bao gồm Dàn ý, Vùng làm việc (Workspace), và Bảng tương tác với Tác tử, tối ưu hóa quy trình làm việc.
-   **Xuất file Markdown:** Dễ dàng xuất toàn bộ nội dung đã hoàn thành ra định dạng file `.md` phổ biến.
-   **Lưu ý:** Tính năng KNOWLEDGE RAG chỉ dùng để demo và mô tả MVP 1.0, có thể bị lỗi khi sử dụng.

## 🛠️ Công Nghệ Sử Dụng

-   **Frontend:** React, TypeScript, Tailwind CSS
-   **AI:** Google Gemini API (`@google/genai`)

## 🚀 Bắt đầu

Hướng dẫn này sẽ giúp bạn cài đặt và chạy dự án trên máy tính cá nhân.

### Yêu cầu

1.  **Node.js:** Cần thiết để chạy một máy chủ local đơn giản. Bạn có thể tải về từ [nodejs.org](https://nodejs.org/).
2.  **Google Gemini API Key:** Bạn cần có một API key để tương tác với mô hình Gemini.
    -   Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey) để tạo key miễn phí.

### Cài đặt và Chạy Local

1.  **Tải mã nguồn:**
    Tải về và giải nén toàn bộ các file của dự án vào một thư mục trên máy tính của bạn.

2.  **Tạo file cấu hình API Key:**
    -   Trong thư mục gốc của dự án, tạo một file mới có tên là `env.js`.
    -   Mở file `env.js` và dán đoạn mã sau vào:

    ```javascript
    // IMPORTANT: Do not commit this file to your version control system.
    var process = {
      env: {
        API_KEY: "YOUR_API_KEY_HERE",
      },
    };
    ```

    -   **Quan trọng:** Thay thế `YOUR_API_KEY_HERE` bằng Gemini API key thực của bạn đã tạo ở bước trên.

3.  **Chạy máy chủ web local:**
    -   Mở terminal (hoặc Command Prompt/PowerShell) trong thư mục gốc của dự án.
    -   Cài đặt `serve`, một máy chủ static đơn giản, bằng cách chạy lệnh:
        ```bash
        npm install -g serve
        ```
    -   Sau khi cài đặt xong, khởi động máy chủ bằng lệnh:
        ```bash
        serve
        ```
    -   Terminal sẽ hiển thị một địa chỉ local, thường là `http://localhost:3000`.

4.  **Truy cập ứng dụng:**
    Mở trình duyệt web của bạn và truy cập vào địa chỉ mà terminal đã cung cấp (ví dụ: `http://localhost:3000`). Giờ đây bạn có thể bắt đầu sử dụng ứng dụng.

## 📖 Hướng Dẫn Sử Dụng

1.  **Tạo Dự án Mới:**
    -   Tại màn hình đầu tiên, nhập tên dự án và nhấn "Create New Project".

2.  **Cấu hình Dự án:**
    -   Bạn sẽ được chuyển đến Bảng điều khiển Dự án (Project Dashboard).
    -   **Coordinator Agent Prompt:** Chỉnh sửa prompt tổng thể để định hướng văn phong và mục tiêu cho AI.
    -   **Global Knowledge Base:** Tải lên các file tài liệu (PDF, TXT, etc.) để làm tri thức nền cho toàn bộ dự án.
    -   Nhấn "Enter Authoring Environment" để vào không gian viết.

3.  **Lập Dàn ý:**
    -   Trong cột bên phải (Agent Interaction), trò chuyện với **Outliner Agent**. Hãy yêu cầu nó tạo dàn ý cho một chủ đề. Ví dụ: "Tạo dàn ý chi tiết cho một bài viết về lịch sử của trí tuệ nhân tạo".
    -   Dàn ý thô sẽ xuất hiện ở cột giữa (Workspace). Bạn có thể chỉnh sửa trực tiếp hoặc ra thêm lệnh cho Tác tử.
    -   Khi đã hài lòng, nhấn "Finalize Outline". Dàn ý sẽ được cấu trúc hóa và hiển thị ở cột bên trái.

4.  **Viết Nội dung:**
    -   Chọn một mục trong dàn ý ở cột trái để bắt đầu viết.
    -   Cột bên phải sẽ chuyển sang **Writer Agent**.
    -   **Bổ sung tri thức (thẻ Knowledge):** Tải lên các file chỉ dùng cho mục này hoặc dùng **Research Agent** để tìm kiếm thông tin trên web.
    -   **Chọn ngữ cảnh (thẻ Context):** Tick chọn các mục đã hoàn thành khác để AI tham khảo khi viết.
    -   Nhấn "Generate Initial Draft" để AI viết bản nháp đầu tiên.

5.  **Chỉnh sửa và Hoàn thiện:**
    -   Chỉnh sửa nội dung do AI tạo ra ở cột giữa.
    -   Bạn có thể tiếp tục trò chuyện với Writer Agent để yêu cầu nó viết lại, thêm chi tiết, hoặc rút gọn.
    -   Khi hoàn tất một mục, nhấn "Commit to Document". Trạng thái của mục sẽ chuyển thành "Completed".

6.  **Xuất Tài liệu:**
    -   Sau khi đã hoàn thành các mục cần thiết, nhấn nút "Export Document" ở cuối cột bên trái để tải về file Markdown hoàn chỉnh.
