const axios = require('axios');

const getHeaders = () => ({
  'Authorization': `token ${process.env.GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'AI-LMS-App'
});

/**
 * fetchFileRawContent: Tải nội dung thô của 1 file
 */
const fetchFileRawContent = async (downloadUrl) => {
  try {
    const res = await axios.get(downloadUrl, {
      headers: getHeaders(),
      timeout: 10000
    });
    return typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
  } catch (err) {
    return `// [Lỗi] Không thể tải nội dung file: ${err.message}`;
  }
};

/**
 * fetchRecursive: Hàm quét đệ quy (Recursive Scanning)
 */
const fetchRecursive = async (owner, repo, path, branch, binaryExtensions) => {
  let combinedCode = '';
  const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
  const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`;

  try {
    const response = await axios.get(contentsUrl, {
      headers: getHeaders(),
      timeout: 15000
    });

    const items = Array.isArray(response.data) ? response.data : [response.data];
    console.log(`[GitHub API] 📂 Đang quét: /${path} (Tìm thấy: ${items.length} mục)`);

    for (const item of items) {
      // 🔥 NÉ RÁC: Nếu gặp node_modules hoặc các thư mục rác thì bỏ qua ngay
      const BLACKLIST = ['node_modules', '.git', '.github', 'dist', 'build', 'assets', 'img', 'images'];
      if (item.type === 'dir' && BLACKLIST.some(b => item.name.toLowerCase() === b.toLowerCase())) {
        console.log(`   - [Bỏ qua rác]: ${item.path}`);
        continue;
      }

      if (item.type === 'file') {
        const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
        // Chỉ lấy file code, bỏ qua ảnh và các file binary
        const isBinary = binaryExtensions.includes(ext) || item.name.lastIndexOf('.') === -1;
        if (!isBinary) {
          console.log(`   - [File] Thu thập nội dung: ${item.path}`);
          const content = await fetchFileRawContent(item.download_url);
          combinedCode += `\n/* --- FILE: ${item.path} --- */\n${content}\n`;
        }
      } else if (item.type === 'dir') {
        console.log(`   - [Thư mục] 🔍 Đang chui sâu vào: ${item.path}`);
        const subfolderContent = await fetchRecursive(owner, repo, item.path, branch, binaryExtensions);
        combinedCode += subfolderContent;
      }
    }
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 401) {
      console.error(`[GitHub ERROR] ⛔ Lỗi xác thực hoặc Rate Limit. Kiểm tra lại GITHUB_TOKEN.`);
    }
    throw err;
  }
  return combinedCode;
};

/**
 * fetchCodeFromRepo: Hàm chính để lấy toàn bộ code
 */
const fetchCodeFromRepo = async (githubUrl) => {
  try {
    let url = githubUrl.trim().replace(/\/$/, '');
    const parts = url.split('/');
    const githubIndex = parts.indexOf('github.com');
    if (githubIndex === -1 || parts.length < githubIndex + 3) {
      throw new Error('URL GitHub không hợp lệ. Hãy nộp link dạng: https://github.com/owner/repo');
    }

    const owner = parts[githubIndex + 1];
    const repo = parts[githubIndex + 2];
    let branch = 'main';
    let subPath = '';

    if (parts.includes('tree') || parts.includes('blob')) {
      const typeIndex = parts.findIndex(p => p === 'tree' || p === 'blob');
      branch = parts[typeIndex + 1];
      subPath = parts.slice(typeIndex + 2).join('/');

      if (parts[typeIndex] === 'blob') {
        console.log(`[GitHub Warning] ⚠️ Phát hiện link file lẻ. Tự động lùi về thư mục cha để tìm CSS/JS...`);
        subPath = parts.slice(typeIndex + 2, -1).join('/');
      }
    } else {
      try {
        const repoInfo = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: getHeaders(),
          timeout: 5000
        });
        branch = repoInfo.data.default_branch || 'main';
      } catch (err) { branch = 'main'; }
    }

    console.log(`\n======================================================`);
    console.log(`🚀 [GITHUB SCAN] Khởi động quét mã nguồn cho: ${owner}/${repo}`);
    console.log(`📂 Vị trí bắt đầu: ${subPath || 'ROOT'} | Nhánh: ${branch}`);
    console.log(`======================================================`);

    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.rar', '.exe', '.ico', '.svg', '.woff', '.woff2', '.ttf'];
    const finalCode = await fetchRecursive(owner, repo, subPath, branch, binaryExtensions);

    if (!finalCode || finalCode.trim() === '') {
      throw new Error(`Không tìm thấy mã nguồn tại đường dẫn: ${subPath || 'ROOT'}. Có thể link bị sai hoặc folder trống.`);
    }

    console.log(`\n✅ [GITHUB SUCCESS] Tổng cộng nội dung code đã thu thập xong.`);
    return finalCode;
  } catch (error) {
    console.error('❌ [GitHub Service Failure]', error.message);
    throw new Error('Lỗi GitHub: ' + (error.response?.data?.message || error.message));
  }
};

module.exports = { fetchCodeFromRepo };
