const express = require('express');
const path = require('path');
const net = require('net');
const app = express();
const DEFAULT_PORT = process.env.PORT || 8080;

// 检查端口是否可用
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => {
            resolve(false);
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port);
    });
}

// 查找可用端口
async function findAvailablePort(startPort) {
    let port = startPort;
    while (port < startPort + 100) { // 尝试100个端口
        if (await isPortAvailable(port)) {
            return port;
        }
        port++;
    }
    throw new Error('无法找到可用端口');
}

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// 路由处理
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
async function startServer() {
    try {
        // 先尝试使用默认端口
        const isDefaultPortAvailable = await isPortAvailable(DEFAULT_PORT);
        const PORT = isDefaultPortAvailable ? DEFAULT_PORT : await findAvailablePort(DEFAULT_PORT + 1);
        
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
            if (!isDefaultPortAvailable) {
                console.log(`注意: 默认端口 ${DEFAULT_PORT} 已被占用，自动切换到端口 ${PORT}`);
            }
        });
    } catch (error) {
        console.error('启动服务器失败:', error.message);
        console.log('建议: 请检查是否有其他应用占用了大量端口，或者使用 PORT 环境变量指定一个特定端口');
        process.exit(1);
    }
}

startServer();