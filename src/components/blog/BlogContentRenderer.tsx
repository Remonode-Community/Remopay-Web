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

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/** Render a single content block to JSX (server-safe), using the shared class contract. */
function renderBlock(block: ContentBlock, index: number): React.ReactNode {
  const key = `${block.type}-${index}`;

  switch (block.type) {
    case 'heading': {
      const data = block.data as HeadingBlockData;
      const level = Math.min(Math.max(data.level ?? 2, 1), 6);
      const Tag = `h${level}` as HeadingTag;
      return (
        <Tag key={key} className={`block-heading block-heading--h${level}`}>
          {data.text || ''}
        </Tag>
      );
    }

    case 'paragraph': {
      const data = block.data as ParagraphBlockData;
      return (
        <p key={key} className="block-paragraph">
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
          className={`block-list ${
            data.style === 'ordered' ? 'block-list--ordered' : 'block-list--unordered'
          }`}
        >
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ListTag>
      );
    }

    case 'quote': {
      const data = block.data as QuoteBlockData;
      return (
        <blockquote key={key} className="block-quote">
          <p>{data.text || ''}</p>
          {data.caption && <footer>{data.caption}</footer>}
        </blockquote>
      );
    }

    case 'code': {
      const data = block.data as CodeBlockData;
      return (
        <pre key={key} className="block-code">
          <code className={data.language ? `language-${data.language}` : ''}>
            {data.code || ''}
          </code>
        </pre>
      );
    }

    case 'table': {
      const data = block.data as TableBlockData;
      const columns = Array.isArray(data.columns) ? data.columns : [];
      const rows = Array.isArray(data.rows) ? data.rows : [];
      return (
        <div key={key} className="block-table-wrapper">
          <table className="block-table">
            {columns.length > 0 && (
              <thead>
                <tr>
                  {columns.map((col, i) => (
                    <th key={i}>{col}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {Array.isArray(row)
                    ? row.map((cell, c) => <td key={c}>{cell}</td>)
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
        <figure key={key} className="block-image">
          <img
            src={data.url}
            alt={data.alt || ''}
            loading="lazy"
            decoding="async"
          />
          {data.caption && <figcaption>{data.caption}</figcaption>}
        </figure>
      );
    }

    case 'video': {
      const data = block.data as VideoBlockData;
      if (!data.url) return null;
      return (
        <figure key={key} className="block-video">
          <div className="video-embed">
            <iframe src={data.url} title={data.caption || 'Embedded video'} allowFullScreen />
          </div>
          {data.caption && <figcaption>{data.caption}</figcaption>}
        </figure>
      );
    }

    case 'callout': {
      const data = block.data as CalloutBlockData;
      return (
        <div
          key={key}
          className={`block-callout block-callout--${data.type || 'info'}`}
        >
          <p>{data.text || ''}</p>
        </div>
      );
    }

    case 'link': {
      const data = block.data as LinkBlockData;
      return (
        <p key={key} className="block-link">
          <a href={data.url} target="_blank" rel="noopener noreferrer">
            {data.text || data.url}
          </a>
        </p>
      );
    }

    case 'divider':
      return <hr key={key} className="block-divider" />;

    default:
      return null;
  }
}

interface BlogContentRendererProps {
  blocks: ContentBlock[];
  className?: string;
}

/**
 * Renders a JSON array of content blocks (server-safe, no client hooks).
 * Emits the shared `.blog-content` / `.block-*` class contract so the
 * stylesheet in globals.css (section 5 of the rendering guide) applies.
 */
export function BlogContentRenderer({ blocks, className }: BlogContentRendererProps) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return (
      <p className="text-gray-500">This article does not have any content yet.</p>
    );
  }

  return (
    <div className={className}>
      <div className="blog-content">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>
    </div>
  );
}
