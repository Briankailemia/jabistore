'use client'

import { useState, useEffect } from 'react'
import { createContext, useContext } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (toast) => {
    const id = Date.now() + Math.random()
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])
    
    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
    
    return id
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (message, duration = 5000) => {
    return addToast({ type: 'success', message, duration })
  }

  const error = (message, duration = 7000) => {
    return addToast({ type: 'error', message, duration })
  }

  const info = (message, duration = 5000) => {
    return addToast({ type: 'info', message, duration })
  }

  const warning = (message, duration = 6000) => {
    return addToast({ type: 'warning', message, duration })
  }

  return (
    <ToastContext.Provider value={{ addToast, success, error, info, warning, removeToast }}>
      {children}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ toast, onClose }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  }

  const styles = {
    success: 'bg-emerald-500/90 text-white border-emerald-400',
    error: 'bg-rose-500/90 text-white border-rose-400',
    info: 'bg-sky-500/90 text-white border-sky-400',
    warning: 'bg-amber-500/90 text-white border-amber-400',
  }

  return (
    <div
      className={`
        pointer-events-auto
        min-w-[300px] max-w-md
        bg-white/10 backdrop-blur-xl
        border rounded-xl
        p-4 shadow-2xl
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${styles[toast.type]}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icons[toast.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

