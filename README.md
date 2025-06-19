# Tendigram 项目

这是一个基于 Next.js 15 和 Markdown 的项目，以下是从本地开发到生产部署的详细步骤。

## 版本 0：本地原型

### 目标
- 在开发机直接浏览 Markdown 文章，验证分页、样式、SEO 等功能。

### 操作步骤
1. 克隆代码并安装依赖：
   ```bash
   git clone git@github.com:xxx/tendigram.git
   cd tendigram
   pnpm i
   ```
2. 本地开发启动：
   ```bash
   pnpm dev
   ```
3. 把任意 `.md` 文件放进 `blog-resources/`，刷新页面即可看到变化。

## 版本 1：宿主机挂载

### 目标
- 把文章目录 `blog-resources/` 挂载到外部路径，方便内容团队独立维护。

### 操作步骤
1. 修改 `next.config.mjs`，确保外部目录被监听。
2. 用软链接挂载真实文章仓库：
   ```bash
   ln -s /mnt/wiki_articles blog-resources
   ```

## 版本 2：动态重载

### 目标
- 不重启进程即可看到最新文章。

### 操作步骤
1. 安装 `chokidar`，监听挂载目录。
2. 捕获变动后，清除 Node 的 Module Cache。

## 版本 3：容器化

### 目标
- 交付一份可复现的镜像，运行时仍可挂载文章目录。

### 操作步骤
1. 新建 `Dockerfile`，构建镜像。
2. 用匿名或命名卷挂载 Markdown。

## 版本 4：生产部署

### 目标
- HTTPS、HTTP/2、自动续签证书。

### 操作步骤
1. 配置 Nginx 反向代理。
2. 使用 GitHub Actions 实现 CI/CD。

## 版本 5：可观测 & 高可用

### 目标
- 支持多副本、自动伸缩、集中日志与性能监控。

### 操作步骤
1. 使用 Helm Chart / Kustomize 打包部署。
2. 引入 Prometheus + Grafana + Loki。

## 总结
- 版本 0–2 解决"内容生产效率"；3–4 解决"可复现交付与上线流程"；5 针对"规模化和运维"。
- 每一版都可在团队实际需求及资源允许的前提下取舍。




版本 0 本地原型：功能跑通
目标
在开发机直接浏览 Markdown 文章，验证分页 / 样式 / SEO 等功能。
关键改动
无，使用仓库默认配置（next dev 热更新）。
操作步骤
克隆代码并安装依赖
Apply to README.md
Run
npm
本地开发启动
Apply to README.md
Run
3000
把任意 .md 文件放进 blog-resources/，刷新页面即可看到变化。
可选增强
安装 VS Code ESLint、Prettier、Tailwind CSS IntelliSense 等插件。
打开 next.config.mjs 里的 experimental.rsc 体验 React Server Components。
版本 1 宿主机挂载：让 Markdown 与代码分离
目标
仍在宿主机直接跑 Node，但把文章目录 blog-resources/ 挂载到外部路径（如 NAS 或 git 子模块），方便内容团队独立维护。
关键改动
核心需求就是“把 GitHub 上的文章仓库 ⇢ 实时/定时同步到本地 blog-resources 目录”，而你的应用已经在监听该目录，一旦文件变更就刷新。
给外部目录建一个独立 git 仓库，历史版本管理更清晰。
版本 2 动态重载：监控文件变更并热刷新
目标
不重启进程即可看到最新文章。
在生产环境也具备近乎实时的内容更新能力。
关键改动
安装 chokidar 或 fs.watch 自定义脚本，监听挂载目录。
捕获变动后，清除 Node 的 Module Cache，强制 Markdown 重新解析：
Apply to README.md
;
若使用 next start（编译后产物），需加环境变量：
Apply to README.md
Run
'
操作步骤
在 scripts/ 里新增 watch-content.ts，通过 pm2 或 forever 常驻：
Apply to README.md
Run
ts
修改或新增 Markdown，浏览器刷新即可。
可选增强
对大型博客可加 LRU 缓存（quick-lru）或 Redis，避免高并发时频繁读取磁盘。
结合 WebSocket 做“内容已更新”提示。
版本 3 容器化：Docker + Volume
目标
交付一份可复现的镜像，运行时仍可挂载文章目录，实现“镜像一次构建、内容随时更换”。
关键改动
新建 Dockerfile（多阶段构建）：
Apply to README.md
]
用匿名或命名卷挂载 Markdown：
Apply to README.md
Run
v1
操作步骤
构建镜像
Apply to README.md
Run
.
运行容器（挂载卷见上）。
更新文章 → 宿主机文件系统变更 → 容器内可见 → 刷新页面即可（若使用版本 2 的热重载脚本）。
可选增强
用 docker-compose.yml 管理多个服务（PostgreSQL、Nginx TLS 终端等）。
使用 --read-only 运行容器，提升安全性。
版本 4 生产部署：Nginx 反向代理 + CI/CD
目标
HTTPS、HTTP/2、自动续签证书。
Git 推送 → 自动构建镜像 → 部署到测试 / 生产。
关键改动
Nginx（或 Caddy）示例反代：
Apply to README.md
}
在同一 docker-compose.yml 里定义 nginx + tendigram 服务，并使用 network_mode: bridge。
GitHub Actions 示例（简化版）：
Apply to README.md
reload
操作步骤
写好 docker-compose.yml（含 Nginx、certbot、tendigram）。
在服务器执行一次 docker compose up -d 验证联通性。
配置 GitHub Secrets（HOST、SSH_KEY、Registry 登录）。
Push 代码即可自动构建并滚动更新。
可选增强
增加 Blue-Green 或 Canary 部署策略。
把 Markdown 数据源迁到对象存储（S3/OSS）并用 @vercel/blob 读取，进一步无状态化。
在 Nginx 层挂动静分离缓存（proxy_cache）。
版本 5 可观测 & 高可用：监控、日志与横向扩缩
目标
将 tendigram 放入 Kubernetes 或 ECS，支持多副本、自动伸缩、集中日志与性能监控。
关键改动
改 Dockerfile，使容器遵循 12-Factor（env、只读根等）。
Helm Chart / Kustomize 打包部署：
Deployment replicas: 3，挂载 PersistentVolumeClaim 到 /app/blog-resources。
HorizontalPodAutoscaler 根据 CPU 或自定义 QPS 扩缩。
Ingress + cert-manager + Nginx/Traefik controller。
引入 Prometheus + Grafana + Loki，埋点 histogram 统计 Markdown 渲染耗时。
操作步骤
helm upgrade --install tendi ./chart。
修改文章 → PVC 内文件同步 → Pod 内热重载脚本探测 → 新内容生效。
通过 Grafana Dashboard 观察请求延迟、错误率。
可选增强
把 Markdown 缓存层替换为 Redis Cluster，配置 TTL + LRU。
使用 CDN（Cloudflare / Tencent CDN）缓存 HTML（ISR）并回源刷新。
接入 Sentry、OpenTelemetry Tail-Sampling。
总结
版本 0–2 解决“内容生产效率”；3–4 解决“可复现交付与上线流程”；5 针对“规模化和运维”。
每一版都可在团队实际需求及资源允许的前提下取舍。
无论停在哪一版，都建议至少配：
自动化备份 Markdown 数据
监控 CPU / 内存 / 磁盘 IO
定期安全更新依赖（Dependabot 或 Renovate）
