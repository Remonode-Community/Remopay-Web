'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { blogService } from '@/services/blog.service';
import { useUIStore } from '@/store/ui.store';
import type { BlogTag } from '@/types/blog.types';

interface TagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  tag?: BlogTag | null;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

const EMPTY: FormState = { name: '', slug: '', description: '', is_active: true };

export function TagFormModal({ isOpen, onClose, onSaved, tag }: TagFormModalProps) {
  const { addToast } = useUIStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setForm(
        tag
          ? {
              name: tag.name || '',
              slug: tag.slug || '',
              description: tag.description || '',
              is_active: tag.is_active,
            }
          : EMPTY
      );
    }
  }, [isOpen, tag]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        is_active: form.is_active,
      };
      if (tag) {
        await blogService.updateTag(tag.id, payload);
        addToast({ type: 'success', message: 'Tag updated successfully.' });
      } else {
        await blogService.createTag(payload);
        addToast({ type: 'success', message: 'Tag created successfully.' });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const details = err?.errors?.details || err?.errors;
      setError(
        details?.name?.[0] || details?.slug?.[0] || err?.message || 'Failed to save tag.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tag ? 'Edit Tag' : 'Create Tag'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            {tag ? 'Save Changes' : 'Create Tag'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Savings"
          />
          <Input
            label="Slug (optional)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="savings"
            helperText="Auto-generated from name if empty."
          />
        </div>

        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Optional description."
        />

        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-[#d71927] focus:ring-[#d71927]"
          />
          Active
        </label>
      </div>
    </Modal>
  );
}
