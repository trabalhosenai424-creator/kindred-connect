export const NOTIFICATION_THRESHOLDS = [30, 15, 7, 0] as const

export function calibrationNotificationType(daysUntilDue: number) {
  if (daysUntilDue < 0) return 'calibration_overdue' as const
  return 'calibration_due' as const
}

export function calibrationNotificationTitle(daysUntilDue: number) {
  if (daysUntilDue < 0) return 'Calibração vencida'
  if (daysUntilDue === 0) return 'Calibração vence hoje'
  return `Calibração vence em ${daysUntilDue} dias`
}

export function shouldNotifyForDueDate(
  dueDate: Date | string,
  today = new Date(),
) {
  const due = new Date(dueDate)
  const startToday = new Date(today)
  startToday.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  const daysUntilDue = Math.round((due.getTime() - startToday.getTime()) / 86400000)
  return {
    shouldNotify: NOTIFICATION_THRESHOLDS.includes(daysUntilDue as (typeof NOTIFICATION_THRESHOLDS)[number]) || daysUntilDue < 0,
    daysUntilDue,
  }
}
