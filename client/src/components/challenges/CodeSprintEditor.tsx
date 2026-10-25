import React, { useState, useEffect } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { Code2, Play, Send, Terminal, CheckCircle2, XCircle, Clock } from 'lucide-react';

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

  // Initialize starter code when challenge or language changes
  useEffect(() => {
    if (challenge.starterCode && challenge.starterCode[language]) {
      setCode(challenge.starterCode[language]);
    } else {
      setCode(language === 'python' ? '# Write your solution here\n' : '// Write your solution here\n');
    }
  }, [challenge, language]);

  const handleRunSampleTests = async () => {
    setIsRunningLocal(true);
    setActiveTab('tests');

    try {
      // Call server standalone runner endpoint
      const res = await fetch('http://localhost:4000/api/run-code', {
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
    <div className="flex flex-col h-full bg-slate-950/80 border border-violet-500/30 rounded-lg overflow-hidden">
      {/* Top Bar: Language Selector & Tabs */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-violet-500/20">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span className="font-cyber text-xs font-bold text-slate-200">CODE SPRINT SANDBOX</span>
          
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="ml-3 bg-slate-800 text-cyan-300 text-xs px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-cyan-400"
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript (Node)</option>
            <option value="cpp">C++ (G++17)</option>
            <option value="java">Java 21</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === 'editor'
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1 ${
              activeTab === 'tests'
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Test Cases ({challenge.testCases?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Editor & Tests Container */}
      <div className="flex-1 relative flex flex-col min-h-0">
        {activeTab === 'editor' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Line numbers simulation */}
            <div className="w-10 bg-slate-900/50 text-slate-600 font-mono text-xs text-right pr-2 pt-3 select-none border-r border-slate-800">
              {code.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Monospace Code Textarea */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={disabled}
              spellCheck={false}
              className="flex-1 bg-transparent text-cyan-200 font-mono text-xs p-3 leading-relaxed focus:outline-none resize-none overflow-y-auto"
            />
          </div>
        ) : (
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/40">
            <div className="text-xs font-cyber text-slate-300 mb-2">VALIDATION TEST SUITE</div>
            {challenge.testCases?.map((tc, idx) => {
              const res = localTestResults?.find((r) => r.id === tc.id);
              return (
                <div
                  key={tc.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono space-y-1.5"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-white">Test Case #{idx + 1}</span>
                    {tc.isHidden ? (
                      <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-700">
                        🔒 Hidden Arena Test
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        Sample Test
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500">Input: </span>
                    <span className="text-cyan-300">{tc.input}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Expected: </span>
                    <span className="text-emerald-400">{tc.expectedOutput}</span>
                  </div>

                  {res && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-slate-400">
                        Actual: <strong className="text-white">{res.actualOutput || 'None'}</strong>
                      </span>
                      {res.passed ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400">
                          <XCircle className="w-3.5 h-3.5" /> {res.status || 'FAILED'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-t border-violet-500/20">
        <button
          onClick={handleRunSampleTests}
          disabled={isRunningLocal || disabled}
          className="cyber-btn cyber-btn-outline px-4 py-1.5 text-xs flex items-center gap-1.5"
        >
          {isRunningLocal ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
          <span>Run Sample Tests</span>
        </button>

        <button
          onClick={handleFinalSubmit}
          disabled={disabled}
          className="cyber-btn cyber-btn-cyan px-6 py-1.5 text-xs flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>SUBMIT CODE TO ARENA</span>
        </button>
      </div>
    </div>
  );
};
