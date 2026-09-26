import React, { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useApp } from '../context/AppContext'
import { SupportedLanguage } from '../lib/types'
import { MAX_CODE_LENGTH } from '../lib/constants'

// Map our language names to Monaco language IDs
const languageMap: Record<SupportedLanguage, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  java: 'java',
  go: 'go',
  rust: 'rust',
  cpp: 'cpp',
  c: 'c',
  csharp: 'csharp',
  php: 'php',
  ruby: 'ruby',
  kotlin: 'kotlin',
}

const CodeEditor: React.FC = () => {
  const { state, dispatch } = useApp()
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const decorationsRef = useRef<string[]>([])
  const [isFocused, setIsFocused] = useState(false)

  const lineCount = state.editorContent ? state.editorContent.split('\n').length : 1
  const charCount = state.editorContent ? state.editorContent.length : 0
  const isNearLimit = charCount > MAX_CODE_LENGTH * 0.9

  // Dynamically adapt Monaco editor theme with dark/light mode toggle
  const editorTheme = state.isDark ? 'vs-dark' : 'light'

  // Update editor language when selectedLanguage changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        monacoRef.current.editor.setModelLanguage(
          model,
          languageMap[state.selectedLanguage] || 'python'
        )
      }
    }
  }, [state.selectedLanguage])

  // Update editor theme when state.isDark changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(editorTheme)
    }
  }, [editorTheme])

  // Handle line decorations for review issues
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const monaco = monacoRef.current
    const editor = editorRef.current

    if (!state.reviewResult?.issues || state.reviewResult.issues.length === 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [])
      return
    }

    const newDecorations = state.reviewResult.issues.map((issue) => {
      const line = Math.max(1, issue.line)
      return {
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: `issue-line-highlight issue-line-${issue.severity.toLowerCase()}`,
          glyphMarginClassName: `issue-glyph issue-glyph-${issue.severity.toLowerCase()}`,
          overviewRuler: {
            color: getSeverityColor(issue.severity),
            position: monaco.editor?.OverviewRulerLane?.Left || 1,
          },
          minimap: {
            color: getSeverityColor(issue.severity),
            position: 1,
          },
          hoverMessage: {
            value: `**[${issue.severity}]** ${issue.message}\n\n*Suggestion:* ${issue.suggestion}`,
          },
        },
      }
    })

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations)
  }, [state.reviewResult])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return '#EF4444'
      case 'High':
        return '#F59E0B'
      case 'Medium':
        return '#EAB308'
      case 'Low':
        return '#3B82F6'
      case 'Info':
        return '#06B6D4'
      default:
        return '#6B7280'
    }
  }

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco

    editor.onDidFocusEditorText(() => setIsFocused(true))
    editor.onDidBlurEditorText(() => setIsFocused(false))

    // Set initial language and theme
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(
        model,
        languageMap[state.selectedLanguage] || 'python'
      )
    }
    monaco.editor.setTheme(editorTheme)
  }

  const handleEditorChange = (value: string | undefined) => {
    dispatch({
      type: 'SET_EDITOR_CONTENT',
      payload: value || '',
    })
  }

  return (
    <section
      aria-label="Code Editor"
      className={`flex-1 flex flex-col bg-card border rounded-xl overflow-hidden transition-all duration-200 ${
        isFocused ? 'border-accent/60 ring-2 ring-accent/10 shadow-md' : 'border-border'
      }`}
    >
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-elevated border-b border-border text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold uppercase tracking-wider text-[11px]">
            {state.selectedLanguage}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">{lineCount} lines</span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`transition-colors duration-150 ${
              isNearLimit ? 'text-amber-500 font-semibold' : 'text-muted-foreground'
            }`}
          >
            {charCount.toLocaleString()} / {MAX_CODE_LENGTH.toLocaleString()} chars
          </span>
          {isNearLimit && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 animate-pulse">
              Near Limit
            </span>
          )}
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full h-full min-h-[350px] relative">
        <Editor
          height="100%"
          language={languageMap[state.selectedLanguage] || 'python'}
          value={state.editorContent}
          theme={editorTheme}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            readOnly: false,
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            minimap: { enabled: true },
            wordWrap: 'off',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'all',
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            tabSize: 4,
            automaticLayout: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
              <span className="animate-pulse">Loading Editor...</span>
            </div>
          }
        />
      </div>
    </section>
  )
}

export default CodeEditor