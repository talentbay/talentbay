/** Read one plain list item from a unique named section, not from posting prose. */
export function leverSectionItem(lists: unknown, heading: string): string | null {
  if (!Array.isArray(lists) || lists.length > 50) return null
  const sections = lists.filter((entry: unknown): entry is { text: string; content?: unknown } =>
    typeof entry === 'object' && entry !== null && 'text' in entry
    && typeof entry.text === 'string' && entry.text.trim().toLowerCase() === heading.toLowerCase())
  if (sections.length !== 1) return null
  const content = sections[0]?.content
  if (typeof content !== 'string' || content.length > 300) return null
  const match = /^<li>([^<>]+)<\/li>$/.exec(content.trim())
  return match?.[1]?.trim() || null
}
