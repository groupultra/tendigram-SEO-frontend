/**
 * Markdown 文章处理核心模块
 * 
 * 这个模块是整个博客系统的核心，负责：
 * 1. 从外部 blog-resources 目录读取 Markdown 文件
 * 2. 解析文件的 front-matter 元数据（如标题、日期等）
 * 3. 将 Markdown 内容转换为 HTML 格式
 * 4. 提供统一的文章数据接口给前端页面使用
 * 
 * 设计理念：前后端分离架构
 * - 文章内容存储在独立的 blog-resources 目录中
 * - 前端代码与文章内容完全分离，便于内容管理和版本控制
 * - 支持通过环境变量灵活配置文章存储路径
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'  // 用于解析 Markdown 文件的 front-matter
import { remark } from 'remark'   // Markdown 处理引擎
import html from 'remark-html'   // 将 Markdown 转换为 HTML 的插件
import { applyInternalLinks } from './internalLinks'

/**
 * 文章元信息接口定义
 * 用于首页文章列表展示
 */
export interface PostMeta {
  id: string    // 文章唯一标识符（对应文件名）
  title: string // 文章标题
  date: string  // 发布日期（YYYY-MM-DD 格式）
}

/**
 * 博客文章存储目录配置
 * 
 * 默认指向项目根目录同级的 blog-resources 目录
 * 这样设计的好处：
 * 1. 文章内容与前端代码物理分离
 * 2. 可以独立管理文章仓库（Git 子模块或软链接）
 * 3. 支持通过 BLOG_DIR 环境变量自定义路径
 * 
 * 目录结构示例：
 * /tendigram2/
 * ├── your-blog/          (前端代码)
 * └── blog-resources/     (文章内容)
 *     ├── article1.md
 *     ├── article2.md
 *     └── ...
 */
const postsDirectory = process.env.BLOG_DIR || path.resolve(process.cwd(), '..', 'blog-resources')

/**
 * 获取所有博客文章的元信息列表
 * 
 * 主要功能：
 * 1. 扫描 blog-resources 目录下的所有 .md 文件
 * 2. 解析每个文件的 front-matter 和内容
 * 3. 提取文章标题和日期信息
 * 4. 按发布日期倒序排列（最新文章在前）
 * 
 * 标题提取策略（优先级从高到低）：
 * 1. front-matter 中的 title 字段
 * 2. 文档正文中第一个一级标题（# 开头）
 * 3. 文件名作为备用标题
 * 
 * 日期提取策略（优先级从高到低）：
 * 1. front-matter 中的 date 字段
 * 2. 文件的最后修改时间
 * 
 * @returns Promise<PostMeta[]> 文章元信息数组，按日期倒序排列
 * @throws 如果目录不存在或读取失败会抛出异常
 */
export async function getAllPosts(): Promise<PostMeta[]> {
  try {
    const dir = postsDirectory
    
    // 1. 读取目录下所有 .md 文件
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
    
    // 2. 遍历每个文件，提取元信息
    return files.map(file => {
      // 文章ID = 文件名（去掉.md扩展名）
      const id = file.replace(/\.md$/, '')
      
      // 读取文件内容
      const content = fs.readFileSync(path.join(dir, file), 'utf-8')
      
      // 使用 gray-matter 解析 front-matter
      const { data } = matter(content)
      
      // 尝试从正文中提取一级标题作为备用
      // 正则表达式 /^# (.+)$/m 匹配行首的 "# 标题文本"
      const match = content.match(/^# (.+)$/m)
      
      // 获取文件统计信息（用于提取修改时间）
      const stats = fs.statSync(path.join(dir, file))
      
      return {
        id,
        // 标题优先级：front-matter.title > 正文一级标题 > 文件名
        title: data.title || (match ? match[1].trim() : id),
        // 日期优先级：front-matter.date > 文件修改时间
        date: data.date || stats.mtime.toISOString().slice(0, 10)
      }
    }).sort((a, b) => b.date.localeCompare(a.date)) // 按日期倒序排列
    
  } catch (e) {
    console.error('getAllPosts error:', e)
    throw e
  }
}

/**
 * 根据文章ID获取完整的文章内容
 * 
 * 主要功能：
 * 1. 根据ID读取对应的 .md 文件
 * 2. 解析 front-matter 元数据
 * 3. 将 Markdown 内容转换为 HTML
 * 4. 返回包含标题、日期、HTML内容的完整文章对象
 * 
 * 使用场景：
 * - 文章详情页面渲染
 * - 需要完整文章内容的地方
 * 
 * Markdown 转 HTML 处理：
 * - 使用 remark 解析 Markdown 语法
 * - 使用 remark-html 插件转换为 HTML
 * - 支持标准 Markdown 语法（标题、列表、代码块、链接等）
 * 
 * @param id 文章ID（对应 .md 文件名，不含扩展名）
 * @returns Promise<Post> 包含完整内容的文章对象
 * @throws 如果文件不存在或解析失败会抛出异常
 */
export async function getPost(id: string) {
  // 构建完整的文件路径
  const file = path.join(postsDirectory, `${id}.md`)
  
  // 读取文件内容
  const content = fs.readFileSync(file, 'utf-8')
  
  // 解析 front-matter 和正文内容
  const { data, content: md } = matter(content)
  
  // 在 Markdown 文本中插入内部链接
  const mdWithLinks = applyInternalLinks(id, md)
  
  // 同样尝试从正文中提取一级标题作为备用
  const match = mdWithLinks.match(/^# (.+)$/m)
  
  // 获取文件统计信息
  const stats = fs.statSync(file)
  
  return {
    id,
    // 标题提取策略同 getAllPosts()
    title: data.title || (match ? match[1].trim() : id),
    // 日期提取策略同 getAllPosts()
    date: data.date || stats.mtime.toISOString().slice(0, 10),
    // 将 Markdown 转换为 HTML 字符串
    // remark().use(html).process(mdWithLinks) 返回 VFile 对象，toString() 获取 HTML 字符串
    contentHtml: (await remark().use(html).process(mdWithLinks)).toString()
  }
}
