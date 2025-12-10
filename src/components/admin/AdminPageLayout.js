"use client"

import React from "react"

export function AdminPageLayout({ title, description, actions, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}
