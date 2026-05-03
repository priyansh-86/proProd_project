'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'

export function ReorderLevelInfo() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
      >
        <Info className="w-4 h-4" />
        What is Reorder Level?
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What is Reorder Level?</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Definition */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Definition</h3>
            <p className="text-gray-700 dark:text-gray-300">
              The <strong>Reorder Level</strong> is the minimum stock quantity at which you should place a new order for that material. When your current stock falls below this level, it triggers an automatic alert to remind you to reorder before running out of stock.
            </p>
          </div>

          {/* Why It Matters */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Why It Matters</h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Prevents Stockouts:</strong> Ensures you never run out of critical materials</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Maintains Production:</strong> Keeps manufacturing flowing without interruptions</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Controls Costs:</strong> Helps optimize inventory and reduces emergency ordering expenses</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Improves Planning:</strong> Provides visibility into material needs in advance</span>
              </li>
            </ul>
          </div>

          {/* Example */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Example</h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p><strong>Material:</strong> SALT (used in detergent production)</p>
              <p><strong>Current Stock:</strong> 2,000 KG</p>
              <p><strong>Daily Consumption:</strong> 400 KG per day</p>
              <p><strong>Supplier Lead Time:</strong> 7 days (time to receive new order)</p>
              <p className="pt-2 border-t border-blue-300 dark:border-blue-700">
                <strong>Recommended Reorder Level:</strong> 3,000 KG
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                (400 KG/day × 7 days = 2,800 KG needed + 200 KG safety buffer)
              </p>
            </div>
          </div>

          {/* How to Set */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How to Calculate</h3>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 font-mono text-sm">
              <p className="text-gray-900 dark:text-white">
                Reorder Level = (Daily Consumption × Lead Time) + Safety Stock
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-3 text-xs">
                Safety Stock = Usually 10-20% of the calculated requirement
              </p>
            </div>
          </div>

          {/* Pro Tips */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pro Tips</h3>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>✓ Start with 10% of your average opening stock as reorder level</li>
              <li>✓ Adjust based on actual consumption patterns and lead times</li>
              <li>✓ Review quarterly to account for production changes</li>
              <li>✓ Keep a safety buffer for critical materials</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}
