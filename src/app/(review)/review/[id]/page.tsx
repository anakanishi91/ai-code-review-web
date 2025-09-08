import { notFound, redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Review } from '@/components/review';
import { getReviewById } from '@/lib/api/review';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const session = await auth();

  if (!session?.accessToken) {
    redirect('/api/auth/guest');
  }

  const review = await getReviewById(id, session.accessToken);

  if (!review) {
    notFound();
  }

  return (
    <Review
      key={id}
      initialCode={review.code}
      initialReview={review.review}
      initialChatModelId={review.chatModelId}
      initialLanguageType={review.programmingLanguage}
    />
  );
}
