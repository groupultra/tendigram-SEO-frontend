# Nginx 配置说明

## 配置文件说明

`tendigram.conf` 包含了两个服务的配置：

### 1. 博客服务 (端口 8211)
- **监听端口**: 8211
- **转发目标**: http://127.0.0.1:3000 (Next.js 应用)
- **用途**: 提供 Markdown 博客访问
- **访问地址**: http://localhost:8211

### 2. Webhook 服务 (端口 8080)
- **监听端口**: 8080
- **转发目标**: http://127.0.0.1:3001 (Webhook 监听器)
- **用途**: 接收外部系统的 webhook 通知
- **访问地址**: http://localhost:8080/webhook

## 快速部署

### 方法一：使用自动部署脚本
```bash
sudo chmod +x deploy-test.sh
sudo ./deploy-test.sh
```

### 方法二：手动配置

1. **安装 Nginx**（如果未安装）
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **复制配置文件**
   ```bash
   sudo cp nginx/tendigram.conf /etc/nginx/sites-available/tendigram
   sudo ln -sf /etc/nginx/sites-available/tendigram /etc/nginx/sites-enabled/
   ```

3. **测试配置**
   ```bash
   sudo nginx -t
   ```

4. **重启 Nginx**
   ```bash
   sudo systemctl restart nginx
   ```

5. **启动服务**
   ```bash
   # 启动博客服务
   pnpm build
   pnpm start
   
   # 启动 webhook 服务（如果需要）
   cd webhook-listener
   npm start
   ```

## 访问地址

- **博客服务**: http://localhost:8211
- **Webhook 服务**: http://localhost:8080/webhook
- **局域网访问**: 将 localhost 替换为你的 IP 地址

## 服务说明

### 博客服务 (8211 端口)
- 提供 Markdown 文章的浏览和展示
- 支持静态资源缓存
- 包含健康检查端点 `/health`

### Webhook 服务 (8080 端口)
- 接收 Git 推送、内容更新等外部通知
- 可用于自动化部署和内容同步
- 包含健康检查端点 `/webhook/health`

## 常用命令

```bash
# 查看 Nginx 状态
sudo systemctl status nginx

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 重新加载 Nginx 配置
sudo nginx -s reload

# 停止 Next.js 应用
pkill -f "next start"

# 停止 webhook 服务
pkill -f "webhook-listener"
```

## 故障排除

1. **端口被占用**
   ```bash
   sudo netstat -tlnp | grep 8211
   sudo netstat -tlnp | grep 8080
   sudo lsof -i :8211
   sudo lsof -i :8080
   ```

2. **权限问题**
   ```bash
   sudo chown -R www-data:www-data /var/log/nginx
   ```

3. **防火墙设置**
   ```bash
   sudo ufw allow 8211
   sudo ufw allow 8080
   ```

4. **服务未启动**
   ```bash
   # 检查博客服务
   curl http://localhost:3000
   
   # 检查 webhook 服务
   curl http://localhost:3001/webhook/health
   ``` 