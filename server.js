const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const tasksFile = path.join(__dirname, 'data', 'tasks.json');

// 确保 data 目录和文件存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(tasksFile)) {
    fs.writeFileSync(tasksFile, JSON.stringify({}), 'utf-8');
}

// 工具函数
function readTasks() {
    try {
        return JSON.parse(fs.readFileSync(tasksFile, 'utf-8'));
    } catch (error) {
        console.error('读取任务数据失败:', error);
        return {};
    }
}

function saveTasks(tasks) {
    try {
        fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('保存任务数据失败:', error);
        return false;
    }
}

// API 处理
function handleAPI(req, res, pathname) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return true;
    }

    if (pathname === '/api/tasks' && req.method === 'GET') {
        const tasks = readTasks();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(tasks));
        return true;
    }

    if (pathname === '/api/tasks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const tasks = JSON.parse(body);
                if (saveTasks(tasks)) {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: false, error: '保存失败' }));
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: '数据格式错误' }));
            }
        });
        return true;
    }

    return false;
}

// HTTP 服务器
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    if (pathname.startsWith('/api/')) {
        if (handleAPI(req, res, pathname)) {
            return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: '接口不存在' }));
        return;
    }

    // 非 API 请求交给 Nginx 处理，这里返回 404
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`🚀 API 服务启动成功: http://localhost:${PORT}`);
});