'use client';

import { EditorView } from '@codemirror/view';
import { memo, RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ProgrammingLanguageType } from '@/lib/constants';

import { CodeEditor } from './code-editor';
import { Card, CardContent } from './ui/card';

const PureCodeReview = ({
  initialCode,
  languageType,
  editorRef,
  review,
}: {
  initialCode: string;
  languageType: ProgrammingLanguageType;
  editorRef: RefObject<EditorView | null>;
  review: string | null;
}) => {
  return (
    <div className="flex flex-row flex-1 p-3 gap-3 overflow-y-auto">
      <Card className="flex-1 h-full overflow-y-auto">
        <CardContent>
          <CodeEditor languageType={languageType} content={initialCode} editorRef={editorRef} />
        </CardContent>
      </Card>

      <Card className="flex-1 h-full overflow-y-auto">
        <CardContent data-testid="review-content">
          {review ? (
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{review}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-500">Submit code to see feedback.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const CodeReview = memo(PureCodeReview);
