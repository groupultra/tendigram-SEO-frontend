import crypto from 'crypto'
import { exec } from 'child_process'
import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'


const SECRET = process.env.WEBHOOK_SECRET || 'my-super-secret'
const PORT = process.env.PORT || 3001

const app = express()

// 设置超时中间件
app.use((req, res, next) => {
  // 设置 5 秒超时
  res.setTimeout(5000, () => {
    res.status(504).send('Timeout')
  })
  next()
})

// rawBody 用于签名验证
app.use(bodyParser.json({
  verify: (req: any, _res, buf) => { req.rawBody = buf }
}))

// 计算 HMAC 校验
function isValid(req: any) {
  const signature = req.headers['x-hub-signature-256'] as string || ''
  const digest = 'sha256=' + crypto
    .createHmac('sha256', SECRET)
    .update(req.rawBody)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

// 添加 GET 处理器，用于测试连通性
app.get('/webhook', (_req: Request, res: Response): void => {
  res.send('Webhook server is running');
});

app.post('/webhook', (req: Request, res: Response): void => {  // 👈 标注参数与返回类型
  if (!isValid(req)) { res.status(401).send('Invalid signature'); return }
  if (req.headers['x-github-event'] !== 'push') { res.send('Ignored'); return }

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


// 显式绑定 0.0.0.0，避免仅在 IPv6 上监听导致 Nginx 504
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Webhook listening on ${PORT}`)
})