// BrowserMind AI - Content Extractor
// Injected into pages to extract structured content

interface ExtractedPage {
  url: string;
  title: string;
  visibleText: string;
  simplifiedHtml: string;
  metaTags: Record<string, string>;
  structuredData: unknown[];
  selectedText: string;
  headings: string[];
  links: { text: string; href: string }[];
  images: { alt: string; src: string }[];
  tables: string[][];
}

function extractMetaTags(): Record<string, string> {
  const meta: Record<string, string> = {};
  const metaTags = document.querySelectorAll("meta[name], meta[property]");
  metaTags.forEach((tag) => {
    const key = tag.getAttribute("name") || tag.getAttribute("property") || "";
    const value = tag.getAttribute("content") || "";
    if (key && value) meta[key] = value;
  });
  return meta;
}

function extractStructuredData(): unknown[] {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const data: unknown[] = [];
  scripts.forEach((script) => {
    try {
      data.push(JSON.parse(script.textContent || ""));
    } catch {
      // ignore invalid JSON
    }
  });
  return data;
}

function extractVisibleText(root: Element = document.body): string {
  const IGNORED_TAGS = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH", "IFRAME",
    "OBJECT", "EMBED", "APPLET", "LINK", "META", "HEAD",
  ]);

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || "").trim();
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as Element;
    if (IGNORED_TAGS.has(el.tagName)) return "";

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return "";
    }

    const parts: string[] = [];
    for (const child of el.childNodes) {
      const text = walk(child);
      if (text) parts.push(text);
    }

    const tag = el.tagName;
    const joined = parts.join(" ");

    if (["H1", "H2", "H3", "H4", "H5", "H6", "P", "LI", "TR", "DIV", "SECTION", "ARTICLE"].includes(tag)) {
      return joined + "\n";
    }

    return joined;
  }

  return walk(root)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();
}

function extractSimplifiedHtml(): string {
  const clone = document.body.cloneNode(true) as HTMLElement;

  // Remove scripts, styles, and other non-content elements
  const removeSelectors = [
    "script", "style", "noscript", "svg", "iframe",
    "object", "embed", "link[rel=stylesheet]",
    "[aria-hidden=true]", ".hidden", "[style*='display: none']",
    "nav", "footer", "header",
  ];

  removeSelectors.forEach((selector) => {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // Remove all attributes except semantic ones
  const keepAttrs = new Set(["href", "src", "alt", "title", "type", "value", "placeholder", "name", "id", "class", "role", "aria-label", "data-testid"]);
  clone.querySelectorAll("*").forEach((el) => {
    const attrs = Array.from(el.attributes);
    attrs.forEach((attr) => {
      if (!keepAttrs.has(attr.name)) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Limit size
  const html = clone.innerHTML;
  if (html.length > 50000) {
    return html.slice(0, 50000) + "\n<!-- truncated -->";
  }
  return html;
}

function extractHeadings(): string[] {
  const headings: string[] = [];
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
    const text = (h.textContent || "").trim();
    if (text) headings.push(`${h.tagName}: ${text}`);
  });
  return headings;
}

function extractLinks(): { text: string; href: string }[] {
  const links: { text: string; href: string }[] = [];
  const seen = new Set<string>();
  document.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const text = (a.textContent || "").trim();
    if (text && href && !seen.has(href)) {
      seen.add(href);
      links.push({ text: text.slice(0, 100), href });
    }
  });
  return links.slice(0, 100);
}

function extractImages(): { alt: string; src: string }[] {
  const images: { alt: string; src: string }[] = [];
  document.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || "";
    if (src) images.push({ alt, src: src.slice(0, 200) });
  });
  return images.slice(0, 50);
}

function extractTables(): string[][] {
  const tables: string[][] = [];
  document.querySelectorAll("table").forEach((table) => {
    table.querySelectorAll("tr").forEach((tr) => {
      const row: string[] = [];
      tr.querySelectorAll("td, th").forEach((cell) => {
        row.push((cell.textContent || "").trim());
      });
      if (row.length > 0) tables.push(row);
    });
  });
  return tables.slice(0, 200);
}

function extractPageData(): ExtractedPage {
  return {
    url: window.location.href,
    title: document.title,
    visibleText: extractVisibleText(),
    simplifiedHtml: extractSimplifiedHtml(),
    metaTags: extractMetaTags(),
    structuredData: extractStructuredData(),
    selectedText: window.getSelection()?.toString()?.trim() || "",
    headings: extractHeadings(),
    links: extractLinks(),
    images: extractImages(),
    tables: extractTables(),
  };
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "EXTRACT_PAGE") {
    try {
      const data = extractPageData();
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
    return true;
  }
});
