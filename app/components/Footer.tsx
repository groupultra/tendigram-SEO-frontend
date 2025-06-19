export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-900 text-center py-6 mt-12">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        © {new Date().getFullYear()} My Awesome Blog. All rights reserved.
      </p>
    </footer>
  )
} 