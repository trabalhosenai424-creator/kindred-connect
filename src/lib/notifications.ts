import { supabase } from '@/integrations/supabase/client'

export type NotificationType =
  | 'calibration_due'
  | 'calibration_overdue'
  | 'certificate_expired'
  | 'standard_expired'
  | 'maintenance_due'
  | 'nc_deadline'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  instrument_id?: string | null
  read: boolean
  created_at: string
}

export async function getNotifications(limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as AppNotification[]
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)

  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)

  if (error) throw error
}

export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: AppNotification) => void,
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNotification(payload.new as AppNotification),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
