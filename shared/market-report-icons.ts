// Convert presentation symbols in text nodes only; preserve attributes and links.
const paths: Record<string, string> = {
 check: '<path d="m5 12 4 4L19 6"/>',
 alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v4m0 4h.01"/>',
 chart: '<path d="M3 3v18h18M7 16v-5m5 5V7m5 9v-8"/>',
 box: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9"/>',
 search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 document: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6m-6 4h6m-6 4h4"/>',
 money: '<path d="M12 2v20m5-16H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6"/>',
 truck: '<path d="M1 4h13v13H1zm13 5h4l4 4v4h-8"/><circle cx="5" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
 star: '<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
 cross: '<path d="m6 6 12 12M6 18 18 6"/>',
 target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
};
function icon(symbol: string) {
 const type = /[✅✔☑🟢]/u.test(symbol) ? 'check' : /[⚠🚨🟡🟠🔴]/u.test(symbol) ? 'alert' : /[❌✖]/u.test(symbol) ? 'cross' : /[📊📈📉]/u.test(symbol) ? 'chart' : /[📦🏷]/u.test(symbol) ? 'box' : /[🔍🔎]/u.test(symbol) ? 'search' : /[💰💵💲💸]/u.test(symbol) ? 'money' : /[🚚🚢✈]/u.test(symbol) ? 'truck' : /[⭐🌟💡✨]/u.test(symbol) ? 'star' : /[🎯]/u.test(symbol) ? 'target' : 'document';
 return '<svg class="report-inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="' + type + '">' + paths[type] + '</svg>';
}
export function replaceReportEmoji(html: string): string {
 return html.split(/(<[^>]*>)/g).map((part, index) => index % 2 ? part : part.replace(/(?:[\p{Extended_Pictographic}✅✔☑❌✖])(?:[︎️\p{Emoji_Modifier}]|‍\p{Extended_Pictographic})*/gu, icon)).join('');
}
