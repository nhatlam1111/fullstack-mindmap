import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import type { Root as HastRoot, Element } from 'hast';
import type { Root as MdRoot, ListItem } from 'mdast';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import { splitSections, CITE_RE, EX_RE, type Loaded } from './content';
import { SECTIONS, DEEP_SECTION } from './schema';

/** Link ngoài mở tab mới; link #id giữ nguyên để router xử lý. */
function rehypeLinks() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') return;
      const href = String(node.properties?.href ?? '');
      if (/^https?:\/\//.test(href)) {
        node.properties = { ...node.properties, target: '_blank', rel: ['noopener', 'noreferrer'] };
      }
    });
  };
}

const schema: typeof defaultSchema = {
  ...defaultSchema,
  clobberPrefix: '',
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-./]] as NonNullable<typeof defaultSchema.attributes>[string],
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeLinks)
  .use(rehypeStringify);

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function mdToHtml(md: string) {
  return String(processor.processSync(md));
}

function listItemsOf(md: string): string[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md) as MdRoot;
  const items: string[] = [];
  visit(tree, 'listItem', (node: ListItem) => { items.push(toString(node).trim()); });
  return items;
}

export type CompiledSection = { key: string; title: string; html: string };
export type CompiledExample = {
  id: string; kind: string; title: string; url?: string; path?: string; checkedAt: string; html?: string;
};

export type CompiledTopic = {
  id: string; title: string; parent: string; branch: string; summary: string;
  contentStatus: 'skeleton' | 'draft' | 'verified';
  volatility: 'stable' | 'slow' | 'fast';
  verifiedAt?: string;
  verifiedBy?: 'lam' | 'claude';
  prerequisites: string[]; related: string[]; previousIds: string[];
  weeks: number[];
  sources: { id: string; n: number; url: string; title?: string; supports: string; product?: string; version?: string; checkedAt: string }[];
  examples: CompiledExample[];
  changelog: { date: string; note: string }[];
  sections: CompiledSection[];
  deep?: string;
  selfTest: string[];
  text: string;
};

export type ContentJson = {
  builtAt: string;
  root: { id: string; title: string };
  branches: { id: string; title: string; volatility: string; groups: { id: string; title: string }[] }[];
  phases: { id: string; title: string; weeks: number[] }[];
  weeks: { week: number; title: string; goal: string; practice: string; checkpoint: string; topics: string[] }[];
  topics: Record<string, CompiledTopic>;
  order: string[];
};

export function compile(loaded: Loaded, builtAt: string): ContentJson {
  const { branches, roadmap } = loaded;
  if (!branches || !roadmap) throw new Error('nội dung chưa hợp lệ');
  const groupBranch = new Map<string, string>();
  for (const b of branches.branches) for (const g of b.groups) groupBranch.set(g.id, b.id);
  const weeksOf = new Map<string, number[]>();
  const firstPos = new Map<string, number>();
  for (const w of [...roadmap.weeks].sort((a, b) => a.week - b.week)) {
    w.topics.forEach((t, i) => {
      weeksOf.set(t, [...(weeksOf.get(t) ?? []), w.week]);
      if (!firstPos.has(t)) firstPos.set(t, w.week * 1000 + i);
    });
  }

  const topics: Record<string, CompiledTopic> = {};
  // thứ tự hiển thị: theo nhánh → nhóm → thứ tự tuần đầu tiên → tên
  const sorted = [...loaded.topics].sort((a, b) => {
    const ga = [...groupBranch.keys()].indexOf(a.fm.parent);
    const gb = [...groupBranch.keys()].indexOf(b.fm.parent);
    if (ga !== gb) return ga - gb;
    const wa = firstPos.get(a.fm.id) ?? 1e9;
    const wb = firstPos.get(b.fm.id) ?? 1e9;
    if (wa !== wb) return wa - wb;
    return a.file.localeCompare(b.file);
  });

  for (const t of sorted) {
    const { fm } = t;
    const sourceN = new Map(fm.sources.map((s, i) => [s.id, i + 1]));
    const exById = new Map(fm.examples.map((e) => [e.id, e]));
    const render = (md: string) => {
      const withMarkers = md
        .replace(CITE_RE, (_m, id) => `CITE${id}ETIC`)
        .replace(EX_RE, (_m, id) => `EXREF${id}FERXE`);
      return mdToHtml(withMarkers)
        .replace(/CITE([a-z0-9-]+)ETIC/g, (_m, id) => {
          const s = fm.sources.find((x) => x.id === id);
          return `<sup class="cite" title="${escapeHtml(s?.supports ?? '')}">[${sourceN.get(id)}]</sup>`;
        })
        .replace(/EXREF([a-z0-9-]+)FERXE/g, (_m, id) => {
          const ex = exById.get(id);
          if (!ex) return '';
          return ex.url
            ? `<a class="ex-ref" href="${escapeHtml(ex.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ex.title)}</a>`
            : `<span class="ex-ref">${escapeHtml(ex.title)}</span>`;
        });
    };

    const sections: CompiledSection[] = [];
    let deep: string | undefined;
    let selfTest: string[] = [];
    if (fm.contentStatus !== 'skeleton') {
      for (const s of splitSections(t.body)) {
        if (s.title === DEEP_SECTION) { deep = render(s.text); continue; }
        const def = SECTIONS.find((x) => x.title === s.title);
        sections.push({ key: def?.key ?? 'other', title: s.title, html: s.text ? render(s.text) : '' });
        if (def?.key === 'selftest') selfTest = listItemsOf(s.text);
      }
    }

    const examples: CompiledExample[] = fm.examples.map((e) => {
      let html: string | undefined;
      if (e.path) {
        const readme = path.join(loaded.root, e.path, 'README.md');
        if (fs.existsSync(readme)) html = mdToHtml(fs.readFileSync(readme, 'utf8'));
      }
      return { ...e, html };
    });

    topics[fm.id] = {
      id: fm.id, title: fm.title, parent: fm.parent, branch: groupBranch.get(fm.parent)!,
      summary: fm.summary, contentStatus: fm.contentStatus, volatility: fm.volatility, verifiedAt: fm.verifiedAt, verifiedBy: fm.verifiedBy,
      prerequisites: fm.prerequisites, related: fm.related, previousIds: fm.previousIds,
      weeks: weeksOf.get(fm.id) ?? [],
      sources: fm.sources.map((s) => ({ ...s, n: sourceN.get(s.id)! })),
      examples, changelog: fm.changelog, sections, deep, selfTest,
      text: t.body.replace(CITE_RE, '').replace(EX_RE, '').replace(/[#*_`>|[\]()-]/g, ' ').replace(/\s+/g, ' ').trim(),
    };
  }

  return {
    builtAt,
    root: branches.root,
    branches: branches.branches,
    phases: roadmap.phases,
    weeks: [...roadmap.weeks].sort((a, b) => a.week - b.week),
    topics,
    order: sorted.map((t) => t.fm.id),
  };
}
