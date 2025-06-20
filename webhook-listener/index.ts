/**
 * GitHub Webhook 监听服务
 * 
 * 主要功能：
 * 1. 监听 GitHub 仓库的 push 事件
 * 2. 验证 GitHub 发送的签名确保安全性
 * 3. 自动执行脚本拉取最新的博客文章
 * 4. 实现博客内容的自动化更新部署
 * 
 * 工作流程：
 * 1. 作者推送文章到 GitHub 博客仓库
 * 2. GitHub 触发 webhook 调用这个服务
 * 3. 服务验证请求合法性后执行拉取脚本
 * 4. 更新本地 blog-resources 目录
 * 5. 博客网站自动显示最新内容
 */

import crypto from 'crypto'
import { exec } from 'child_process'
import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'

// 配置参数
const SECRET = process.env.WEBHOOK_SECRET || 'my-super-secret'  // GitHub webhook 密钥
const PORT = process.env.PORT || 3001  // 监听端口

const app = express()

/**
 * 超时保护中间件
 * 
 * 防止长时间等待导致的连接超时
 * 设置 5 秒超时限制，确保快速响应
 */
app.use((req, res, next) => {
  // 设置 5 秒超时
  res.setTimeout(5000, () => {
    res.status(504).send('Timeout')
  })
  next()
})

/**
 * 请求体解析中间件
 * 
 * 功能：
 * 1. 解析 JSON 格式的请求体
 * 2. 保存原始请求体数据用于签名验证
 */
app.use(bodyParser.json({
  verify: (req: any, _res, buf) => { 
    req.rawBody = buf  // 保存原始请求体，用于 HMAC 签名验证
  }
}))

/**
 * GitHub Webhook 签名验证
 * 
 * 安全机制：
 * 1. GitHub 使用配置的密钥对请求体进行 HMAC-SHA256 签名
 * 2. 服务端使用相同密钥重新计算签名
 * 3. 比较两个签名是否一致，确保请求来自 GitHub 且未被篡改
 * 
 * @param req Express 请求对象（包含 rawBody 和 headers）
 * @returns boolean 签名是否有效
 */
function isValid(req: any) {
  // 从请求头获取 GitHub 发送的签名
  const signature = req.headers['x-hub-signature-256'] as string || ''
  
  // 使用相同密钥重新计算签名
  const digest = 'sha256=' + crypto
    .createHmac('sha256', SECRET)
    .update(req.rawBody)
    .digest('hex')
  
  // 使用时间安全的比较方法，防止时序攻击
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

/**
 * 健康检查接口
 * 
 * 用途：
 * 1. 测试服务是否正常运行
 * 2. 配置负载均衡器的健康检查
 * 3. 监控系统的存活性检测
 */
app.get('/webhook', (_req: Request, res: Response): void => {
  res.send('Webhook server is running');
});

/**
 * GitHub Webhook 处理接口
 * 
 * 核心功能：
 * 1. 接收 GitHub 发送的 webhook 请求
 * 2. 验证请求的安全性和有效性
 * 3. 执行文章拉取脚本更新本地内容
 * 
 * 安全检查：
 * 1. 验证 HMAC 签名确保请求来自 GitHub
 * 2. 只处理 push 事件，忽略其他类型事件
 * 
 * @param req Express 请求对象
 * @param res Express 响应对象
 */
app.post('/webhook', (req: Request, res: Response): void => {
  // 第一层安全检查：验证签名
  if (!isValid(req)) { 
    res.status(401).send('Invalid signature'); 
    return 
  }
  
  // 第二层过滤：只处理 push 事件
  if (req.headers['x-github-event'] !== 'push') { 
    res.send('Ignored'); 
    return 
  }

  /**
   * 执行文章拉取脚本
   * 
   * 脚本功能（/usr/local/bin/pull-articles.sh）：
   * 1. git pull 拉取最新的博客文章
   * 2. 更新 blog-resources 目录内容
   * 3. 可能包含权限设置、备份等操作
   */
  exec('/usr/local/bin/pull-articles.sh', (err, stdout, stderr) => {
    if (err) {
      console.error('[pull error]', stderr)
      res.status(500).send('Pull failed')
      return
    }
    console.log('[pull ok]', stdout)
    res.send('OK')
  })
})

/**
 * 启动服务器
 * 
 * 配置说明：
 * 1. 监听所有网络接口（0.0.0.0）而不仅是 localhost
 * 2. 确保可以接收来自 Nginx 反向代理的请求
 * 3. 避免 IPv6 导致的连接问题
 */
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Webhook listening on ${PORT}`)
})