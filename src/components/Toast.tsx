import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Icon } from '@iconify/react'
import {
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  FONT_FAMILY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../config/design'

type ToastType = 'error' | 'success' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const TOAST_ICONS: Record<ToastType, string> = {
  error: 'mdi:alert-circle',
  success: 'mdi:check-circle',
  warning: 'mdi:alert',
  info: 'mdi:information',
}

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgb(239, 68, 68)',
    icon: 'rgb(239, 68, 68)',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgb(34, 197, 94)',
    icon: 'rgb(34, 197, 94)',
  },
  warning: {
    bg: 'rgba(234, 179, 8, 0.1)',
    border: 'rgb(234, 179, 8)',
    icon: 'rgb(234, 179, 8)',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgb(59, 130, 246)',
    icon: 'rgb(59, 130, 246)',
  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = useState(false)
  const colors = TOAST_COLORS[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onDismiss, 300)
    }, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING[3],
        padding: `${SPACING[3]} ${SPACING[4]}`,
        backgroundColor: COLORS.white,
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.border}`,
        borderRadius: BORDER_RADIUS.lg,
        boxShadow: SHADOWS.lg,
        fontFamily: FONT_FAMILY,
        maxWidth: '400px',
        animation: isExiting ? 'slideOut 0.3s ease forwards' : 'slideIn 0.3s ease',
      }}
    >
      <Icon
        icon={TOAST_ICONS[toast.type]}
        style={{ width: '24px', height: '24px', color: colors.icon, flexShrink: 0 }}
      />
      <p
        style={{
          flex: 1,
          margin: 0,
          fontSize: FONT_SIZES.sm,
          fontWeight: FONT_WEIGHTS.medium,
          color: COLORS.highlightedText,
          lineHeight: 1.4,
        }}
      >
        {toast.message}
      </p>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(onDismiss, 300)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          padding: 0,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: COLORS.baseText,
          borderRadius: BORDER_RADIUS.full,
          flexShrink: 0,
        }}
      >
        <Icon icon="mdi:close" style={{ width: '18px', height: '18px' }} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container - Fixed at bottom center */}
      <div
        style={{
          position: 'fixed',
          bottom: SPACING[6],
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING[2],
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={toast} onDismiss={() => dismissToast(toast.id)} />
          </div>
        ))}
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px);
          }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
