'use client';

import { useRouter } from 'next/navigation';
import { Dispatch, memo, SetStateAction } from 'react';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { ChatModelId, ProgrammingLanguageType } from '@/lib/constants';

import { PlusIcon } from './icons';
import { ProgrammingLanguageSelector } from './programming-language-selector';
import { useSidebar } from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

function PureReviewHeader({
  modelId,
  setModelId,
  languageType,
  setLanguageType,
  sendCode,
  isReady,
}: {
  modelId: string;
  setModelId: Dispatch<SetStateAction<ChatModelId>>;
  languageType: ProgrammingLanguageType;
  setLanguageType: Dispatch<SetStateAction<ProgrammingLanguageType>>;
  sendCode: () => void;
  isReady: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex flex-wrap sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-1 md:px-2 px-2 md:h-fit md:ml-0"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New</TooltipContent>
        </Tooltip>
      )}

      <ModelSelector modelId={modelId} setModelId={setModelId} className="order-2" />

      <ProgrammingLanguageSelector
        languageType={languageType}
        setLanguageType={setLanguageType}
        className="order-3"
      />

      <Button
        data-testid="send-button"
        className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 flex py-1.5 px-2 h-fit md:h-[34px] order-4 md:ml-auto"
        onClick={sendCode}
        disabled={!isReady}
      >
        Submit Code
      </Button>
    </header>
  );
}

export const ReviewHeader = memo(PureReviewHeader, (prevProps, nextProps) => {
  return (
    prevProps.modelId === nextProps.modelId &&
    prevProps.languageType === nextProps.languageType &&
    prevProps.sendCode === nextProps.sendCode &&
    prevProps.isReady === nextProps.isReady
  );
});
