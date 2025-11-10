const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const tasksFile = path.join(__dirname, 'data', 'tasks.json');

// 确保 data 目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化 tasks.json 文件（如果不存在）
if (!fs.existsSync(tasksFile)) {
    fs.writeFileSync(tasksFile, JSON.stringify({}), 'utf-8');
}

// 读取任务数据
function readTasks() {
    try {
        const data = fs.readFileSync(tasksFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取任务数据失败:', error);
        return {};
    }
}

// 保存任务数据
function saveTasks(tasks) {
    try {
        fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('保存任务数据失败:', error);
        return false;
    }
}

function sendJSON(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
}

function sendNotFound(res) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
        success: false,
        error: 'Not Found'
    }));
}

// 处理 API 请求
function handleAPI(req, res, pathname) {
    // 设置 CORS 头部
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (pathname === '/api/tasks' && req.method === 'GET') {
        // 获取所有任务
        const tasks = readTasks();
        sendJSON(res, 200, tasks);
        return true;
    }

    if (pathname === '/api/tasks' && req.method === 'POST') {
        // 保存任务
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const tasks = JSON.parse(body);
                if (saveTasks(tasks)) {
                    sendJSON(res, 200, { success: true });
                } else {
                    sendJSON(res, 500, { success: false, error: '保存失败' });
                }
            } catch (error) {
                sendJSON(res, 400, { success: false, error: '数据格式错误' });
            }
        });
        return true;
    }

    return false;
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = decodeURIComponent(parsedUrl.pathname || '');

    if (pathname.startsWith('/api/')) {
        if (handleAPI(req, res, pathname)) {
            return;
        }
        sendNotFound(res);
        return;
    }

    // 非 API 请求直接返回 404，交由前端 NGINX 处理静态资源
    sendNotFound(res);
});

server.listen(PORT, () => {
    console.log('🚀 API 服务已启动！');
    console.log(`🛠️ 任务接口: http://localhost:${PORT}/api/tasks`);
    console.log('\n按 Ctrl+C 停止服务器\n');
});
