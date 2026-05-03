'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Home, Database, User, LogOut, CheckCircle2, 
  XCircle, RefreshCw, Settings, Shield
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

interface ConnectionStatus {
  connected: boolean
  url: string
  error: string | null
  tables: string[]
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    url: '',
    error: null,
    tables: []
  })
  const [loading, setLoading] = useState(true)
  const [testingConnection, setTestingConnection] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUserAndTestConnection()
  }, [])

  async function loadUserAndTestConnection() {
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Test database connection
      await testConnection()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function testConnection() {
    setTestingConnection(true)
    try {
      const supabase = createClient()
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      
      // Try to fetch tables
      const [
        { error: rmError },
        { error: prodError },
        { error: batchError },
        { error: dpError },
        { error: dispError }
      ] = await Promise.all([
        supabase.from('raw_materials').select('id').limit(1),
        supabase.from('products').select('id').limit(1),
        supabase.from('batches').select('id').limit(1),
        supabase.from('daily_production').select('id').limit(1),
        supabase.from('dispatch_records').select('id').limit(1)
      ])

      const tables: string[] = []
      if (!rmError) tables.push('raw_materials')
      if (!prodError) tables.push('products')
      if (!batchError) tables.push('batches')
      if (!dpError) tables.push('daily_production')
      if (!dispError) tables.push('dispatch_records')

      const anyError = rmError || prodError || batchError || dpError || dispError

      setConnectionStatus({
        connected: tables.length > 0,
        url: url,
        error: anyError ? 'Some tables may not exist or have RLS issues' : null,
        tables
      })
    } catch (err) {
      setConnectionStatus({
        connected: false,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        error: err instanceof Error ? err.message : 'Connection failed',
        tables: []
      })
    } finally {
      setTestingConnection(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="p-6 max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80">
              <Home className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">Settings</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">Manage your account and database connection</p>
        </div>

        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">User Profile</h2>
            </div>

            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined: {new Date(user.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.email_confirmed_at ? (
                      <span className="flex items-center gap-1 text-success text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-warning text-sm">
                        <XCircle className="w-4 h-4" /> Unverified
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-muted-foreground">Not logged in</p>
                <Link href="/auth/login" className="text-primary hover:underline text-sm">
                  Sign in to your account
                </Link>
              </div>
            )}
          </div>

          {/* Database Connection Section */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Database Connection</h2>
              </div>
              <button
                onClick={testConnection}
                disabled={testingConnection}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
                Test Connection
              </button>
            </div>

            <div className="space-y-4">
              {/* Connection Status */}
              <div className={`flex items-center gap-3 p-4 rounded-lg ${
                connectionStatus.connected 
                  ? 'bg-success/10 border border-success/30' 
                  : 'bg-destructive/10 border border-destructive/30'
              }`}>
                {connectionStatus.connected ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-success" />
                    <div>
                      <p className="font-medium text-foreground">Connected to Supabase</p>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {connectionStatus.url || 'Database URL configured'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-destructive" />
                    <div>
                      <p className="font-medium text-foreground">Connection Failed</p>
                      <p className="text-sm text-destructive">
                        {connectionStatus.error || 'Unable to connect to database'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Tables Status */}
              {connectionStatus.tables.length > 0 && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-foreground mb-3">Available Tables:</p>
                  <div className="flex flex-wrap gap-2">
                    {connectionStatus.tables.map(table => (
                      <span key={table} className="px-3 py-1 rounded-full bg-success/10 text-success text-sm">
                        {table}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Environment Info */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Environment Variables</p>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
                  <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* App Info */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">About</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">App:</strong> DARKDESIRE Production Management</p>
              <p><strong className="text-foreground">Version:</strong> 2.0</p>
              <p><strong className="text-foreground">Framework:</strong> Next.js 16 + Supabase</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
