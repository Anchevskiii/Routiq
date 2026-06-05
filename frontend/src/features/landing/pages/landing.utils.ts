// ── Easing ──────────────────────────────────────────────
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ── Wikipedia image mapping ──────────────────────────────
export function mapWikiImages(
  pages: Record<string, { title: string; thumbnail?: { source: string } }>,
  wikiMap: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const p of Object.values(pages)) {
    const display = Object.keys(wikiMap).find(
      k => wikiMap[k] === p.title.replace(/ /g, '_')
    )
    if (display && p.thumbnail?.source) result[display] = p.thumbnail.source
  }
  return result
}
