import { getPost } from '@/app/lib/markdown'
import Link from 'next/link'
import type { PageProps } from 'next'

export default async function PostPage({ params }: PageProps<{ id: string }>) {
  const post = await getPost(params.id)
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/" className="text-blue-500">&larr; 返回</Link>
      <h1 className="text-2xl font-bold mt-4 mb-2">{post.title}</h1>
      <div className="text-gray-400 mb-4">{post.date}</div>
      <article className="prose" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </div>
  )
}