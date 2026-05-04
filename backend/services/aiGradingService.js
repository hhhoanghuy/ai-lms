const { callAI } = require('./aiClient');
const puppeteer = require('puppeteer');
const stringSimilarity = require('string-similarity');

/**
 * filterCSS: Lọc bỏ các thuộc tính CSS không quan trọng để tiết kiệm Token
 */
const filterCSS = (styles) => {
  if (!styles) return {};
  const filtered = {};
  const ignoreList = [
    'transition', 'cursor', 'user-select', 'pointer-events', 'z-index', 
    'animation', 'webkit', 'moz', 'ms', 'o-', 'will-change'
  ];

  Object.entries(styles).forEach(([selector, props]) => {
    const cleanProps = {};
    Object.entries(props).forEach(([key, val]) => {
      const isNoise = ignoreList.some(term => key.toLowerCase().includes(term));
      const isDefault = ['none', 'normal', 'auto', '0px', '0', 'inherit', 'initial'].includes(val);
      
      if (!isNoise && !isDefault) {
        cleanProps[key] = val;
      }
    });
    if (Object.keys(cleanProps).length > 0) {
      filtered[selector] = cleanProps;
    }
  });
  return filtered;
};

const inspectVisualAndInteraction = async (url) => {
  if (!url) return { screenshot: null, mobileScreenshot: null, computedStyles: {}, interactionLog: [] };
  let browser;
  const interactionLog = [];
  try {
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    const page = await browser.newPage();
    
    // --- BƯỚC 1: KIỂM TRA DESKTOP (1440px) ---
    await page.setViewport({ width: 1440, height: 900 });
    console.log(`[AI-Inspector] 🖥️ Đang soi giao diện Desktop: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    const screenshot = await page.screenshot({ encoding: 'base64' });

    // --- BƯỚC 2: KIỂM TRA TƯƠNG TÁC (HOVER) ---
    const buttons = await page.$$('button, a.btn, .button');
    if (buttons.length > 0) {
      console.log(`[AI-Inspector] 🖱️ Đang thử nghiệm Hover trên ${Math.min(buttons.length, 3)} nút bấm...`);
      for (let i = 0; i < Math.min(buttons.length, 3); i++) {
        try {
          const btnText = await page.evaluate(el => el.innerText || el.className, buttons[i]);
          const beforeStyle = await page.evaluate(el => ({ backgroundColor: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }), buttons[i]);
          
          await buttons[i].hover();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const afterStyle = await page.evaluate(el => ({ backgroundColor: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }), buttons[i]);
          
          if (beforeStyle.backgroundColor !== afterStyle.backgroundColor || beforeStyle.color !== afterStyle.color) {
            interactionLog.push(`✅ Nút "${String(btnText).substring(0, 20)}" có hiệu ứng Hover (Đổi màu)`);
          } else {
            interactionLog.push(`❌ Nút "${String(btnText).substring(0, 20)}" KHÔNG có hiệu ứng Hover`);
          }
        } catch (e) { /* ignore single button fail */ }
      }
    }

    // --- BƯỚC 3: KIỂM TRA MOBILE (375px - iPhone X) ---
    console.log(`[AI-Inspector] 📱 Đang soi giao diện Mobile (375px)...`);
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mobileScreenshot = await page.screenshot({ encoding: 'base64' });

    // Kiểm tra xem có bị tràn ngang không (Horizontal Scroll)
    const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (hasHorizontalScroll) {
      interactionLog.push(`⚠️ CẢNH BÁO: Giao diện Mobile bị tràn ngang (Horizontal Scroll)!`);
    }

    const computedStyles = await page.evaluate(() => {
      const results = {};
      const selectors = ['body', 'h1', 'nav', 'header', 'footer', 'section', 'button', 'img'];
      selectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) {
          const style = window.getComputedStyle(el);
          results[sel] = {
            display: style.display,
            flexDirection: style.flexDirection,
            justifyContent: style.justifyContent,
            backgroundColor: style.backgroundColor,
            color: style.color,
            fontSize: style.fontSize,
            borderRadius: style.borderRadius,
            width: style.width
          };
        }
      });
      return results;
    });

    return { 
      screenshot, 
      mobileScreenshot, 
      computedStyles: filterCSS(computedStyles), 
      interactionLog 
    };
  } catch (err) {
    console.error(`[AI-Inspector ERROR]`, err.message);
    return { screenshot: null, mobileScreenshot: null, computedStyles: {}, interactionLog: [err.message] };
  } finally {
    if (browser) await browser.close();
  }
};

const gradeSubmission = async (code, assignment, submission) => {
  let currentStage = "Chuẩn bị dữ liệu";
  try {
    const { rubric = [], requirements = [], sampleFeedback = "", solutionCode } = assignment;
    const { vercelUrl, figmaUrl } = submission;
    
    currentStage = "Soi giao diện (Visual Inspection)";
    console.log(`[Grading] 🚀 BƯỚC 1: Khởi động trình duyệt soi giao diện...`);
    let visualResult = { screenshot: null, mobileScreenshot: null, computedStyles: {}, interactionLog: ['⚠️ Không có dữ liệu giao diện (Có thể do link lỗi hoặc không cung cấp)'] };
    
    try {
      if (vercelUrl) {
        console.log(`[Grading] 🖥️ Đang truy cập Link Deploy: ${vercelUrl}`);
        visualResult = await inspectVisualAndInteraction(vercelUrl);
        console.log(`[Grading] ✅ Đã lấy được dữ liệu giao diện.`);
      }
    } catch (vErr) {
      console.error(`[Grading] ❌ Lỗi soi giao diện (Vẫn tiếp tục):`, vErr.message);
    }

    const { computedStyles, interactionLog, screenshot, mobileScreenshot } = visualResult;
    
    // --- BƯỚC 2: KIỂM TRA GOLDEN MATCH ---
    if (solutionCode && code) {
      currentStage = "Kiểm tra Golden Match";
      console.log(`[Grading] 🏆 Đang so sánh mã nguồn với Bài chuẩn 10 điểm...`);
      const similarity = stringSimilarity.compareTwoStrings(code, solutionCode);
      if (similarity > 0.92) {
        console.log(`[Grading] 🌟 GOLDEN MATCH: Độ tương đồng ${Math.round(similarity * 100)}%. Tự động gán điểm tối đa!`);
        
        let validatedTotal = 0;
        const finalScores = {};
        rubric.forEach((r, idx) => {
          finalScores[r.criteria] = { score: r.maxScore, reason: "Mã nguồn giống hệt bài mẫu chuẩn." };
          validatedTotal += r.maxScore;
        });

        return {
          score: finalScores,
          total: Number(validatedTotal.toFixed(2)),
          feedback: "🌟 BÀI LÀM XUẤT SẮC (Golden Match)!\n- Mã nguồn của bạn đạt độ chính xác >92% so với đáp án chuẩn.\n- Cấu trúc và logic hoàn hảo.\n- Điểm tuyệt đối được cấp tự động mà không cần AI phân tích.",
          issues: [],
          suggestions: ["Hãy tiếp tục phát huy phong độ này trong các bài tập tiếp theo!"],
          screenshot,
          mobileScreenshot,
          computedStyles,
          interactionLog
        };
      }
    }

    const criteriaWithMax = rubric.map((r, idx) => `[ID: ${idx}] Tiêu chí: "${r.criteria}" (Điểm tối đa: ${r.maxScore}đ)`).join("\n");

    const prompt = `
Bạn là GV Senior chấm bài chuyên nghiệp. BẮT BUỘC chấm điểm NHẤT QUÁN và TUÂN THỦ KHUNG ĐIỂM RUBRIC.
${sampleFeedback ? `PHONG CÁCH LỜI PHÊ GIẢNG VIÊN YÊU CẦU: "${sampleFeedback}"` : ""}

DANH SÁCH TIÊU CHÍ RUBRIC (ĐIỂM TỐI ĐA):
${criteriaWithMax}

Yêu cầu đề bài: ${requirements.join("; ")}

--- DỮ LIỆU BÀI LÀM CỦA SINH VIÊN ---
1. LINK THIẾT KẾ FIGMA (Tham chiếu): ${figmaUrl || "Không có"}
2. LINK DEPLOY THỰC TẾ: ${vercelUrl || "Không có"}
3. LOG KIỂM THỬ TƯƠNG TÁC (Puppeteer):
${interactionLog.join("\n")}
4. GIAO DIỆN PHÂN TÍCH (Computed Styles JSON): ${JSON.stringify(computedStyles)}
5. MÃ NGUỒN (GitHub/Direct):
\`\`\`
${code}
\`\`\`

NHIỆM VỤ:
- Đối chiếu Code và Giao diện thực tế của sinh viên với Rubric và Yêu cầu đề bài.
- Sử dụng Link Figma để hình dung yêu cầu thiết kế (nếu cần).
- Đưa ra điểm số khách quan và lời phê chuyên nghiệp.

YÊU CẦU ĐỊNH DẠNG JSON TRẢ VỀ:
{
  "score": {
    "0": { "score": số_điểm, "reason": "Lý do cho tiêu chí 0" },
    "1": { "score": số_điểm, "reason": "Lý do cho tiêu chí 1" }
  },
  "total": tổng_điểm,
  "feedback": "Lời phê theo cấu trúc (Điểm tốt, Điểm cần cải thiện, Nhận xét tổng quan)",
  "issues": [],
  "suggestions": []
}

LƯU Ý: Phải sử dụng ID (0, 1, 2...) làm key trong object 'score'.

LƯU Ý QUAN TRỌNG: 
1. Nếu LOG KIỂM THỬ báo lỗi "Tràn ngang" hoặc "Thiếu Hover", hãy trừ điểm nặng vào tiêu chí tương ứng.
2. Tuyệt đối không cho điểm vượt quá Điểm tối đa của tiêu chí.
3. Nếu GIAO DIỆN PHÂN TÍCH có dữ liệu về FontFamily/Color, hãy đối chiếu kỹ với Style Code của sinh viên.
    `.trim();

    currentStage = "Gọi AI chấm bài (Gemini API)";
    console.log(`[Grading] 🤖 BƯỚC 2: Đang gửi dữ liệu cho AI (Gemini)...`);
    const responseText = await callAI(prompt);
    console.log(`[Grading] ✨ AI đã trả về phản hồi.`);
    
    currentStage = "Phân tích kết quả AI (JSON Parsing)";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI không trả về JSON hoặc định dạng bị sai.");
    
    const result = JSON.parse(jsonMatch[0]);
    result.screenshot = screenshot;
    result.mobileScreenshot = mobileScreenshot;
    result.computedStyles = computedStyles;
    result.interactionLog = interactionLog;
    
    // Khớp điểm dựa trên ID (0, 1, 2...)
    let validatedTotal = 0;
    const finalScores = {};

    rubric.forEach((r, idx) => {
      // AI trả về theo ID hoặc tên tiêu chí (phòng hờ)
      let aiItem = result.score[idx.toString()] || result.score[r.criteria];
      
      if (typeof aiItem === 'number') {
        aiItem = { score: aiItem, reason: "AI chấm điểm trực tiếp." };
      }
      if (!aiItem) aiItem = { score: 0, reason: "AI không phân tích được tiêu chí này." };
      
      if (aiItem.score > r.maxScore) aiItem.score = r.maxScore;
      if (aiItem.score < 0) aiItem.score = 0;
      
      finalScores[r.criteria] = aiItem;
      validatedTotal += aiItem.score;
    });

    result.score = finalScores;
    result.total = Number(validatedTotal.toFixed(2));
    return result;

  } catch (err) {
    console.error(`[Grading Failure] ❌ Lỗi tại công đoạn [${currentStage}]:`, err.message);
    throw new Error(`[Lỗi ${currentStage}]: ${err.message}`);
  }
};

module.exports = { gradeSubmission };
