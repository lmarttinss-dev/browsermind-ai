/** Runs inside the public listing page. Keep self-contained for Playwright serialization. */
export function extractAvantproCategoryFields(): { label: string; value: string }[] {
  const roots: (Document | ShadowRoot)[] = [document]
  const fields: { label: string; value: string }[] = []
  const seen = new Set<string>()
  while (roots.length) {
    const root = roots.pop()!
    root.querySelectorAll('.avantpro-filter-card-label').forEach(element => {
      const labelElement = element.cloneNode(true) as Element
      labelElement.querySelectorAll('svg, [class*=tooltip]').forEach(child => child.remove())
      const label = (labelElement.textContent || '').replace(/\s+/g, ' ').trim()
      const card = element.closest('.avantpro-filter-card') || element.parentElement
      const valueElement = card?.querySelector('.avantpro-filter-card-value')
      if (!valueElement || valueElement.querySelector('[role=status]')) return
      const value = (valueElement.textContent || '').replace(/\s+/g, ' ').trim()
      const key = label + '|' + value
      if (label && value && !seen.has(key)) { seen.add(key); fields.push({ label: label.slice(0,200), value: value.slice(0,500) }) }
    })
    root.querySelectorAll('*').forEach(element => { if (element.shadowRoot) roots.push(element.shadowRoot) })
  }
  return fields.slice(0,100)
}
