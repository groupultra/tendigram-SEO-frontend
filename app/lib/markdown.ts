import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

export interface PostMeta {
  id: string
  title: string
  date: string
}

const postsDirectory = process.env.BLOG_DIR || path.join(process.cwd(), 'blog-resources')

export async function getAllPosts(): Promise<PostMeta[]> {
  try {
    const dir = postsDirectory
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
    return files.map(file => {
      const id = file.replace(/\.md$/, '')
      const content = fs.readFileSync(path.join(dir, file), 'utf-8')
      const { data } = matter(content)
      // 如果 front-matter 中没有 title，则尝试使用正文第一个 "# " 开头的一级标题
      const match = content.match(/^# (.+)$/m)
      const stats = fs.statSync(path.join(dir, file))
      return {
        id,
        title: data.title || (match ? match[1].trim() : id),
        date: data.date || stats.mtime.toISOString().slice(0, 10)
      }
    }).sort((a, b) => b.date.localeCompare(a.date))
  } catch (e) {
    console.error('getAllPosts error:', e)
    throw e
  }
}

export async function getPost(id: string) {
  const file = path.join(postsDirectory, `${id}.md`)
  const content = fs.readFileSync(file, 'utf-8')
  const { data, content: md } = matter(content)
  // 同样提取正文中的一级标题作为备用标题
  const match = md.match(/^# (.+)$/m)
  const stats = fs.statSync(file)
  return {
    id,
    title: data.title || (match ? match[1].trim() : id),
    date: data.date || stats.mtime.toISOString().slice(0, 10),
    contentHtml: (await remark().use(html).process(md)).toString()
  }
}
