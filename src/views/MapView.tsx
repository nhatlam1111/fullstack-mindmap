import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position, MarkerType, useReactFlow,
  type Node, type Edge, type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { content, groups, topics, topicsOfBranch, hasArticle } from '../content';
import { useProgress, useWeek, displayStatus, type DisplayStatus } from '../store/hooks';
import { progressOf } from '../store/model';
import { safeStorage } from '../lib/storage';
import { Icon } from '../components/Icon';
import { StatusDot } from '../components/Status';
import { TopicArticle } from '../components/TopicArticle';

type NodeData = {
  label: string;
  kind: 'root' | 'branch' | 'group' | 'topic';
  open?: boolean;
  status?: DisplayStatus;
  contentStatus?: string;
  selected?: boolean;
  dim?: boolean;
  done?: number;
  total?: number;
};

const SIZE = { root: [210, 44], branch: [270, 58], group: [210, 34], topic: [240, 34] } as const;

const hidden = { opacity: 0 };
const In = () => <Handle type="target" position={Position.Left} style={hidden} isConnectable={false} />;
const Out = () => <Handle type="source" position={Position.Right} style={hidden} isConnectable={false} />;

const RootNode = memo(({ data }: NodeProps<Node<NodeData>>) => (
  <div className="mm-node mm-root"><Out />{data.label}</div>
));
const BranchNode = memo(({ data }: NodeProps<Node<NodeData>>) => {
  const pct = data.total ? Math.round(((data.done ?? 0) / data.total) * 100) : 0;
  return (
    <div className="mm-node mm-branch" data-open={data.open}>
      <In /><Out />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span className="name">{data.label}</span><span className="count" title="Đã hiểu / chủ đề đã có bài hoặc đã tới tuần học">{data.total ? `${data.done}/${data.total}` : '—'}</span>
      </div>
      <div className="progress" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
    </div>
  );
});
const GroupNode = memo(({ data }: NodeProps<Node<NodeData>>) => (
  <div className="mm-node mm-group"><In /><Out />{data.label}</div>
));
const TopicNode = memo(({ data }: NodeProps<Node<NodeData>>) => (
  <div className="mm-node mm-topic" data-content={data.contentStatus} data-selected={data.selected} data-dim={data.dim}>
    <In /><Out />
    <StatusDot status={data.status ?? 'none'} content={data.contentStatus as never} />
    <span className="label">{data.label}</span>
  </div>
));
const nodeTypes = { root: RootNode, branch: BranchNode, group: GroupNode, topic: TopicNode };

const OPEN_KEY = 'fsmap:map:v1';

function layout(nodes: Node<NodeData>[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 10, ranksep: 70, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) { const [w, h] = SIZE[n.data.kind]; g.setNode(n.id, { width: w, height: h }); }
  for (const e of edges) if (e.data?.tree) g.setEdge(e.source, e.target);
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id); const [w, h] = SIZE[n.data.kind];
    return { ...n, position: { x: p.x - w / 2, y: p.y - h / 2 } };
  });
}

function MindMap({ selected, onSelect }: { selected: string | null; onSelect: (id: string | null) => void }) {
  const progress = useProgress();
  const week = useWeek();
  const saved = safeStorage.get<{ open: string[]; multi: boolean }>(OPEN_KEY, { open: [], multi: false });
  const [open, setOpen] = useState<string[]>(saved.open);
  const [multi, setMulti] = useState(saved.multi);
  const flow = useReactFlow();

  useEffect(() => { safeStorage.set(OPEN_KEY, { open, multi }); }, [open, multi]);
  useEffect(() => {
    if (selected && topics[selected] && !open.includes(topics[selected].branch)) {
      setOpen((o) => (multi ? [...o, topics[selected].branch] : [topics[selected].branch]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const { nodes, edges } = useMemo(() => {
    const ns: Node<NodeData>[] = [];
    const es: Edge[] = [];
    const info = (id: string) => ({ hasArticle: hasArticle(topics[id]), firstWeek: Math.min(...(topics[id].weeks.length ? topics[id].weeks : [99])) });
    const sel = selected ? topics[selected] : undefined;
    const linked = new Set(sel ? [sel.id, ...sel.prerequisites, ...sel.related] : []);
    ns.push({ id: 'root', type: 'root', position: { x: 0, y: 0 }, data: { label: content.root.title, kind: 'root' } });
    for (const b of content.branches) {
      const { total, understood } = progressOf(topicsOfBranch(b.id), info, progress, week);
      const isOpen = open.includes(b.id);
      ns.push({ id: b.id, type: 'branch', position: { x: 0, y: 0 }, data: { label: b.title, kind: 'branch', open: isOpen, done: understood, total } });
      es.push({ id: `e-root-${b.id}`, source: 'root', target: b.id, type: 'smoothstep', data: { tree: true } });
      if (!isOpen) continue;
      for (const g of b.groups) {
        ns.push({ id: g.id, type: 'group', position: { x: 0, y: 0 }, data: { label: g.title, kind: 'group' } });
        es.push({ id: `e-${b.id}-${g.id}`, source: b.id, target: g.id, type: 'smoothstep', data: { tree: true } });
        for (const tid of groups[g.id].topics) {
          const t = topics[tid];
          ns.push({
            id: tid, type: 'topic', position: { x: 0, y: 0 },
            data: { label: t.title, kind: 'topic', status: displayStatus(progress[tid]), contentStatus: t.contentStatus, selected: tid === selected, dim: !!sel && !linked.has(tid) },
          });
          es.push({ id: `e-${g.id}-${tid}`, source: g.id, target: tid, type: 'smoothstep', data: { tree: true } });
        }
      }
    }
    const laid = layout(ns, es);
    const visible = new Set(laid.map((n) => n.id));
    if (sel) {
      for (const p of sel.prerequisites) if (visible.has(p)) {
        es.push({ id: `pre-${p}-${sel.id}`, source: p, target: sel.id, type: 'default', animated: true,
          style: { stroke: 'var(--accent)', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)' }, data: { tree: false } });
      }
      for (const r of sel.related) if (visible.has(r)) {
        es.push({ id: `rel-${sel.id}-${r}`, source: sel.id, target: r, type: 'default',
          style: { stroke: 'var(--ink-3)', strokeWidth: 1.2, strokeDasharray: '4 4' }, data: { tree: false } });
      }
    }
    return { nodes: laid, edges: es };
  }, [open, progress, week, selected]);

  useEffect(() => {
    const t = setTimeout(() => flow.fitView({ padding: 0.12, duration: 250 }), 30);
    return () => clearTimeout(t);
  }, [open, flow]);

  const onNodeClick = useCallback((_: unknown, n: Node<NodeData>) => {
    if (n.data.kind === 'branch') {
      setOpen((o) => (o.includes(n.id) ? o.filter((x) => x !== n.id) : multi ? [...o, n.id] : [n.id]));
      onSelect(null);
    } else if (n.data.kind === 'topic') {
      onSelect(n.id === selected ? null : n.id);
    } else if (n.data.kind === 'root') {
      setOpen([]); onSelect(null);
    }
  }, [multi, selected, onSelect]);

  return (
    <div className="map-canvas">
      <div className="map-toolbar">
        <label className="toggle" htmlFor="multi-open">
          <input id="multi-open" type="checkbox" checked={multi} onChange={(e) => { setMulti(e.target.checked); if (!e.target.checked) setOpen((o) => o.slice(-1)); }} />
          Mở nhiều nhánh
        </label>
        <button className="toggle" type="button" onClick={() => flow.fitView({ padding: 0.12, duration: 250 })}><Icon name="fit" size={16} />Về tổng quan</button>
        <div className="legend" aria-label="Chú giải">
          <span><span className="dot" />Chưa học</span>
          <span><span className="dot" data-status="learning" />Đang học</span>
          <span><span className="dot" data-status="understood" />Đã hiểu</span>
          <span><span className="dot" data-status="due" />Cần ôn</span>
          <span style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 10 }}>Viền nét đứt: chưa có bài</span>
        </div>
      </div>
      <ReactFlow
        nodes={nodes} edges={edges} nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
        minZoom={0.2} maxZoom={1.6} fitView proOptions={{ hideAttribution: true }}
        aria-label="Bản đồ kiến thức. Bấm vào nhánh để mở, bấm vào chủ đề để đọc."
      >
        <Background gap={24} size={1} color="var(--rule)" />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
}

const SEL_KEY = 'fsmap:map-selected:v1';

export function MapView() {
  const [selected, setSelected] = useState<string | null>(() => {
    const s = safeStorage.get<string | null>(SEL_KEY, null);
    return s && topics[s] ? s : null;
  });
  const select = useCallback((id: string | null) => { setSelected(id); safeStorage.set(SEL_KEY, id); }, []);
  return (
    <ReactFlowProvider>
      <div className={'map-wrap' + (selected ? ' with-panel' : '')}>
        <MindMap selected={selected} onSelect={select} />
        {selected && (
          <aside className="map-panel" aria-label="Bài học đang chọn">
            <div className="map-panel-head">
              <a className="btn" href={'#' + selected}><Icon name="external" size={16} />Mở toàn trang</a>
              <button className="icon-btn" type="button" aria-label="Đóng bài" onClick={() => select(null)}><Icon name="close" /></button>
            </div>
            <div className="main-inner"><TopicArticle id={selected} compact /></div>
          </aside>
        )}
      </div>
    </ReactFlowProvider>
  );
}
