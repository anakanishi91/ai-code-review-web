'use client';

import { Dispatch, SetStateAction, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LOCAL_STORAGE_KEY_PROGRAMMING_LANGUAGE_TYPE,
  programmingLanguages,
  ProgrammingLanguageType,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

export function ProgrammingLanguageSelector({
  className,
  languageType,
  setLanguageType,
}: {
  languageType: ProgrammingLanguageType;
  setLanguageType: Dispatch<SetStateAction<ProgrammingLanguageType>>;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);

  const language = useMemo(
    () => programmingLanguages.find((pl) => pl.id === languageType),
    [languageType],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="programmingLanguage-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {language?.label}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[300px]">
        {programmingLanguages.map((programmingLanguage) => (
          <DropdownMenuItem
            data-testid={`programmingLanguage-selector-item-${programmingLanguage.id}`}
            key={programmingLanguage.id}
            onSelect={() => {
              setLanguageType(programmingLanguage.id);
              localStorage.setItem(
                LOCAL_STORAGE_KEY_PROGRAMMING_LANGUAGE_TYPE,
                programmingLanguage.id,
              );
              setOpen(false);
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={programmingLanguage.id === languageType}
          >
            <div className="flex flex-col gap-1 items-start">
              {programmingLanguage.label}
              {programmingLanguage.description && (
                <div className="text-xs text-muted-foreground">
                  {programmingLanguage.description}
                </div>
              )}
            </div>
            <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
