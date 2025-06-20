import fs from 'fs'
import path from 'path'

/**
 * Three-kingdoms 内部链接数据结构
 */
interface LinkEntry {
  source: {
    doc_id: string
    sentence: string
    position?: number // 第几次出现（从 1 开始），可选
  }
  target: {
    doc_id: string
    title?: string
    url?: string
  }
}

interface LinksData {
  document_links: LinkEntry[]
}

let cache: LinkEntry[] | null = null

/**
 * 读取 JSON 文件，只在首个请求时读取一次并缓存。
 */
function loadLinks(): LinkEntry[] {
  if (cache) return cache
  
  // 尝试多种候选路径：
  const candidates = [
    process.env.LINKS_JSON_PATH,
    path.resolve(process.cwd(), 'three_kingdoms_internal_links.json'),
    path.resolve(process.cwd(), '..', 'three_kingdoms_internal_links.json'),
    path.resolve(process.cwd(), '..', '..', 'three_kingdoms_internal_links.json')
  ].filter(Boolean) as string[]

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8')
        const data = JSON.parse(raw) as LinksData
        cache = data.document_links || []
        console.log(`[internalLinks] 成功加载 ${cache.length} 条链接记录，路径: ${p}`)
        return cache
      }
    } catch (err) {
      console.error(`[internalLinks] 解析 JSON 文件失败: ${p}`, err)
      // 继续尝试下一个
    }
  }

  console.warn('[internalLinks] 未找到 three_kingdoms_internal_links.json，内部链接功能被跳过。')
  cache = []
  return cache
}

/**
 * 将指定文章的 Markdown 文本中，按 three_kingdoms_internal_links.json 描述插入超链接。
 *
 * @param docId  当前文章的 doc_id（即文件名）
 * @param markdown 原始 Markdown 文本
 * @returns 已替换好的 Markdown 文本
 */
export function applyInternalLinks(docId: string, markdown: string): string {
  const linksForDoc = loadLinks().filter(l => l.source.doc_id === docId)
  if (!linksForDoc.length) return markdown

  let result = markdown

  for (const link of linksForDoc) {
    const { sentence, position = 1 } = link.source
    const href = `/blogs/${link.target.doc_id}`
    const anchor = `[${sentence}](${href})`

    result = replaceNthOccurrence(result, sentence, position, anchor)
  }

  return result
}

/**
 * 把字符串中第 n 次出现的子串替换为新内容。
 * @param str 原始字符串
 * @param search 要查找的子串
 * @param n 第 n 次出现（1 表示第一次）
 * @param replacement 替换文本
 */
function replaceNthOccurrence(str: string, search: string, n: number, replacement: string): string {
  if (n <= 0) return str
  let index = -1
  for (let i = 0; i < n; i++) {
    index = str.indexOf(search, index + 1)
    if (index === -1) return str // 找不到足够多次出现，直接返回原文
  }
  return str.slice(0, index) + replacement + str.slice(index + search.length)
} 