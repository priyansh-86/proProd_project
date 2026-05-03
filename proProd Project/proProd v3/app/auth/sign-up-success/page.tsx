import Link from 'next/link'
import { Factory, Mail, ArrowLeft } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10 mb-4">
            <Mail className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Check Your Email</h1>
        </div>

        {/* Success Card */}
        <div className="glass-card p-8 text-center">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Account Created Successfully!</h2>
            <p className="text-muted-foreground mt-2">
              We&apos;ve sent a confirmation link to your email address.
              Please check your inbox and click the link to verify your account.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border mb-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> The email might take a few minutes to arrive.
              Check your spam folder if you don&apos;t see it.
            </p>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
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
