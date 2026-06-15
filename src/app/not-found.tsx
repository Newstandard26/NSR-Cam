import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-1 text-sm text-gray-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/projects" className="mt-6 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark">
        Back to Projects
      </Link>
    </div>
  )
}
