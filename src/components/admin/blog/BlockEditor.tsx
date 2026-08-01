'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Type,
} from 'lucide-react';
import type {
  CalloutBlockData,
  CodeBlockData,
  ContentBlock,
  ContentBlockType,
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
  BLOCK_TYPE_LABELS,
  BLOCK_TYPES,
  createEmptyBlock,
  validateBlock,
} from '@/utils/blog-blocks';
import { BlogContentRenderer } from '@/components/blog/BlogContentRenderer';
import { ImageUploader } from './ImageUploader';

interface BlockEditorProps {
  value: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface BlockEditorItemProps {
  block: ContentBlock;
  index: number;
  total: number;
  onUpdateData: (patch: Record<string, unknown>) => void;
  onMove: (from: number, to: number) => void;
  onDelete: (index: number) => void;
}

function BlockEditorItem({
  block,
  index,
  total,
  onUpdateData,
  onMove,
  onDelete,
}: BlockEditorItemProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const errors = validateBlock(block);
  const data = block.data as Record<string, unknown>;

  const renderEditor = () => {
    switch (block.type) {
      case 'heading': {
        const d = data as unknown as HeadingBlockData;
        return (
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <SelectInput
              label="Level"
              value={String(d.level ?? 2)}
              onChange={(v) => onUpdateData({ level: Number(v) })}
              options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Heading ${n}` }))}
            />
            <TextInput
              label="Text"
              value={d.text ?? ''}
              onChange={(v) => onUpdateData({ text: v })}
              placeholder="Heading text"
            />
          </div>
        );
      }
      case 'paragraph': {
        const d = data as unknown as ParagraphBlockData;
        return (
          <TextArea
            label="Text"
            value={d.text ?? ''}
            onChange={(v) => onUpdateData({ text: v })}
            placeholder="Write your paragraph..."
            rows={4}
          />
        );
      }
      case 'list': {
        const d = data as unknown as ListBlockData;
        const items = Array.isArray(d.items) ? d.items : [];
        return (
          <div className="space-y-3">
            <SelectInput
              label="Style"
              value={d.style ?? 'unordered'}
              onChange={(v) => onUpdateData({ style: v })}
              options={[
                { value: 'unordered', label: 'Bullet list' },
                { value: 'ordered', label: 'Numbered list' },
              ]}
            />
            <TextArea
              label="Items (one per line)"
              value={items.join('\n')}
              onChange={(v) => onUpdateData({ items: v.split('\n') })}
              rows={Math.max(3, items.length)}
            />
          </div>
        );
      }
      case 'quote': {
        const d = data as unknown as QuoteBlockData;
        return (
          <div className="space-y-3">
            <TextArea label="Quote" value={d.text ?? ''} onChange={(v) => onUpdateData({ text: v })} rows={3} />
            <TextInput label="Caption (author)" value={d.caption ?? ''} onChange={(v) => onUpdateData({ caption: v })} />
          </div>
        );
      }
      case 'code': {
        const d = data as unknown as CodeBlockData;
        return (
          <div className="space-y-3">
            <TextInput label="Language" value={d.language ?? ''} onChange={(v) => onUpdateData({ language: v })} placeholder="php, js, bash..." />
            <TextArea label="Code" value={d.code ?? ''} onChange={(v) => onUpdateData({ code: v })} rows={6} />
          </div>
        );
      }
      case 'table': {
        const d = data as unknown as TableBlockData;
        const columns = Array.isArray(d.columns) ? d.columns : [];
        const rows = Array.isArray(d.rows) ? d.rows : [];
        const columnsText = columns.join('\n');
        const rowsText = rows.map((row) => (Array.isArray(row) ? row.join('|') : '')).join('\n');
        return (
          <div className="space-y-3">
            <TextArea
              label="Columns (one per line)"
              value={columnsText}
              onChange={(v) => onUpdateData({ columns: v.split('\n') })}
              rows={Math.max(2, columns.length)}
            />
            <TextArea
              label="Rows (one per line, separate cells with |)"
              value={rowsText}
              onChange={(v) =>
                onUpdateData({
                  rows: v
                    .split('\n')
                    .filter((line) => line.trim() !== '')
                    .map((line) => line.split('|')),
                })
              }
              rows={Math.max(3, rows.length)}
            />
          </div>
        );
      }
      case 'image': {
        const d = data as unknown as ImageBlockData;
        return (
          <div className="space-y-3">
            <ImageUploader
              value={d.url || null}
              onChange={(url) => onUpdateData({ url })}
              label="Image"
              type="inline"
              aspect="aspect-video"
            />
            <TextInput label="Alt text" value={d.alt ?? ''} onChange={(v) => onUpdateData({ alt: v })} />
            <TextInput label="Caption" value={d.caption ?? ''} onChange={(v) => onUpdateData({ caption: v })} />
          </div>
        );
      }
      case 'video': {
        const d = data as unknown as VideoBlockData;
        return (
          <div className="space-y-3">
            <TextInput label="Video URL" value={d.url ?? ''} onChange={(v) => onUpdateData({ url: v })} placeholder="https://..." />
            <TextInput label="Caption" value={d.caption ?? ''} onChange={(v) => onUpdateData({ caption: v })} />
          </div>
        );
      }
      case 'callout': {
        const d = data as unknown as CalloutBlockData;
        return (
          <div className="space-y-3">
            <SelectInput
              label="Type"
              value={d.type ?? 'info'}
              onChange={(v) => onUpdateData({ type: v })}
              options={[
                { value: 'info', label: 'Info' },
                { value: 'warning', label: 'Warning' },
                { value: 'success', label: 'Success' },
                { value: 'danger', label: 'Danger' },
              ]}
            />
            <TextArea label="Text" value={d.text ?? ''} onChange={(v) => onUpdateData({ text: v })} rows={3} />
          </div>
        );
      }
      case 'link': {
        const d = data as unknown as LinkBlockData;
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput label="Text" value={d.text ?? ''} onChange={(v) => onUpdateData({ text: v })} placeholder="Read more" />
            <TextInput label="URL" value={d.url ?? ''} onChange={(v) => onUpdateData({ url: v })} placeholder="https://..." />
          </div>
        );
      }
      case 'divider':
        return <p className="text-xs text-gray-500">A horizontal divider. No settings needed.</p>;
      default:
        return null;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Block header */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
          <Type size={13} className="text-[#d71927]" />
          {BLOCK_TYPE_LABELS[block.type] || block.type}
          <span className="text-gray-300">#{index + 1}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="rounded p-1 text-gray-500 transition hover:bg-gray-200 disabled:opacity-30"
            aria-label="Move up"
          >
            <ChevronUp size={15} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            className="rounded p-1 text-gray-500 transition hover:bg-gray-200 disabled:opacity-30"
            aria-label="Move down"
          >
            <ChevronDown size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(index)}
            className="rounded p-1 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Delete block"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Block editor */}
      <div className="space-y-3 p-4">{renderEditor()}</div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2">
          {errors.map((error, i) => (
            <p key={i} className="flex items-center gap-1.5 text-xs font-medium text-red-700">
              <AlertCircle size={13} /> {error}
            </p>
          ))}
        </div>
      )}

      {/* Toggle preview */}
      <div className="border-t border-gray-100">
        <button
          type="button"
          onClick={() => setPreviewOpen((open) => !open)}
          className="w-full bg-white px-4 py-2 text-left text-xs font-bold text-gray-500 transition hover:text-[#d71927]"
        >
          {previewOpen ? '▲ Hide preview' : '▼ Show preview'}
        </button>
        {previewOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-4">
            <BlogContentRenderer blocks={[block]} />
          </div>
        )}
      </div>
    </div>
  );
}

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  const [addingType, setAddingType] = useState<ContentBlockType | ''>('');

  const updateBlock = (index: number, patch: Record<string, unknown>) => {
    const next = value.map((block, i) =>
      i === index ? { ...block, data: { ...(block.data as object), ...patch } } : block
    );
    onChange(next);
  };

  const moveBlock = (from: number, to: number) => {
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const deleteBlock = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addBlock = () => {
    if (!addingType) return;
    onChange([...value, createEmptyBlock(addingType)]);
    setAddingType('');
  };

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
          No content blocks yet. Add your first block below.
        </div>
      ) : (
        value.map((block, index) => (
          <BlockEditorItem
            key={index}
            block={block}
            index={index}
            total={value.length}
            onUpdateData={(patch) => updateBlock(index, patch)}
            onMove={moveBlock}
            onDelete={deleteBlock}
          />
        ))
      )}

      {/* Add block toolbar */}
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white p-3">
        <select
          value={addingType}
          onChange={(e) => setAddingType(e.target.value as ContentBlockType)}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
          aria-label="Select block type"
        >
          <option value="">Add a block…</option>
          {BLOCK_TYPES.map((type) => (
            <option key={type} value={type}>
              {BLOCK_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addBlock}
          disabled={!addingType}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#d71927] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#b91420] disabled:opacity-50"
        >
          <Plus size={15} /> Add
        </button>
      </div>
    </div>
  );
}
