'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Send } from 'lucide-react';
import { newsletterService } from '@/services/newsletter.service';
import { blogService } from '@/services/blog.service';
import { adminService } from '@/services/admin.service';
import { useUIStore } from '@/store/ui.store';
import type { NewsletterAudienceType, NewsletterCampaign } from '@/types/newsletter.types';
import type { AdminUser } from '@/types/api.types';
import type { BlogPost } from '@/types/blog.types';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Card, CardHeader, CardBody } from '@/components/shared/Card';

const AUDIENCE_OPTIONS: { value: NewsletterAudienceType; label: string }[] = [
  { value: 'all_users', label: 'All registered users' },
  { value: 'selected_users', label: 'Select specific users' },
  { value: 'all_subscribers', label: 'All newsletter subscribers' },
  { value: 'segment', label: 'Dynamic segment (criteria)' },
];

export function NewsletterCreateForm() {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [blogPostId, setBlogPostId] = useState<number | ''>('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [audienceType, setAudienceType] = useState<NewsletterAudienceType>('all_subscribers');
  const [audienceIds, setAudienceIds] = useState<number[]>([]);
  const [segmentCriteria, setSegmentCriteria] = useState('');

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [targetPreview, setTargetPreview] = useState<Array<Record<string, unknown>>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingMeta(true);
      try {
        const [postsRes, usersRes] = await Promise.all([
          blogService.listPosts({ status: 'published', sort: 'newest' }, 1, 50),
          adminService.getUsers(1, 50),
        ]);
        if (cancelled) return;
        setPosts(postsRes.data?.items || []);
        const userData = (usersRes.data as any)?.data || (usersRes.data as any)?.users || [];
        setUsers(Array.isArray(userData) ? userData : []);
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = users.filter((user) => {
    const q = userSearch.toLowerCase();
    return (
      !q ||
      user.first_name?.toLowerCase().includes(q) ||
      user.last_name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q)
    );
  });

  const toggleUser = (id: number) =>
    setAudienceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const selectedPost = posts.find((p) => p.id === blogPostId);

  const calculateTargets = async () => {
    setCalcLoading(true);
    setError(null);
    try {
      const res = await newsletterService.calculateTargets({
        audience_type: audienceType,
        audience_ids: audienceType === 'selected_users' ? audienceIds : undefined,
        segment_criteria:
          audienceType === 'segment' && segmentCriteria.trim()
            ? (JSON.parse(segmentCriteria) as Record<string, unknown>)
            : undefined,
      });
      if (res.success) {
        setTargetCount(res.data?.total_recipients ?? 0);
        setTargetPreview(res.data?.preview || []);
        addToast({ type: 'info', message: `${res.data?.total_recipients ?? 0} recipients in audience.` });
      } else {
        setError(res.message || 'Could not calculate audience.');
      }
    } catch (err: any) {
      if (audienceType === 'segment' && segmentCriteria.trim()) {
        setError('Segment criteria must be valid JSON.');
      } else {
        setError(err?.message || 'Could not calculate audience.');
      }
    } finally {
      setCalcLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!blogPostId) {
      setError('Please select an article for the campaign.');
      return;
    }
    if (audienceType === 'selected_users' && audienceIds.length === 0) {
      setError('Please select at least one recipient.');
      return;
    }
    if (audienceType === 'segment') {
      try {
        JSON.parse(segmentCriteria || '{}');
      } catch {
        setError('Segment criteria must be valid JSON.');
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const res = await newsletterService.createNewsletter({
        blog_post_id: blogPostId,
        subject: subject.trim() || undefined,
        preview_text: previewText.trim() || undefined,
        template: 'article',
        audience_type: audienceType,
        audience_ids: audienceType === 'selected_users' ? audienceIds : undefined,
        segment_criteria:
          audienceType === 'segment' && segmentCriteria.trim()
            ? (JSON.parse(segmentCriteria) as Record<string, unknown>)
            : undefined,
      });
      const campaign = (res.data as unknown as { campaign?: NewsletterCampaign })?.campaign;
      addToast({ type: 'success', message: 'Campaign created as draft.' });
      router.push(`/admin/blog/newsletter/${campaign?.id || res.data?.campaign?.id}`);
      router.refresh();
    } catch (err: any) {
      const details = err?.errors?.details || err?.errors;
      setError(
        details?.blog_post_id?.[0] ||
          details?.audience_type?.[0] ||
          err?.message ||
          'Failed to create campaign.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#d71927]"
      >
        <ArrowLeft size={16} /> Back to campaigns
      </button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">Campaign details</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">
              Article <span className="text-red-600">*</span>
            </span>
            <select
              value={blogPostId}
              onChange={(e) => setBlogPostId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
            >
              <option value="">Select a published article…</option>
              {posts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                  {post.newsletter_sent_at ? ' (already sent)' : ''}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-gray-400">
              Only published, newsletter-eligible articles that have never been sent can be used.
            </span>
          </label>

          {selectedPost?.newsletter_sent_at && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              This article has already been sent via newsletter and cannot be used again.
            </div>
          )}

          <Input
            label="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={selectedPost?.title || 'Defaults to article title'}
          />
          <Input
            label="Preview text (optional)"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="A short summary shown in the email preview."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-bold text-gray-900">
            <Users size={16} className="text-[#d71927]" /> Audience
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Audience type</span>
            <select
              value={audienceType}
              onChange={(e) => {
                setAudienceType(e.target.value as NewsletterAudienceType);
                setTargetCount(null);
                setTargetPreview([]);
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {audienceType === 'selected_users' && (
            <div>
              <Input
                label="Filter users"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email"
              />
              <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                {filteredUsers.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">No users found.</p>
                ) : (
                  filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={audienceIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="h-4 w-4 rounded border-gray-300 text-[#d71927] focus:ring-[#d71927]"
                      />
                      <span className="font-medium">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="ml-auto truncate text-xs text-gray-500">{user.email}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">{audienceIds.length} selected</p>
            </div>
          )}

          {audienceType === 'segment' && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">
                Segment criteria (JSON)
              </span>
              <textarea
                value={segmentCriteria}
                onChange={(e) => setSegmentCriteria(e.target.value)}
                rows={4}
                placeholder='{"loyalty_tier_id": 2}'
                className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
              />
            </label>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={calculateTargets} isLoading={calcLoading} disabled={loadingMeta}>
              Preview audience size
            </Button>
            {targetCount !== null && (
              <span className="rounded-lg bg-[#d71927]/10 px-3 py-1.5 text-sm font-bold text-[#b91420]">
                {targetCount.toLocaleString()} recipients
              </span>
            )}
          </div>

          {targetPreview.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Preview recipients
              </p>
              <ul className="space-y-1 text-sm text-gray-700">
                {targetPreview.slice(0, 10).map((recipient, i) => (
                  <li key={i}>{(recipient as any).email || (recipient as any).name || JSON.stringify(recipient)}</li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleCreate} isLoading={saving}>
          <Send size={16} /> Create Campaign
        </Button>
      </div>
    </div>
  );
}
