import Link from 'next/link'
import { Factory, AlertTriangle, ArrowLeft } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Authentication Error</h1>
        </div>

        {/* Error Card */}
        <div className="glass-card p-8 text-center">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Sorry, something went wrong</h2>
            <p className="text-muted-foreground mt-2">
              We couldn&apos;t complete your authentication request.
            </p>
          </div>

          {params?.error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 mb-6">
              <p className="text-sm text-destructive">
                Error: {params.error}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
            >
              Create a new account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Factory className="w-4 h-4" />
            <span className="text-xs">DARKDESIRE Production Management</span>
          </div>
        </div>
      </div>
    </div>
  )
}
