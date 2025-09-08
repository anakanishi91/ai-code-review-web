import { redirect } from 'next/navigation';

import { Review } from '@/components/review';
import { generateUUID } from '@/lib/utils';

import { auth } from '../(auth)/auth';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();

  return (
    <Review
      key={id}
      initialCode=""
      initialReview={null}
      initialChatModelId={null}
      initialLanguageType={null}
    />
  );
}
