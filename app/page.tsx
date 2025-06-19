import { getAllPosts } from './lib/markdown'
import Link from 'next/link'

const PAGE_SIZE = 5

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const allPosts = await getAllPosts()
  const posts = allPosts.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)
  const totalPages = Math.ceil(allPosts.length / PAGE_SIZE)

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">博客文章</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id} className="mb-4">
            <Link href={`/blogs/${post.id}`} className="text-blue-600 hover:underline">
              {post.title}
            </Link>
            <span className="ml-2 text-gray-400 text-sm">{post.date}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <Link
            key={i}
            href={`/?page=${i+1}`}
            className={`px-2 py-1 border rounded ${page===i+1?'bg-blue-500 text-white':'text-blue-500'}`}
          >{i+1}</Link>
        ))}
      </div>
    </div>
  )
}
