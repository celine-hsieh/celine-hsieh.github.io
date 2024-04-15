import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const PORT = 8001;
const HOST = '140.116.245.86'; // 您的固定 IP 地址

// 將目前檔案的 URL 轉換成路徑
const __filename = fileURLToPath(import.meta.url);
// 從檔案路徑獲取目錄路徑
const __dirname = dirname(__filename);

// In your server.js with Express
app.use((req, res, next) => {
    if (req.path.endsWith('.js')) {
        res.type('application/javascript');
    }
    next();
});

app.use(express.static(join(__dirname, 'dist')));

app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
