'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Minus,
} from 'lucide-react';
import { supportService } from '@/services/support.service';
import { useUIStore } from '@/store/ui.store';
import { clsx } from 'clsx';

interface SupportWysiwygProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function SupportWysiwyg({
  value,
  onChange,
  placeholder = 'Describe your issue in detail...',
  minHeight = '200px',
}: SupportWysiwygProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addToast } = useUIStore();

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const run = useCallback((command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, onChange]);

  const emitChange = useCallback(() => {
    onChange(editorRef.current?.innerHTML || '');
  }, [onChange]);

  const insertLink = useCallback(() => {
    const url = window.prompt('Enter link URL (https://...)');
    if (url && url.trim()) {
      const normalized = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
      run('createLink', normalized);
    }
  }, [run]);

  const insertImage = useCallback(
    async (file: File) => {
      try {
        const res = await supportService.uploadAttachment(file);
        if (res.success && res.data?.attachment_url) {
          const img = `<img src="${res.data.attachment_url}" alt="" loading="lazy" decoding="async" style="max-width:100%;border-radius:8px;margin:8px 0" />`;
          editorRef.current?.focus();
          document.execCommand('insertHTML', false, img);
          emitChange();
          addToast({ type: 'success', message: 'Image inserted.' });
        } else {
          addToast({ type: 'error', message: res.message || 'Image upload failed.' });
        }
      } catch {
        addToast({ type: 'error', message: 'Image upload failed.' });
      }
    },
    [addToast, emitChange]
  );

  const ToolbarButton = ({
    onClick,
    title,
    active = false,
    children,
  }: {
    onClick: () => void;
    title: string;
    active?: boolean;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={clsx(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
        active ? 'bg-[#d71927] text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition focus-within:border-[#d71927]/40 focus-within:ring-2 focus-within:ring-[#d71927]/10">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50/80 px-2 py-1.5">
        <ToolbarButton onClick={() => run('bold')} title="Bold (Ctrl+B)">
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('italic')} title="Italic (Ctrl+I)">
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('underline')} title="Underline (Ctrl+U)">
          <Underline size={14} />
        </ToolbarButton>

        <span className="mx-0.5 h-4 w-px bg-gray-200" />

        <ToolbarButton onClick={() => run('insertUnorderedList')} title="Bulleted list">
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('insertOrderedList')} title="Numbered list">
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('formatBlock', '<blockquote>')} title="Quote">
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('formatBlock', '<pre>')} title="Code block">
          <Code size={14} />
        </ToolbarButton>

        <span className="mx-0.5 h-4 w-px bg-gray-200" />

        <ToolbarButton onClick={insertLink} title="Insert link">
          <LinkIcon size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => fileRef.current?.click()} title="Insert image">
          <ImageIcon size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('insertHorizontalRule')} title="Divider">
          <Minus size={14} />
        </ToolbarButton>

        <span className="mx-0.5 h-4 w-px bg-gray-200" />

        <ToolbarButton onClick={() => run('undo')} title="Undo">
          <Undo2 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('redo')} title="Redo">
          <Redo2 size={14} />
        </ToolbarButton>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className="support-editor min-h-[200px] px-4 py-3 text-sm leading-relaxed text-gray-900 focus:outline-none [&[data-placeholder]:empty]:before:text-gray-400 [&[data-placeholder]:empty]:before:content-[attr(data-placeholder)]"
        style={{ minHeight }}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) insertImage(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
