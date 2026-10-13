const STORAGE_PREFIX = 'sapai:otp-cooldown:'

export function otpCooldownStorageKey(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`
}

export function readOtpCooldownEnd(email: string): number | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(otpCooldownStorageKey(email))
  if (!raw) return null
  const end = Number(raw)
  if (!Number.isFinite(end) || end <= Date.now()) {
    sessionStorage.removeItem(otpCooldownStorageKey(email))
    return null
  }
  return end
}

export function writeOtpCooldownEnd(email: string, endMs: number): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(otpCooldownStorageKey(email), String(endMs))
}

export function clearOtpCooldown(email: string): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(otpCooldownStorageKey(email))
}
