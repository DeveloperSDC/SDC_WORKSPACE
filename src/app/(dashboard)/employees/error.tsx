'use client'

interface ErrorProps {
  error: Error
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>

      <p className="text-muted-foreground">{error.message}</p>

      <button
        onClick={() => reset()}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2"
      >
        Try Again
      </button>
    </div>
  )
}
