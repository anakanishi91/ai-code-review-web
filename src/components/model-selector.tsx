'use client';

import { Dispatch, SetStateAction, startTransition, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChatModelId, chatModels, LOCAL_STORAGE_KEY_CHAT_MODEL_ID } from '@/lib/constants';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

export function ModelSelector({
  modelId,
  setModelId,
  className,
}: {
  modelId: string;
  setModelId: Dispatch<SetStateAction<ChatModelId>>;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);

  const chatModel = useMemo(() => chatModels.find((model) => model.id === modelId), [modelId]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button data-testid="model-selector" variant="outline" className="md:px-2 md:h-[34px]">
          {chatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {chatModels.map((chatModel) => {
          const { id } = chatModel;

          return (
            <DropdownMenuItem
              data-testid={`model-selector-item-${id}`}
              key={id}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  localStorage.setItem(LOCAL_STORAGE_KEY_CHAT_MODEL_ID, id);
                  setModelId(id);
                });
              }}
              data-active={id === modelId}
              asChild
            >
              <button
                type="button"
                className="gap-4 group/item flex flex-row justify-between items-center w-full"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div>{chatModel.name}</div>
                  <div className="text-xs text-muted-foreground">{chatModel.description}</div>
                </div>

                <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                  <CheckCircleFillIcon />
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
