export type CategoryField = { label: string; value: string }
const TYPES = ['Full', 'Flex', 'Correios', 'Coleta', 'Places', 'Outros'] as const
export function summarizeAvantproLogistics(fields: CategoryField[], perOffer: { label: string; value: number }[]) {
  const values = new Map<string, Set<number>>()
  for (const field of fields) {
    const key = field.label.replace(/\s*\(AvantPro\)\s*$/i, '').trim().toLowerCase()
    const type = TYPES.find(label => label.toLowerCase() === key)
    const raw = field.value.replace(/[\s\u00a0]/g, '')
    if (!type || !/^\d+(?:\.\d{3})*$/.test(raw)) continue
    const count = Number(raw.replace(/\./g, ''))
    if (!Number.isSafeInteger(count) || count < 0) continue
    if (!values.has(type)) values.set(type, new Set())
    values.get(type)!.add(count)
  }
  const conflicts = [...values].filter(([, counts]) => counts.size > 1).map(([label]) => label)
  const items = TYPES.flatMap(label => { const counts = values.get(label); return counts?.size === 1 ? [{ label, value: [...counts][0] }] : [] })
  if (items.length) {
    const base = items.reduce((sum, item) => sum + item.value, 0)
    return { items, base, source: 'AvantPro - Logística de Entrega', scope: 'category' as const,
      missing: TYPES.filter(label => !items.some(item => item.label === label)), conflicts,
      description: 'Percentuais sobre a soma dos contadores logísticos informados pelo AvantPro (' + base + ' registros), não sobre as ofertas deduplicadas. Os contadores não atribuem logística individual a cada vendedor.' }
  }
  return { items: perOffer, base: perOffer.reduce((sum, item) => sum + item.value, 0), source: 'Sinais observados por anúncio', scope: 'offers' as const,
    missing: [...TYPES], conflicts, description: 'Contadores agregados de logística do AvantPro não disponíveis. Esta distribuição usa somente a classificação observada por oferta; ausência de sinal não confirma envio normal.' }
}
