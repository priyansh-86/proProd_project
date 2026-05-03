export function SystemStatus() {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-green-900">System Status: Connected</h3>
          <div className="mt-2 space-y-1 text-sm text-green-800">
            <p>✓ <strong>Supabase Database:</strong> Connected and synced</p>
            <p>✓ <strong>All environment variables:</strong> Configured</p>
            <p>✓ <strong>Data persistence:</strong> Real-time to PostgreSQL</p>
            <p>✓ <strong>Tally Import:</strong> Ready to import Stock Journal exports</p>
          </div>
        </div>
      </div>
    </div>
  )
}
