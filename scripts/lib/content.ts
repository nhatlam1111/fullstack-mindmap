import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import YAML from 'yaml';
import {
  BranchesFile, RoadmapFile, TopicFrontmatter, SECTIONS, DEEP_SECTION, NO_EXAMPLE, REVIEW_MONTHS,
  type TopicFrontmatterT,
} from './schema';

export type LoadedTopic = {
  file: string;
  folder: string;
  fm: TopicFrontmatterT;
  body: string;
};

export type Loaded = {
  root: string;
  branches: ReturnType<typeof BranchesFile.parse> | null;
  roadmap: ReturnType<typeof RoadmapFile.parse> | null;
  topics: LoadedTopic[];
  idsLock: string[];
  deletedIds: string[];
  errors: string[];
};

const rel = (root: string, p: string) => path.relative(root, p).split(path.sep).join('/');

function readYaml(file: string) {
  return YAML.parse(fs.readFileSync(file, 'utf8'));
}

function zodMessages(prefix: string, err: { issues: { path: (string | number)[]; message: string }[] }) {
  return err.issues.map((i) => `${prefix}: ${i.path.join('.') || '(gốc)'} — ${i.message}`);
}

export function loadContent(root: string): Loaded {
  const errors: string[] = [];
  const contentDir = path.join(root, 'content');

  let branches: Loaded['branches'] = null;
  const b = BranchesFile.safeParse(readYaml(path.join(contentDir, 'branches.yaml')));
  if (b.success) branches = b.data; else errors.push(...zodMessages('content/branches.yaml', b.error));

  let roadmap: Loaded['roadmap'] = null;
  const r = RoadmapFile.safeParse(readYaml(path.join(contentDir, 'roadmap.yaml')));
  if (r.success) roadmap = r.data; else errors.push(...zodMessages('content/roadmap.yaml', r.error));

  const topics: LoadedTopic[] = [];
  const topicsDir = path.join(contentDir, 'topics');
  for (const folder of fs.readdirSync(topicsDir).sort()) {
    const dir = path.join(topicsDir, folder);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      if (!name.endsWith('.md')) continue;
      const file = path.join(dir, name);
      const parsed = matter(fs.readFileSync(file, 'utf8'));
      // gray-matter đọc ngày YAML thành Date; đưa về chuỗi YYYY-MM-DD.
      const data = JSON.parse(JSON.stringify(parsed.data, (_k, v) => v), (_k, v) =>
        typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(v) ? v.slice(0, 10) : v);
      const fm = TopicFrontmatter.safeParse(data);
      if (!fm.success) { errors.push(...zodMessages(rel(root, file), fm.error)); continue; }
      if (fm.data.id + '.md' !== name) errors.push(`${rel(root, file)}: tên file phải là ${fm.data.id}.md`);
      topics.push({ file: rel(root, file), folder, fm: fm.data, body: parsed.content.trim() });
    }
  }

  const lockFile = path.join(contentDir, 'ids.lock');
  const idsLock = fs.existsSync(lockFile)
    ? fs.readFileSync(lockFile, 'utf8').split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#'))
    : [];
  const deletedFile = path.join(contentDir, 'deleted-ids.yaml');
  const deletedIds: string[] = fs.existsSync(deletedFile) ? (readYaml(deletedFile)?.deleted ?? []) : [];

  return { root, branches, roadmap, topics, idsLock, deletedIds, errors };
}

/** Tách thân bài theo tiêu đề cấp 2. */
export function splitSections(body: string): { title: string; text: string }[] {
  const out: { title: string; text: string }[] = [];
  let current: { title: string; lines: string[] } | null = null;
  let inFence = false;
  for (const line of body.split('\n')) {
    if (/^```/.test(line)) inFence = !inFence;
    const m = !inFence && /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (current) out.push({ title: current.title, text: current.lines.join('\n').trim() });
      current = { title: m[1], lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else if (line.trim()) {
      out.push({ title: '', text: line });
    }
  }
  if (current) out.push({ title: current.title, text: current.lines.join('\n').trim() });
  return out;
}

export const CITE_RE = /\[\^([a-z0-9]+(?:-[a-z0-9]+)*)\]/g;
export const EX_RE = /\[ex:([a-z0-9]+(?:-[a-z0-9]+)*)\]/g;

function addMonths(isoDay: string, months: number) {
  const [y, m, d] = isoDay.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  return dt.toISOString().slice(0, 10);
}

export type ValidationResult = { errors: string[]; warnings: string[] };

export function validate(loaded: Loaded, today: string): ValidationResult {
  const errors = [...loaded.errors];
  const warnings: string[] = [];
  const { branches, roadmap, topics, root } = loaded;
  if (!branches || !roadmap) return { errors, warnings };

  // id duy nhất trên toàn cây
  const seen = new Map<string, string>();
  const claim = (id: string, where: string) => {
    const prev = seen.get(id);
    if (prev) errors.push(`id trùng: "${id}" ở ${where} và ${prev}`);
    else seen.set(id, where);
  };
  claim(branches.root.id, 'root');
  const groupBranch = new Map<string, string>();
  for (const br of branches.branches) {
    claim(br.id, `nhánh ${br.id}`);
    for (const g of br.groups) { claim(g.id, `nhóm ${g.id}`); groupBranch.set(g.id, br.id); }
  }
  for (const t of topics) claim(t.fm.id, t.file);

  const topicIds = new Set(topics.map((t) => t.fm.id));
  const byId = new Map(topics.map((t) => [t.fm.id, t]));

  // cha, thư mục, quan hệ
  for (const t of topics) {
    const br = groupBranch.get(t.fm.parent);
    if (!br) { errors.push(`${t.file}: parent "${t.fm.parent}" không phải nhóm có thật`); continue; }
    if (br !== t.folder) errors.push(`${t.file}: chủ đề thuộc nhánh "${br}" nên phải nằm trong content/topics/${br}/`);
    for (const p of t.fm.prerequisites) {
      if (p === t.fm.id) errors.push(`${t.file}: không được tự là "cần học trước" của chính mình`);
      else if (!topicIds.has(p)) errors.push(`${t.file}: prerequisites trỏ tới "${p}" không tồn tại`);
    }
    for (const p of t.fm.related) {
      if (p === t.fm.id) errors.push(`${t.file}: không được tự liên quan tới chính mình`);
      else if (!topicIds.has(p)) errors.push(`${t.file}: related trỏ tới "${p}" không tồn tại`);
    }
  }

  // node mồ côi: nhóm không có chủ đề nào
  const groupsWithTopics = new Set(topics.map((t) => t.fm.parent));
  for (const br of branches.branches) for (const g of br.groups) {
    if (!groupsWithTopics.has(g.id)) errors.push(`nhóm "${g.id}" không có chủ đề nào (node mồ côi)`);
  }

  // vòng lặp cần học trước
  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const visit = (id: string) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      const from = stack.indexOf(id);
      errors.push(`vòng lặp "cần học trước": ${[...stack.slice(from), id].join(' → ')}`);
      return;
    }
    state.set(id, 1); stack.push(id);
    for (const p of byId.get(id)?.fm.prerequisites ?? []) if (topicIds.has(p)) visit(p);
    stack.pop(); state.set(id, 2);
  };
  for (const id of topicIds) visit(id);

  // lộ trình: đủ 24 tuần
  const weekNums = roadmap.weeks.map((w) => w.week);
  for (let n = 1; n <= 24; n++) {
    const count = weekNums.filter((x) => x === n).length;
    if (count !== 1) errors.push(`roadmap.yaml: tuần ${n} xuất hiện ${count} lần (cần đúng 1)`);
  }
  for (const w of roadmap.weeks) for (const tid of w.topics) {
    if (!topicIds.has(tid)) errors.push(`roadmap.yaml: tuần ${w.week} trỏ tới chủ đề "${tid}" không tồn tại`);
  }
  const phaseWeeks = roadmap.phases.flatMap((p) => p.weeks).sort((a, b) => a - b);
  if (phaseWeeks.join(',') !== Array.from({ length: 24 }, (_, i) => i + 1).join(',')) {
    errors.push('roadmap.yaml: các giai đoạn phải phủ đúng tuần 1–24, mỗi tuần một lần');
  }
  const inRoadmap = new Set(roadmap.weeks.flatMap((w) => w.topics));
  for (const t of topics) if (!inRoadmap.has(t.fm.id)) warnings.push(`${t.file}: chưa nằm trong tuần nào của lộ trình`);

  // id từng xuất hiện không được biến mất
  const previous = new Set(topics.flatMap((t) => t.fm.previousIds));
  const deleted = new Set(loaded.deletedIds);
  for (const old of loaded.idsLock) {
    if (!topicIds.has(old) && !previous.has(old) && !deleted.has(old)) {
      errors.push(`id "${old}" từng có trong content/ids.lock nhưng đã biến mất; thêm vào previousIds của chủ đề thay thế hoặc vào content/deleted-ids.yaml`);
    }
  }

  // nội dung bài
  for (const t of topics) {
    const { fm, body, file } = t;
    if (fm.contentStatus === 'skeleton') {
      if (body) warnings.push(`${file}: đang là Khung nhưng đã có thân bài; đổi contentStatus thành draft`);
      continue;
    }
    const sections = splitSections(body);
    const titles = sections.filter((s) => s.title).map((s) => s.title);
    const required = SECTIONS.map((s) => s.title);
    const core = titles.filter((x) => x !== DEEP_SECTION);
    if (core.join('|') !== required.join('|')) {
      errors.push(`${file}: cần đúng 7 tiêu đề theo thứ tự [${required.join(' / ')}], đang có [${core.join(' / ')}]`);
    }
    if (titles.includes(DEEP_SECTION) && titles[titles.length - 1] !== DEEP_SECTION) {
      errors.push(`${file}: mục "${DEEP_SECTION}" phải nằm cuối bài`);
    }
    if (sections.some((s) => !s.title)) errors.push(`${file}: có nội dung trước tiêu đề đầu tiên`);

    // nguồn
    const sourceIds = new Set(fm.sources.map((s) => s.id));
    if (sourceIds.size !== fm.sources.length) errors.push(`${file}: id nguồn bị trùng`);
    const cited = new Set([...body.matchAll(CITE_RE)].map((m) => m[1]));
    for (const c of cited) if (!sourceIds.has(c)) errors.push(`${file}: chú thích [^${c}] không khớp nguồn nào trong sources`);
    for (const s of fm.sources) if (!cited.has(s.id)) {
      (fm.contentStatus === 'verified' ? errors : warnings).push(`${file}: nguồn "${s.id}" khai báo nhưng chưa được trích dẫn`);
    }
    if (fm.contentStatus === 'verified') {
      if (!fm.verifiedAt) errors.push(`${file}: bài Đã kiểm chứng cần verifiedAt`);
      if (!fm.verifiedBy) errors.push(`${file}: bài Đã kiểm chứng cần verifiedBy (lam hoặc claude)`);
      if (fm.sources.length === 0) errors.push(`${file}: bài Đã kiểm chứng cần ít nhất một nguồn`);
      if (fm.verifiedAt) {
        const due = addMonths(fm.verifiedAt, REVIEW_MONTHS[fm.volatility]);
        if (due < today) warnings.push(`${file}: quá hạn rà soát từ ${due} (độ ổn định ${fm.volatility})`);
      }
    }

    // ví dụ
    const exIds = new Set(fm.examples.map((e) => e.id));
    if (exIds.size !== fm.examples.length) errors.push(`${file}: id ví dụ bị trùng`);
    for (const ex of fm.examples) {
      if (ex.path) {
        const readme = path.join(root, ex.path, 'README.md');
        if (!fs.existsSync(readme)) errors.push(`${file}: ví dụ ${ex.id} trỏ tới ${ex.path} nhưng không có ${ex.path}/README.md`);
      }
    }
    const exSection = sections.find((s) => s.title === 'Ví dụ thực tế');
    if (exSection) {
      const refs = new Set([...exSection.text.matchAll(EX_RE)].map((m) => m[1]));
      const elsewhere = [...body.matchAll(EX_RE)].map((m) => m[1]);
      for (const r2 of elsewhere) if (!exIds.has(r2)) errors.push(`${file}: [ex:${r2}] không khớp ví dụ nào trong examples`);
      if (refs.size === 0 && !exSection.text.includes(NO_EXAMPLE)) {
        errors.push(`${file}: mục "Ví dụ thực tế" phải tham chiếu ví dụ bằng [ex:<id>] hoặc ghi "${NO_EXAMPLE}"`);
      }
      for (const ex of fm.examples) if (!refs.has(ex.id)) errors.push(`${file}: ví dụ "${ex.id}" khai báo nhưng mục "Ví dụ thực tế" không tham chiếu`);
    }
  }

  return { errors, warnings };
}

/** Ghi thêm id mới vào content/ids.lock. */
export function updateIdsLock(loaded: Loaded) {
  const file = path.join(loaded.root, 'content', 'ids.lock');
  const known = new Set(loaded.idsLock);
  const fresh = loaded.topics.map((t) => t.fm.id).filter((id) => !known.has(id));
  if (fresh.length === 0) return 0;
  const header = known.size === 0 ? '# Mọi id chủ đề từng xuất hiện. Được ghi thêm tự động khi build; không xóa dòng.\n' : '';
  fs.appendFileSync(file, header + fresh.sort().join('\n') + '\n');
  return fresh.length;
}
