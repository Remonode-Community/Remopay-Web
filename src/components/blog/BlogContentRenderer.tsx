import React from 'react';
import type {
  ContentBlock,
  CalloutBlockData,
  CodeBlockData,
  HeadingBlockData,
  ImageBlockData,
  LinkBlockData,
  ListBlockData,
  ParagraphBlockData,
  QuoteBlockData,
  TableBlockData,
  VideoBlockData,
} from '@/types/blog.types';
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const CALLOUT_STYLES: Record<
  CalloutBlockData['type'],
  { wrapper: string; icon: React.ReactNode; label: string }
> = {
  info: {
    wrapper: 'border-blue-200 bg-blue-50 text-blue-900',
    icon: <Info className="h-5 w-5 shrink-0 text-blue-600" />,
    label: 'Info',
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />,
    label: 'Warning',
  },
  success: {
    wrapper: 'border-green-200 bg-green-50 text-green-900',
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />,
    label: 'Success',
  },
  danger: {
    wrapper: 'border-red-200 bg-red-50 text-red-900',
    icon: <XCircle className="h-5 w-5 shrink-0 text-red-600" />,
    label: 'Danger',
  },
};

/** Render a single content block to JSX (server-safe). */
function renderBlock(block: ContentBlock, index: number): React.ReactNode {
  const key = `${block.type}-${index}`;

  switch (block.type) {
    case 'heading': {
      const data = block.data as HeadingBlockData;
      const level = data.level ?? 2;
      const Tag = `h${Math.min(Math.max(level, 1), 6)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return (
        <Tag
          key={key}
          className="scroll-mt-24 font-bold tracking-tight text-gray-900"
          style={{ fontSize: headingSize(level) }}
        >
          {data.text || ''}
        </Tag>
      );
    }

    case 'paragraph': {
      const data = block.data as ParagraphBlockData;
      return (
        <p key={key} className="text-base leading-7 text-gray-700">
          {data.text || ''}
        </p>
      );
    }

    case 'list': {
      const data = block.data as ListBlockData;
      const items = Array.isArray(data.items) ? data.items : [];
      const ListTag = data.style === 'ordered' ? 'ol' : 'ul';
      return (
        <ListTag
          key={key}
          className={
            data.style === 'ordered'
              ? 'list-decimal space-y-2 pl-6 text-gray-700'
              : 'list-disc space-y-2 pl-6 text-gray-700'
          }
        >
          {items.map((item, i) => (
            <li key={i} className="leading-7">
              {item}
            </li>
          ))}
        </ListTag>
      );
    }

    case 'quote': {
      const data = block.data as QuoteBlockData;
      return (
        <blockquote
          key={key}
          className="border-l-4 border-[#d71927] bg-gray-50 px-5 py-4 text-gray-800"
        >
          <p className="text-lg italic leading-7">{data.text || ''}</p>
          {data.caption && (
            <footer className="mt-2 text-sm font-semibold text-gray-500">
              — {data.caption}
            </footer>
          )}
        </blockquote>
      );
    }

    case 'code': {
      const data = block.data as CodeBlockData;
      return (
        <pre
          key={key}
          className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm leading-6 text-gray-100"
        >
          <code>{data.code || ''}</code>
          {data.language && (
            <span className="mt-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              {data.language}
            </span>
          )}
        </pre>
      );
    }

    case 'table': {
      const data = block.data as TableBlockData;
      const columns = Array.isArray(data.columns) ? data.columns : [];
      const rows = Array.isArray(data.rows) ? data.rows : [];
      return (
        <div key={key} className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {columns.map((col, i) => (
                  <th key={i} className="px-4 py-3 font-semibold text-gray-700">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r} className="border-b border-gray-100 last:border-0">
                  {Array.isArray(row)
                    ? row.map((cell, c) => (
                        <td key={c} className="px-4 py-3 text-gray-700">
                          {cell}
                        </td>
                      ))
                    : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'image': {
      const data = block.data as ImageBlockData;
      if (!data.url) return null;
      return (
        <figure key={key} className="space-y-2">
          <img
            src={data.url}
            alt={data.alt || ''}
            className="mx-auto w-full max-w-2xl rounded-lg object-cover"
            loading="lazy"
          />
          {data.caption && (
            <figcaption className="text-center text-sm text-gray-500">
              {data.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'video': {
      const data = block.data as VideoBlockData;
      if (!data.url) return null;
      return (
        <figure key={key} className="space-y-2">
          <video
            src={data.url}
            controls
            className="mx-auto w-full max-w-2xl rounded-lg"
          />
          {data.caption && (
            <figcaption className="text-center text-sm text-gray-500">
              {data.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'callout': {
      const data = block.data as CalloutBlockData;
      const style = CALLOUT_STYLES[data.type] || CALLOUT_STYLES.info;
      return (
        <div
          key={key}
          className={`flex items-start gap-3 rounded-lg border p-4 ${style.wrapper}`}
        >
          {style.icon}
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">{style.label}</p>
            <p className="mt-1 text-sm leading-6">{data.text || ''}</p>
          </div>
        </div>
      );
    }

    case 'link': {
      const data = block.data as LinkBlockData;
      return (
        <p key={key}>
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#d71927] underline underline-offset-4 hover:text-[#b91420]"
          >
            {data.text || data.url}
          </a>
        </p>
      );
    }

    case 'divider':
      return <hr key={key} className="border-gray-200" />;

    default:
      return null;
  }
}

function headingSize(level: number): string {
  switch (level) {
    case 1:
      return '2.25rem';
    case 2:
      return '1.875rem';
    case 3:
      return '1.5rem';
    case 4:
      return '1.25rem';
    case 5:
      return '1.125rem';
    default:
      return '1rem';
  }
}

interface BlogContentRendererProps {
  blocks: ContentBlock[];
  className?: string;
}

/** Renders a JSON array of content blocks (server-safe, no client hooks). */
export function BlogContentRenderer({ blocks, className }: BlogContentRendererProps) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return (
      <p className="text-gray-500">This article does not have any content yet.</p>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-5">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>
    </div>
  );
}
