'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import { useUIStore } from '@/store/ui.store';
import type {
  AdminPostPayload,
  ArticleStatus,
  BlogCategory,
  BlogPost,
  BlogPostListItem,
  BlogTag,
  ContentBlock,
} from '@/types/blog.types';
import { validateContentBlocks, normalizeBlocks } from '@/utils/blog-blocks';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Card, CardHeader, CardBody } from '@/components/shared/Card';
import { BlockEditor } from './BlockEditor';
import { ImageUploader } from './ImageUploader';

interface BlogPostFormProps {
  mode: 'create' | 'edit';
  postId?: number;
  initial?: BlogPost | null;
}

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function BlogPostForm({ mode, postId, initial }: BlogPostFormProps) {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ArticleStatus>('draft');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [newsletterEligible, setNewsletterEligible] = useState(false);
  const [content, setContent] = useState<ContentBlock[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [relatedPostIds, setRelatedPostIds] = useState<number[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogMeta, setOgMeta] = useState('');
  const [twitterMeta, setTwitterMeta] = useState('');

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostListItem[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingMeta(true);
      try {
        const [catRes, tagRes, relRes] = await Promise.all([
          blogService.listCategories({}, 1, 100),
          blogService.listTags({}, 1, 100),
          blogService.listPosts({ status: 'published', sort: 'newest' }, 1, 50),
        ]);
        if (cancelled) return;
        setCategories(catRes.data?.items || []);
        setTags(tagRes.data?.items || []);
        setRelatedPosts(relRes.data?.items || []);
      } catch {
        // Non-critical metadata load failure
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '');
      setSlug(initial.slug || '');
      setSummary(initial.summary || '');
      setCoverImage(initial.cover_image || null);
      setFeaturedImage(initial.featured_image || null);
      setStatus(initial.status || 'draft');
      setScheduledFor(toDatetimeLocal(initial.scheduled_for));
      setIsFeatured(initial.is_featured || false);
      setNewsletterEligible(initial.newsletter_eligible || false);
      setContent(Array.isArray(initial.content) ? initial.content : []);
      setCategoryIds(initial.category_ids || initial.categories?.map((c) => c.id) || []);
      setTagIds(initial.tag_ids || initial.tags?.map((t) => t.id) || []);
      setRelatedPostIds(initial.related_post_ids || []);
      setSeoTitle(initial.seo_title || '');
      setSeoDescription(initial.seo_description || '');
      setSeoKeywords((initial.seo_keywords || []).join(', '));
      setCanonicalUrl(initial.canonical_url || '');
      setOgMeta(initial.og_meta ? JSON.stringify(initial.og_meta, null, 2) : '');
      setTwitterMeta(initial.twitter_meta ? JSON.stringify(initial.twitter_meta, null, 2) : '');
    }
  }, [initial]);

  const toggleId = (list: number[], id: number): number[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const buildPayload = (): { payload: AdminPostPayload; error?: string } => {
    if (!title.trim()) return { payload: {} as AdminPostPayload, error: 'Title is required.' };
    const blocks = normalizeBlocks(content);
    const blockErrors = validateContentBlocks(blocks);
    if (blockErrors.length > 0) {
      return { payload: {} as AdminPostPayload, error: blockErrors[0] };
    }
    if (status === 'scheduled' && !scheduledFor) {
      return { payload: {} as AdminPostPayload, error: 'A scheduled time is required for scheduled posts.' };
    }

    let parsedOg: Record<string, unknown> | null = null;
    let parsedTwitter: Record<string, unknown> | null = null;
    if (ogMeta.trim()) {
      try {
        parsedOg = JSON.parse(ogMeta);
      } catch {
        return { payload: {} as AdminPostPayload, error: 'Open Graph meta must be valid JSON.' };
      }
    }
    if (twitterMeta.trim()) {
      try {
        parsedTwitter = JSON.parse(twitterMeta);
      } catch {
        return { payload: {} as AdminPostPayload, error: 'Twitter meta must be valid JSON.' };
      }
    }

    return {
      payload: {
        title: title.trim(),
        slug: slug.trim() || undefined,
        summary: summary.trim() || null,
        content: blocks,
        cover_image: coverImage,
        featured_image: featuredImage,
        is_featured: isFeatured,
        status,
        scheduled_for:
          status === 'scheduled' && scheduledFor ? new Date(scheduledFor).toISOString() : null,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        seo_keywords:
          seoKeywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean) || null,
        canonical_url: canonicalUrl.trim() || null,
        og_meta: parsedOg,
        twitter_meta: parsedTwitter,
        newsletter_eligible: newsletterEligible,
        category_ids: categoryIds,
        tag_ids: tagIds,
        related_post_ids: relatedPostIds,
      },
    };
  };

  const handleSave = async () => {
    const { payload, error: payloadError } = buildPayload();
    if (payloadError) {
      setError(payloadError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (mode === 'edit' && postId) {
        await blogService.updatePost(postId, payload);
        addToast({ type: 'success', message: 'Post updated successfully.' });
      } else {
        await blogService.createPost(payload);
        addToast({ type: 'success', message: 'Post created successfully.' });
      }
      router.push('/admin/blog/posts');
      router.refresh();
    } catch (err: any) {
      const details = err?.errors?.details || err?.errors;
      setError(
        details?.title?.[0] ||
          details?.slug?.[0] ||
          details?.content?.[0] ||
          details?.scheduled_for?.[0] ||
          err?.message ||
          'Failed to save post.'
      );
    } finally {
      setSaving(false);
    }
  };

  const saveAndPublish = async () => {
    const { payload, error: payloadError } = buildPayload();
    if (payloadError) {
      setError(payloadError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let id = postId;
      if (mode === 'edit' && postId) {
        await blogService.updatePost(postId, { ...payload, status: 'draft' });
      } else {
        const created = await blogService.createPost({ ...payload, status: 'draft' });
        id = created.data?.post?.id;
      }
      if (id) {
        await blogService.publishPost(id);
        addToast({ type: 'success', message: 'Post created and published.' });
        router.push('/admin/blog/posts');
        router.refresh();
      }
    } catch (err: any) {
      const details = err?.errors?.details || err?.errors;
      setError(
        details?.title?.[0] ||
          details?.slug?.[0] ||
          details?.content?.[0] ||
          err?.message ||
          'Failed to publish post.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#d71927]"
        >
          <ArrowLeft size={16} /> Back to posts
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSave} isLoading={saving}>
            <Save size={16} /> Save {mode === 'edit' ? 'Changes' : 'Draft'}
          </Button>
          <Button onClick={saveAndPublish} isLoading={saving} disabled={status === 'scheduled'}>
            Save & Publish
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-bold text-gray-900">Article details</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="How to Buy Airtime"
              />
              <Input
                label="Slug (optional)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="how-to-buy-airtime"
                helperText="Auto-generated from title if empty."
              />
              <Input
                label="Summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A short excerpt shown on cards and in search results."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUploader label="Cover image" value={coverImage} onChange={setCoverImage} type="cover" />
                <ImageUploader label="Featured image" value={featuredImage} onChange={setFeaturedImage} type="cover" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-bold text-gray-900">Content</h3>
            </CardHeader>
            <CardBody>
              <BlockEditor value={content} onChange={setContent} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-bold text-gray-900">SEO</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input label="SEO title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              <Input
                label="SEO description"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
              <Input
                label="SEO keywords (comma separated)"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="airtime, data, savings"
              />
              <Input
                label="Canonical URL (optional)"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://remopay.com/blog/how-to-buy-airtime"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-600">
                    Open Graph meta (JSON)
                  </span>
                  <textarea
                    value={ogMeta}
                    onChange={(e) => setOgMeta(e.target.value)}
                    rows={4}
                    placeholder='{"image": "https://..."}'
                    className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-600">
                    Twitter meta (JSON)
                  </span>
                  <textarea
                    value={twitterMeta}
                    onChange={(e) => setTwitterMeta(e.target.value)}
                    rows={4}
                    placeholder='{"card": "summary_large_image"}'
                    className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
                  />
                </label>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-bold text-gray-900">Publishing</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-600">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              {status === 'scheduled' && (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-600">
                    Scheduled for
                  </span>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
                  />
                </label>
              )}

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#d71927] focus:ring-[#d71927]"
                />
                Featured post
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={newsletterEligible}
                  onChange={(e) => setNewsletterEligible(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#d71927] focus:ring-[#d71927]"
                />
                Eligible for newsletter
              </label>
            </CardBody>
          </Card>

          {!loadingMeta && (
            <>
              <Card>
                <CardHeader>
                  <h3 className="font-bold text-gray-900">Categories</h3>
                </CardHeader>
                <CardBody>
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No categories yet.{' '}
                      <a href="/admin/blog/categories" className="font-semibold text-[#d71927]">
                        Create one
                      </a>
                    </p>
                  ) : (
                    <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={categoryIds.includes(category.id)}
                            onChange={() => setCategoryIds(toggleId(categoryIds, category.id))}
                            className="h-4 w-4 rounded border-gray-300 text-[#d71927] focus:ring-[#d71927]"
                          />
                          {category.name}
                        </label>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-bold text-gray-900">Tags</h3>
                </CardHeader>
                <CardBody>
                  {tags.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No tags yet.{' '}
                      <a href="/admin/blog/tags" className="font-semibold text-[#d71927]">
                        Create one
                      </a>
                    </p>
                  ) : (
                    <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                      {tags.map((tag) => (
                        <label
                          key={tag.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={tagIds.includes(tag.id)}
                            onChange={() => setTagIds(toggleId(tagIds, tag.id))}
                            className="h-4 w-4 rounded border-gray-300 text-[#d71927] focus:ring-[#d71927]"
                          />
                          #{tag.name}
                        </label>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-bold text-gray-900">Related posts</h3>
                </CardHeader>
                <CardBody>
                  {relatedPosts.length === 0 ? (
                    <p className="text-sm text-gray-500">No published posts to relate yet.</p>
                  ) : (
                    <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                      {relatedPosts.map((post) => (
                        <label
                          key={post.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={relatedPostIds.includes(post.id)}
                            onChange={() => setRelatedPostIds(toggleId(relatedPostIds, post.id))}
                            className="h-4 w-4 rounded border-gray-300 text-[#d71927] focus:ring-[#d71927]"
                          />
                          <span className="truncate">{post.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
