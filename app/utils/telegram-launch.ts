export function hasCachedTelegramLaunch(read: (key: string) => string | null): boolean {
  try {
    const raw = read('__telegram__initParams')
    if (!raw || raw.length > 65_536) return false
    const value: unknown = JSON.parse(raw)
    return typeof value === 'object' && value !== null && 'tgWebAppData' in value
      && typeof value.tgWebAppData === 'string' && value.tgWebAppData.length > 0
  }
  catch { return false }
}
