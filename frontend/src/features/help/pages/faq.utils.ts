export type FaqCat = 'all' | 'gen' | 'edit' | 'groups' | 'export' | 'account'

export interface FaqItem {
  id: number
  cat: Exclude<FaqCat, 'all'>
  color: string
  q: string
  a: string
  keywords: string
}

export function filterFaq(items: FaqItem[], cat: FaqCat, query: string): FaqItem[] {
  const q = query.trim().toLowerCase()
  const words = q.split(/\s+/).filter(w => w.length >= 2)
  return items.filter(item => {
    const matchCat = q ? true : (cat === 'all' || item.cat === cat)
    const matchQ = !words.length || words.some(w =>
      item.q.toLowerCase().includes(w) || item.keywords.includes(w)
    )
    return matchCat && matchQ
  })
}

export function countForCat(items: FaqItem[], cat: FaqCat): number {
  if (cat === 'all') return items.length
  return items.filter(i => i.cat === cat).length
}
