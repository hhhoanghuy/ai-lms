const fs = require('fs');
const path = require('path');

// Đường dẫn tương đối từ thư mục backend
const backupDir = path.join('..', 'backups', '14h00_04042026');
const dirsToBackup = [
    { src: '.', dest: 'backend' },
    { src: '../frontend', dest: 'frontend' }
];

console.log('🚀 Đang bắt đầu sao lưu từ thư mục:', process.cwd());

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('- Đã tạo thư mục backup:', backupDir);
}

function copyDir(src, dest) {
    if (!fs.existsSync(src)) {
        console.log(`! Bỏ qua (không tìm thấy): ${src}`);
        return;
    }
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (['node_modules', '.git', 'backups', '.next', 'dist'].includes(entry.name)) continue;
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    dirsToBackup.forEach(dir => {
        console.log(`- Đang sao chép ${dir.src}...`);
        copyDir(dir.src, path.join(backupDir, dir.dest));
    });
    console.log('\n✅ SAO LƯU THÀNH CÔNG tại: ' + path.resolve(backupDir));
} catch (err) {
    console.error('\n❌ LỖI SAO LƯU:', err.message);
}
