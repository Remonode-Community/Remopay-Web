'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { blogService } from '@/services/blog.service';
import { useUIStore } from '@/store/ui.store';
import type { BlogCategory } from '@/types/blog.types';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  category?: BlogCategory | null;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  name: '',
  slug: '',
  description: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  is_active: true,
};

export function CategoryFormModal({ isOpen, onClose, onSaved, category }: CategoryFormModalProps) {
  const { addToast } = useUIStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setForm(
        category
          ? {
              name: category.name || '',
              slug: category.slug || '',
              description: category.description || '',
              seo_title: (category.seo as any)?.title || '',
              seo_description: (category.seo as any)?.description || '',
              seo_keywords: (category.seo as any)?.keywords || '',
              is_active: category.is_active,
            }
          : EMPTY
      );
    }
  }, [isOpen, category]);

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
        seo_title: form.seo_title.trim() || undefined,
        seo_description: form.seo_description.trim() || undefined,
        seo_keywords: form.seo_keywords.trim() || undefined,
        is_active: form.is_active,
      };
      if (category) {
        await blogService.updateCategory(category.id, payload);
        addToast({ type: 'success', message: 'Category updated successfully.' });
      } else {
        await blogService.createCategory(payload);
        addToast({ type: 'success', message: 'Category created successfully.' });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const details = err?.errors?.details || err?.errors;
      setError(
        details?.name?.[0] ||
          details?.slug?.[0] ||
          err?.message ||
          'Failed to save category.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Create Category'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            {category ? 'Save Changes' : 'Create Category'}
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
            placeholder="Product Updates"
          />
          <Input
            label="Slug (optional)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="product-updates"
            helperText="Auto-generated from name if empty."
          />
        </div>

        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description of this category."
        />

        <div className="border-t border-gray-100 pt-4">
          <p className="mb-3 text-sm font-bold text-gray-700">SEO</p>
          <div className="space-y-4">
            <Input
              label="SEO Title"
              value={form.seo_title}
              onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
            />
            <Input
              label="SEO Description"
              value={form.seo_description}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
            />
            <Input
              label="SEO Keywords"
              value={form.seo_keywords}
              onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })}
              placeholder="airtime, data, savings"
            />
          </div>
        </div>

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
