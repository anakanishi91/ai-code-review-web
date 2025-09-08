'use client';

import { autocompletion } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import React, { memo, RefObject, useEffect, useRef } from 'react';

import { ProgrammingLanguageType } from '@/lib/constants';

const languageExtensions = {
  python: python(),
  javascript: javascript(),
};

type EditorProps = {
  content: string;
  languageType: ProgrammingLanguageType;
  editorRef: RefObject<EditorView | null>;
};

function PureCodeEditor({ content, languageType, editorRef }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = new EditorView({
        state: EditorState.create({
          doc: content,
          extensions: [
            basicSetup,
            languageExtensions[languageType],
            autocompletion(),
            EditorView.lineWrapping,
          ],
        }),
        parent: containerRef.current,
      });
    }
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // NOTE: we only want to run this effect once
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.setState(
      EditorState.create({
        doc: editorRef.current.state.doc.toString(),
        extensions: [
          basicSetup,
          languageExtensions[languageType],
          autocompletion(),
          EditorView.lineWrapping,
        ],
      }),
    );
  }, [languageType, editorRef]);

  return <div ref={containerRef} />;
}

export const CodeEditor = memo(PureCodeEditor, (prevProps, nextProps) => {
  return (
    prevProps.editorRef === nextProps.editorRef &&
    prevProps.content === nextProps.content &&
    prevProps.languageType === nextProps.languageType
  );
});
