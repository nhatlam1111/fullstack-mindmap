import { CONTENT_LABEL, type Topic } from '../content';
import { STATUS_LABEL, type DisplayStatus } from '../store/hooks';

export function LearnChip({ status }: { status: DisplayStatus }) {
  return <span className="chip" data-tone={status === 'none' ? 'outline' : status}>{STATUS_LABEL[status]}</span>;
}

export function ContentChip({ topic }: { topic: Topic }) {
  return <span className="chip" data-tone={topic.contentStatus}>{CONTENT_LABEL[topic.contentStatus]}</span>;
}

export function StatusDot({ status, content }: { status: DisplayStatus; content?: Topic['contentStatus'] }) {
  return <span className="dot" data-status={status} data-content={content} title={STATUS_LABEL[status]} />;
}
