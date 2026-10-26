import React, { useState, useEffect } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { Code2, Play, Send, Terminal, CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

interface CodeSprintEditorProps {
  challenge: ClientChallenge;
  onSubmit: (code: string, language: 'python' | 'javascript' | 'cpp' | 'java') => void;
  disabled?: boolean;
}

export const CodeSprintEditor: React.FC<CodeSprintEditorProps> = ({
  challenge,
  onSubmit,
  disabled = false
}) => {
  const [language, setLanguage] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python');
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'tests'>('editor');
  const [isRunningLocal, setIsRunningLocal] = useState<boolean>(false);
  const [localTestResults, setLocalTestResults] = useState<any[] | null>(null);

  const [languageStatus, setLanguageStatus] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/languages`)
      .then(res => res.json())
      .then(data => {
        if (data && data.languages) setLanguageStatus(data.languages);
      })
      .catch(() => {});
  }, []);

  // Initialize starter code when challenge or language changes
  useEffect(() => {
    if (challenge.starterCode && challenge.starterCode[language]) {
      setCode(challenge.starterCode[language]);
    } else {
      setCode(language === 'python' ? '# Write your algorithmic solution here\n' : '// Write your algorithmic solution here\n');
    }
  }, [challenge, language]);

  const handleRunSampleTests = async () => {
    setIsRunningLocal(true);
    setActiveTab('tests');

    try {
      const res = await fetch(`${API_BASE_URL}/api/run-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          testCases: challenge.testCases?.filter(tc => !tc.isHidden)
        })
      });
      const data = await res.json();
      setLocalTestResults(data.testResults || []);
    } catch (err) {
      console.error('Local test runner error:', err);
    } finally {
      setIsRunningLocal(false);
    }
  };

  const handleFinalSubmit = () => {
    onSubmit(code, language);
  };

  return (
    <div className="flex flex-col h-full clutch-panel rounded-2xl overflow-hidden border border-clutch-border font-sans">
      {/* Top Bar: Language Selector & Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-clutch-surface/90 border-b border-clutch-border shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-clutch-lavender" />
          <span className="font-cyber text-xs font-bold text-white hidden sm:inline">ALGORITHM SANDBOX</span>
          
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="ml-2 bg-clutch-surface-light text-clutch-lavender text-xs px-2.5 py-1 rounded-lg border border-clutch-border focus:outline-none focus:border-clutch-violet font-mono"
          >
            <option value="python">Python 3 (Native Sandbox)</option>
            <option value="javascript">JavaScript (Node.js Sandbox)</option>
            <option value="cpp">
              C++ {languageStatus.cpp?.available ? '(G++ Native)' : '(Requires G++ / Judge0)'}
            </option>
            <option value="java">
              Java {languageStatus.java?.available ? '(JDK Native)' : '(Requires JDK / Judge0)'}
            </option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${
              activeTab === 'editor'
                ? 'bg-clutch-violet/25 text-white border border-clutch-violet/40 font-bold'
                : 'text-clutch-muted hover:text-white'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${
              activeTab === 'tests'
                ? 'bg-clutch-violet/25 text-white border border-clutch-violet/40 font-bold'
                : 'text-clutch-muted hover:text-white'
            }`}
          >
            Test Output {localTestResults && `(${localTestResults.filter(r => r.passed).length}/${localTestResults.length})`}
          </button>
        </div>
      </div>

      {/* Challenge Title & Prompt Bar */}
      <div className="px-4 py-2.5 bg-clutch-surface-light/70 border-b border-clutch-border shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-cyber font-bold text-xs sm:text-sm text-white truncate">
            {challenge.title}
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30 uppercase">
            {challenge.difficulty}
          </span>
        </div>
        <p className="text-xs text-clutch-muted line-clamp-2 leading-relaxed">
          {challenge.prompt}
        </p>
      </div>

      {/* Center Viewport: Code Textarea or Test Results */}
      <div className="flex-1 min-h-0 relative bg-clutch-bg">
        {activeTab === 'editor' ? (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={disabled}
            placeholder="# Write your solution here..."
            className="w-full h-full p-4 bg-transparent text-slate-100 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none focus:ring-0 selection:bg-clutch-violet/30"
            spellCheck={false}
          />
        ) : (
          <div className="w-full h-full p-4 overflow-y-auto space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-clutch-lavender pb-2 border-b border-clutch-border text-xs font-bold">
              <Terminal className="w-4 h-4" />
              <span>ISOLATED SANDBOX EXECUTION RESULTS</span>
            </div>

            {isRunningLocal ? (
              <div className="py-8 text-center text-clutch-muted flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin text-clutch-lavender" />
                <span>Running test cases in isolated sandbox...</span>
              </div>
            ) : localTestResults ? (
              <div className="space-y-2">
                {localTestResults.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${
                      r.passed
                        ? 'bg-clutch-emerald/10 border-clutch-emerald/30 text-emerald-200'
                        : 'bg-clutch-rose/10 border-clutch-rose/30 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {r.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-clutch-emerald" />
                        ) : (
                          <XCircle className="w-4 h-4 text-clutch-rose" />
                        )}
                        <span className="font-bold">Test Case #{idx + 1}</span>
                      </div>
                      <span className="text-[10px] opacity-75 font-mono">
                        {r.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>

                    <div className="text-[11px] space-y-0.5 opacity-90 pl-6">
                      <div>Input: <code className="bg-black/30 px-1 py-0.5 rounded">{r.input}</code></div>
                      <div>Expected: <code className="bg-black/30 px-1 py-0.5 rounded">{r.expectedOutput}</code></div>
                      <div>Output: <code className="bg-black/30 px-1 py-0.5 rounded">{r.actualOutput || 'None'}</code></div>
                      {r.error && <div className="text-clutch-rose mt-1">Error: {r.error}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-clutch-subtle">
                Click "Run Sample Tests" below to compile your solution against visible test cases.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-clutch-surface/95 border-t border-clutch-border flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-20 relative">
        <button
          onClick={handleRunSampleTests}
          disabled={isRunningLocal || disabled}
          className="clutch-btn-secondary py-2.5 px-3.5 sm:px-4 min-h-[44px] text-xs flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-clutch-lavender focus-visible:outline-none"
        >
          <Play className="w-3.5 h-3.5 fill-current text-clutch-lavender" />
          <span>{isRunningLocal ? 'Testing...' : 'Run Tests'}</span>
        </button>

        <button
          onClick={handleFinalSubmit}
          disabled={disabled || !code.trim()}
          className="clutch-btn-primary py-2.5 px-4 sm:px-5 min-h-[44px] text-xs flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-clutch-lavender focus-visible:outline-none"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Submit Solution</span>
        </button>
      </div>
    </div>
  );
};
