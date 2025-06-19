import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-20 w-full backdrop-blur border-b border-gray-200/60 bg-white/70 dark:bg-gray-900/70 dark:border-gray-700/60">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 transition-colors">
          我的博客
        </Link>
        <nav className="space-x-4 text-sm">
          <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
            首页
          </Link>
          {/* 预留拓展导航链接 */}
        </nav>
      </div>
    </header>
  )
} 