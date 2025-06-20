#!/bin/bash

# Tendigram 测试环境部署脚本
# 监听 8211 端口，转发到 3000 端口

set -e

echo "🚀 开始部署 Tendigram 测试环境..."

# 检查是否以 root 权限运行（Nginx 配置需要）
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 sudo 运行此脚本（Nginx 配置需要 root 权限）"
    exit 1
fi

# 检查 Nginx 是否安装
if ! command -v nginx &> /dev/null; then
    echo "📦 安装 Nginx..."
    apt update
    apt install -y nginx
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js"
    exit 1
fi

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "📦 安装 pnpm..."
    npm install -g pnpm
fi

# 安装项目依赖
echo "📦 安装项目依赖..."
pnpm install

# 构建项目
echo "🔨 构建项目..."
pnpm build

# 复制 Nginx 配置
echo "⚙️ 配置 Nginx..."
cp nginx/tendigram.conf /etc/nginx/sites-available/tendigram
ln -sf /etc/nginx/sites-available/tendigram /etc/nginx/sites-enabled/

# 测试 Nginx 配置
echo "🧪 测试 Nginx 配置..."
nginx -t

# 重启 Nginx
echo "🔄 重启 Nginx..."
systemctl restart nginx

# 启动 Next.js 应用
echo "🚀 启动 Next.js 应用..."
echo "应用将在后台运行，访问地址: http://localhost:8211"
echo "按 Ctrl+C 停止应用"

# 使用 nohup 在后台运行应用
nohup pnpm start > app.log 2>&1 &
echo $! > app.pid

echo "✅ 部署完成！"
echo "📝 应用日志: tail -f app.log"
echo "🛑 停止应用: kill \$(cat app.pid)"
echo "🌐 访问地址: http://localhost:8211" 