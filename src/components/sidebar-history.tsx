'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { motion } from 'motion/react';
import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWRInfinite from 'swr/infinite';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { Review } from '@/lib/schemas/review';
import { fetcher } from '@/lib/utils';

import { LoaderIcon } from './icons';
import { ReviewItem } from './sidebar-history-item';

type GroupedReviews = {
  today: Review[];
  yesterday: Review[];
  lastWeek: Review[];
  lastMonth: Review[];
  older: Review[];
};

export interface ReviewHistory {
  reviews: Array<Review>;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

const groupReviewsByDate = (reviews: Review[]): GroupedReviews => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return reviews.reduce(
    (groups, review) => {
      const reviewDate = new Date(review.createdAt);

      if (isToday(reviewDate)) {
        groups.today.push(review);
      } else if (isYesterday(reviewDate)) {
        groups.yesterday.push(review);
      } else if (reviewDate > oneWeekAgo) {
        groups.lastWeek.push(review);
      } else if (reviewDate > oneMonthAgo) {
        groups.lastMonth.push(review);
      } else {
        groups.older.push(review);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedReviews,
  );
};

export function getReviewHistoryPaginationKey(pageIndex: number, previousPageData: ReviewHistory) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) return `/api/history?limit=${PAGE_SIZE}`;

  const firstReviewFromPage = previousPageData.reviews.at(-1);

  if (!firstReviewFromPage) return null;

  return `/api/history?ending_before=${firstReviewFromPage.id}&limit=${PAGE_SIZE}`;
}

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();

  const {
    data: paginatedReviewHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ReviewHistory>(getReviewHistoryPaginationKey, fetcher, {
    fallbackData: [],
  });

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasReachedEnd = paginatedReviewHistories
    ? paginatedReviewHistories.some((page) => page.hasMore === false)
    : false;

  const hasEmptyReviewHistory = paginatedReviewHistories
    ? paginatedReviewHistories.every((page) => page.reviews.length === 0)
    : false;

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/review?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting review...',
      success: () => {
        mutate((reviewHistories) => {
          if (reviewHistories) {
            return reviewHistories.map((reviewHistory) => ({
              ...reviewHistory,
              reviews: reviewHistory.reviews.filter((review) => review.id !== deleteId),
            }));
          }
        });

        return 'Review deleted successfully';
      },
      error: 'Failed to delete review',
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/');
    }
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous reviews!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">Today</div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                data-testid="loading-skeleton"
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyReviewHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here once you start review!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {paginatedReviewHistories &&
              (() => {
                const reviewsFromHistory = paginatedReviewHistories.flatMap(
                  (paginatedReviewHistory) => paginatedReviewHistory.reviews,
                );

                const groupedReviews = groupReviewsByDate(reviewsFromHistory);

                return (
                  <div className="flex flex-col gap-6">
                    {groupedReviews.today.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">Today</div>
                        {groupedReviews.today.map((review) => (
                          <ReviewItem
                            key={review.id}
                            review={review}
                            isActive={review.id === id}
                            onDelete={(reviewId) => {
                              setDeleteId(reviewId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedReviews.yesterday.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Yesterday
                        </div>
                        {groupedReviews.yesterday.map((review) => (
                          <ReviewItem
                            key={review.id}
                            review={review}
                            isActive={review.id === id}
                            onDelete={(reviewId) => {
                              setDeleteId(reviewId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedReviews.lastWeek.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Last 7 days
                        </div>
                        {groupedReviews.lastWeek.map((review) => (
                          <ReviewItem
                            key={review.id}
                            review={review}
                            isActive={review.id === id}
                            onDelete={(reviewId) => {
                              setDeleteId(reviewId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedReviews.lastMonth.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Last 30 days
                        </div>
                        {groupedReviews.lastMonth.map((review) => (
                          <ReviewItem
                            key={review.id}
                            review={review}
                            isActive={review.id === id}
                            onDelete={(reviewId) => {
                              setDeleteId(reviewId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedReviews.older.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Older than last month
                        </div>
                        {groupedReviews.older.map((review) => (
                          <ReviewItem
                            key={review.id}
                            review={review}
                            isActive={review.id === id}
                            onDelete={(reviewId) => {
                              setDeleteId(reviewId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isValidating && !hasReachedEnd) {
                setSize((size) => size + 1);
              }
            }}
          />

          {hasReachedEnd ? (
            <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2 mt-8">
              You have reached the end of your review history.
            </div>
          ) : (
            <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center mt-8">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div>Loading Reviews...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your review and remove it
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
