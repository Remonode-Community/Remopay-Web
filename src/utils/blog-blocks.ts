/**
 * Blog Content Block utilities
 * Factories, validation and metadata for the JSON block schema.
 * Shared by the public renderer and the admin block editor.
 */

import type {
  ContentBlock,
  ContentBlockData,
  ContentBlockType,
} from '@/types/blog.types';

export const BLOCK_TYPES: ContentBlockType[] = [
  'heading',
  'paragraph',
  'list',
  'quote',
  'code',
  'table',
  'image',
  'video',
  'callout',
  'link',
  'divider',
];

export const BLOCK_TYPE_LABELS: Record<ContentBlockType, string> = {
  heading: 'Heading',
  paragraph: 'Paragraph',
  list: 'List',
  quote: 'Quote',
  code: 'Code',
  table: 'Table',
  image: 'Image',
  video: 'Video',
  callout: 'Callout',
  link: 'Link',
  divider: 'Divider',
};

/** Create a fresh, valid block for a given type with sensible defaults. */
export function createEmptyBlock(type: ContentBlockType): ContentBlock {
  switch (type) {
    case 'heading':
      return { type, data: { level: 2, text: '' } };
    case 'paragraph':
      return { type, data: { text: '' } };
    case 'list':
      return { type, data: { style: 'unordered', items: [''] } };
    case 'quote':
      return { type, data: { text: '', caption: '' } };
    case 'code':
      return { type, data: { code: '', language: '' } };
    case 'table':
      return { type, data: { columns: [''], rows: [['']] } };
    case 'image':
      return { type, data: { url: '', alt: '', caption: '' } };
    case 'video':
      return { type, data: { url: '', caption: '' } };
    case 'callout':
      return { type, data: { type: 'info', text: '' } };
    case 'link':
      return { type, data: { text: '', url: '' } };
    case 'divider':
      return { type, data: {} };
    default:
      return { type: 'paragraph', data: { text: '' } };
  }
}

const ALLOWED_TYPES = new Set<ContentBlockType>(BLOCK_TYPES);
const ALLOWED_CALLOUT_TYPES = new Set(['info', 'warning', 'success', 'danger']);
const ALLOWED_LIST_STYLES = new Set(['ordered', 'unordered']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Validate the data object for a single block. Returns human-readable messages. */
export function validateBlock(block: ContentBlock): string[] {
  const errors: string[] = [];
  const { type, data } = block;

  if (!ALLOWED_TYPES.has(type)) {
    return [`Unknown block type "${String(type)}".`];
  }
  if (!isRecord(data)) {
    return [`"${type}" block must have a data object.`];
  }

  const requireString = (key: string, label: string): void => {
    if (typeof data[key] !== 'string' || (data[key] as string).trim() === '') {
      errors.push(`"${type}" block: ${label} is required.`);
    }
  };

  switch (type) {
    case 'heading': {
      if (typeof data.level !== 'number' || data.level < 1 || data.level > 6) {
        errors.push(`"heading" block: level must be between 1 and 6.`);
      }
      requireString('text', 'text');
      break;
    }
    case 'paragraph':
      requireString('text', 'text');
      break;
    case 'list': {
      if (typeof data.style !== 'string' || !ALLOWED_LIST_STYLES.has(data.style as never)) {
        errors.push(`"list" block: style must be "ordered" or "unordered".`);
      }
      if (!Array.isArray(data.items) || data.items.length === 0) {
        errors.push(`"list" block: items are required.`);
      }
      break;
    }
    case 'quote':
      requireString('text', 'text');
      break;
    case 'code':
      requireString('code', 'code');
      break;
    case 'table': {
      if (!Array.isArray(data.columns)) {
        errors.push(`"table" block: columns are required.`);
      }
      if (!Array.isArray(data.rows)) {
        errors.push(`"table" block: rows are required.`);
      }
      break;
    }
    case 'image':
    case 'video': {
      if (!isValidHttpUrl(data.url)) {
        errors.push(`"${type}" block: url must be a valid http(s) URL.`);
      }
      break;
    }
    case 'callout': {
      if (typeof data.type !== 'string' || !ALLOWED_CALLOUT_TYPES.has(data.type as never)) {
        errors.push(`"callout" block: type must be info, warning, success or danger.`);
      }
      requireString('text', 'text');
      break;
    }
    case 'link': {
      requireString('text', 'text');
      if (!isValidHttpUrl(data.url)) {
        errors.push(`"link" block: url must be a valid http(s) URL.`);
      }
      break;
    }
    case 'divider':
      break;
    default:
      break;
  }

  return errors;
}

/** Validate a full blocks array. Returns a flat list of messages. */
export function validateContentBlocks(blocks: ContentBlock[]): string[] {
  if (!Array.isArray(blocks)) return ['Content must be an array of blocks.'];
  const errors: string[] = [];
  blocks.forEach((block, index) => {
    const blockErrors = validateBlock(block);
    blockErrors.forEach((message) => errors.push(`Block ${index + 1}: ${message}`));
  });
  return errors;
}

/** Ensure `data` exists for every block (defensive normalisation before submit). */
export function normalizeBlocks(blocks: ContentBlock[]): ContentBlock[] {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b) => b && typeof b === 'object')
    .map((b) => {
      if (b.data && typeof b.data === 'object') return b;
      return { type: b.type, data: createEmptyBlock(b.type).data as ContentBlockData };
    });
}
