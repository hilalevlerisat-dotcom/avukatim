'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCheck, 
  Trash2, 
  ChevronRight, 
  Check, 
  ExternalLink,
  CreditCard,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getAllCollectionSchedules } from '@/lib/mock-store'
import { formatCurrency, formatDate, daysFromNow } from '@/lib/constants'

export type NotificationType = 'deadline' | 'hearing' | 'reminder' | 'payment'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  subtitle?: string
  dueText: string
  isUrgent?: boolean
  link?: string
  read: boolean
  timestamp: string
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = []

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'urgent' | 'hearing' | 'payment'>('all')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const syncCollections = () => {
      const pending = getAllCollectionSchedules().filter(c => !c.is_paid)
      const dynamicItems: NotificationItem[] = pending.map(c => {
        const days = daysFromNow(c.due_date)
        return {
          id: `notif-${c.id}`,
          type: 'payment' as NotificationType,
          title: `${c.client_name} ${formatCurrency(c.amount)} Tahsilat`,
          subtitle: `${c.description} ${c.installment_number ? `(${c.installment_number}/${c.total_installments} Taksit)` : ''}`,
          dueText: `${days <= 0 ? 'Bugün vade' : days === 1 ? 'Yarın son gün' : `${days} gün kaldı`} (${formatDate(c.due_date)})`,
          isUrgent: days <= 2,
          link: '/finans',
          read: false,
          timestamp: 'Tahsilat Bekliyor',
        }
      })

      setNotifications(prev => {
        const nonDynamic = prev.filter(n => !n.id.startsWith('notif-'))
        return [...dynamicItems, ...nonDynamic]
      })
    }

    syncCollections()
    window.addEventListener('avukatim-store-update', syncCollections)
    return () => window.removeEventListener('avukatim-store-update', syncCollections)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'urgent') return n.isUrgent
    if (filter === 'hearing') return n.type === 'hearing'
    if (filter === 'payment') return n.type === 'payment'
    return true
  })

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'deadline':
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      case 'hearing':
        return <Calendar className="w-4 h-4 text-sky-500" />
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-500" />
      case 'reminder':
      default:
        return <Clock className="w-4 h-4 text-violet-500" />
    }
  }

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'deadline':
        return 'bg-amber-500/10 border-amber-500/20'
      case 'hearing':
        return 'bg-sky-500/10 border-sky-500/20'
      case 'payment':
        return 'bg-emerald-500/10 border-emerald-500/20'
      case 'reminder':
      default:
        return 'bg-violet-500/10 border-violet-500/20'
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <Button
        id="notification-btn"
        variant="ghost"
        size="icon"
        aria-label="Bildirimler"
        aria-expanded={open}
        className={cn(
          "relative h-9 w-9 rounded-lg transition-colors",
          open ? "bg-accent text-accent-foreground" : "hover:bg-muted/80 text-foreground"
        )}
        onClick={() => setOpen(prev => !prev)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-in zoom-in-50">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 mt-2 z-50 w-[360px] sm:w-[410px] rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">Bildirimler</span>
                {unreadCount > 0 ? (
                  <Badge variant="secondary" className="text-[11px] px-2 py-0 bg-red-500/10 text-red-500 font-semibold border-red-500/20">
                    {unreadCount} yeni
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] px-2 py-0 text-muted-foreground font-normal">
                    Hepsi okundu
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    title="Tümünü okundu işaretle"
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Tümünü Oku</span>
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-border/50 bg-background/50 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap",
                  filter === 'all' 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                Tümü ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('urgent')}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap",
                  filter === 'urgent' 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                Acil ({notifications.filter(n => n.isUrgent).length})
              </button>
              <button
                onClick={() => setFilter('hearing')}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap",
                  filter === 'hearing' 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                Duruşmalar
              </button>
              <button
                onClick={() => setFilter('payment')}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap",
                  filter === 'payment' 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                Ödemeler
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                    <CheckCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Yeni bildirim yok</p>
                  <p className="text-xs text-muted-foreground mt-1">Bu kategoride bekleyen bir bildiriminiz bulunmuyor.</p>
                </div>
              ) : (
                filteredNotifications.map(item => (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={cn(
                      "group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-muted/50",
                      !item.read ? "bg-primary/[0.03]" : "opacity-80"
                    )}
                  >
                    {/* Unread indicator dot */}
                    {!item.read && (
                      <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}

                    {/* Icon */}
                    <div className={cn("p-2 rounded-xl border shrink-0 mt-0.5", getIconBg(item.type))}>
                      {getIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={cn("text-xs leading-snug", !item.read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                          {item.title}
                        </p>
                        {item.isUrgent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-500/15 text-red-500 rounded border border-red-500/30">
                            ACİL
                          </span>
                        )}
                      </div>

                      {item.subtitle && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded",
                          item.isUrgent 
                            ? "bg-amber-500/10 text-amber-500 font-semibold" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {item.dueText}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">•</span>
                        <span className="text-[10px] text-muted-foreground/80">{item.timestamp}</span>

                        {item.link && (
                          <Link
                            href={item.link}
                            onClick={(e) => {
                              markAsRead(item.id)
                              setOpen(false)
                            }}
                            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary hover:underline ml-auto"
                          >
                            Detay <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-background/90 backdrop-blur-sm rounded-lg p-0.5 border border-border/50 shadow-sm">
                      {!item.read && (
                        <button
                          onClick={(e) => markAsRead(item.id, e)}
                          title="Okundu say"
                          className="p-1 hover:text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors text-muted-foreground"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteNotification(item.id, e)}
                        title="Bildirimi sil"
                        className="p-1 hover:text-destructive hover:bg-destructive/10 rounded transition-colors text-muted-foreground"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-2.5 px-4 border-t border-border/60 bg-muted/20 text-xs font-medium">
              <Link
                href="/hatirlaticilar"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                Hatırlatıcılar <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href="/takvim"
                onClick={() => setOpen(false)}
                className="text-primary hover:underline inline-flex items-center gap-1 transition-colors"
              >
                Takvime Git <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
