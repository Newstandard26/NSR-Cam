"use client"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-1 text-sm text-gray-500">An unexpected error occurred. Please try again.</p>
      <button onClick={reset} className="mt-6 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark">
        Try again
      </button>
    </div>
  )
}
