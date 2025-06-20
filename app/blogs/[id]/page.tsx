import { getPost } from '@/app/lib/markdown'
import Link from 'next/link'

/**
 * 博客文章详情页组件
 * 
 * 功能：根据文章ID动态显示单篇博客文章的完整内容
 * 这是一个服务端组件，能够直接访问路由参数并进行服务端渲染
 * 
 * 优势：
 * 1. SEO 友好 - 服务端渲染完整内容
 * 2. 首屏加载快 - 无需客户端JavaScript即可显示内容
 * 3. 更好的性能 - 服务端直接读取文件系统
 */
export default async function PostPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 在 Next.js 15 中，params 需要先 await
  const { id } = await params
  
  // 根据文章ID从markdown文件中读取文章内容
  const post = await getPost(id)
  
  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* 返回首页的导航链接 */}
      <Link href="/" className="text-blue-500">&larr; 返回</Link>
      
      {/* 文章标题 */}
      <h1 className="text-2xl font-bold mt-4 mb-2">{post.title}</h1>
      
      {/* 文章发布日期 */}
      <div className="text-gray-400 mb-4">{post.date}</div>
      
      {/* 
        文章正文内容
        使用 dangerouslySetInnerHTML 渲染从 Markdown 转换的 HTML
        prose 类提供了美观的文章排版样式
      */}
      <article className="prose prose-gray max-w-none" 
               dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </div>
  )
}