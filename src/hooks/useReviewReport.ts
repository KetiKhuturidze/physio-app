import { useState } from 'react';

import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';
import { ReportOutcome, ReviewReportReason } from 'src/types';

// Add in Supabase SQL editor:
//   create table if not exists review_reports (
//     id uuid primary key default gen_random_uuid(),
//     review_id uuid not null references reviews(id) on delete cascade,
//     reporter_id uuid not null references users(id) on delete cascade,
//     reason text not null,
//     created_at timestamptz not null default now(),
//     unique (review_id, reporter_id)
//   );
//   alter table review_reports enable row level security;
//   create policy "Users can report reviews" on review_reports
//     for insert with check (reporter_id = auth.uid());
//   create policy "Users can see their own reports" on review_reports
//     for select using (reporter_id = auth.uid());

type UseReviewReportResult = {
  submitting: boolean;
  reportReview: (reviewId: string, reason: ReviewReportReason) => Promise<ReportOutcome>;
};

const DUPLICATE_ERROR_CODE = '23505';

export function useReviewReport(): UseReviewReportResult {
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  async function reportReview(
    reviewId: string,
    reason: ReviewReportReason
  ): Promise<ReportOutcome> {
    if (!user) return 'error';

    setSubmitting(true);
    const { error } = await supabase
      .from('review_reports')
      .insert({ review_id: reviewId, reporter_id: user.id, reason });
    setSubmitting(false);

    if (error) {
      return error.code === DUPLICATE_ERROR_CODE ? 'duplicate' : 'error';
    }
    return 'ok';
  }

  return { submitting, reportReview };
}
