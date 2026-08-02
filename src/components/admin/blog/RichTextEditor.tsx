'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Text,
} from 'lucide-react';
import { blogService } from '@/services/blog.service';
import { useUIStore } from '@/store/ui.store';
import { clsx } from 'clsx';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

/**
 * Classic WYSIWYG HTML editor (contentEditable + document.execCommand).
 * Outputs raw sanitized-by-backend HTML — exactly what the blog API expects.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing your article…',
  minHeight = '360px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addToast } = useUIStore();

  // Sync initial value (and external resets) into the editable area.
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

  const handleInput = useCallback(() => {
    emitChange();
  }, [emitChange]);

  const insertLink = useCallback(() => {
    const url = window.prompt('Enter link URL (https://…)');
    if (url && url.trim()) {
      const normalized = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
      run('createLink', normalized);
    }
  }, [run]);

  const insertImage = useCallback(
    async (file: File) => {
      try {
        const res = await blogService.uploadImage(file, 'inline');
        if (res.success && res.data?.image_url) {
          const img = `<img src="${res.data.image_url}" alt="" loading="lazy" decoding="async" />`;
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

  const formatBlock = useCallback((tag: string) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    emitChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, onChange]);

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
        'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        active ? 'bg-[#d71927] text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <ToolbarButton onClick={() => formatBlock('<p>')} title="Paragraph">
          <Text size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => formatBlock('<h1>')} title="Heading 1">
          <Heading1 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => formatBlock('<h2>')} title="Heading 2">
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => formatBlock('<h3>')} title="Heading 3">
          <Heading3 size={15} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton onClick={() => run('bold')} title="Bold (Ctrl+B)">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('italic')} title="Italic (Ctrl+I)">
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('underline')} title="Underline (Ctrl+U)">
          <Underline size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('strikeThrough')} title="Strikethrough">
          <Strikethrough size={15} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton onClick={() => run('insertUnorderedList')} title="Bulleted list">
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('insertOrderedList')} title="Numbered list">
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => formatBlock('<blockquote>')} title="Quote">
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => formatBlock('<pre>')} title="Code block">
          <Code size={15} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton onClick={insertLink} title="Insert link">
          <LinkIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => fileRef.current?.click()}
          title="Insert image"
        >
          <ImageIcon size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('insertHorizontalRule')} title="Divider">
          <Minus size={15} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton onClick={() => run('justifyLeft')} title="Align left">
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('justifyCenter')} title="Align center">
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('justifyRight')} title="Align right">
          <AlignRight size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('justifyFull')} title="Justify">
          <AlignJustify size={15} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton onClick={() => run('undo')} title="Undo">
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => run('redo')} title="Redo">
          <Redo2 size={15} />
        </ToolbarButton>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className="blog-content focus:outline-none"
        style={{ minHeight, padding: '16px 20px', cursor: 'text' }}
      />

      {/* Hidden file input for inline image upload */}
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
