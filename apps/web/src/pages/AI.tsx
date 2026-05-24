import { useState } from 'react';
import { ai } from '@/lib/api';
import { Sparkles, FileText, UserCheck, Send, Loader2, ThumbsUp } from 'lucide-react';

export default function AIPage() {
  const [conversationId, setConversationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [action, setAction] = useState<'draft' | 'summarize' | 'extract' | 'followup'>('draft');

  const handleAction = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      let data;
      switch (action) {
        case 'draft':
          data = await ai.draft({ conversationId, tone: 'professional' });
          setResult({ type: 'draft', ...data });
          break;
        case 'summarize':
          data = await ai.summarize({ conversationId });
          setResult({ type: 'summary', ...data });
          break;
        case 'extract':
          data = await ai.extractLead({ conversationId });
          setResult({ type: 'extract', ...data });
          break;
        case 'followup':
          data = await ai.followUp({ conversationId });
          setResult({ type: 'followup', ...data });
          break;
      }
    } catch (err: any) {
      setResult({ type: 'error', message: err.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Copilot</h1>
      <p className="text-gray-500 mb-6">Draft replies, summarize conversations, extract leads</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Conversation ID</label>
            <input
              type="text"
              className="input"
              placeholder="Enter conversation ID"
              value={conversationId}
              onChange={(e) => setConversationId(e.target.value)}
            />
          </div>

          <div className="card p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Choose action</p>
            {[
              { key: 'draft' as const, label: 'Draft Reply', icon: Send },
              { key: 'summarize' as const, label: 'Summarize', icon: FileText },
              { key: 'extract' as const, label: 'Extract Lead', icon: UserCheck },
              { key: 'followup' as const, label: 'Follow-up', icon: Sparkles },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setAction(opt.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  action === opt.key ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}

            <button
              onClick={handleAction}
              disabled={loading || !conversationId}
              className="btn-primary w-full mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-6 min-h-[300px]">
            {!result && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Sparkles className="w-12 h-12 mb-3" />
                <p>Select an action and conversation to get AI assistance</p>
              </div>
            )}

            {result?.type === 'error' && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">{result.message}</div>
            )}

            {result?.type === 'draft' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">AI Draft Reply</h3>
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full">
                    Confidence: {Math.round(result.confidence * 100)}%
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap mb-3">
                  {result.draft}
                </div>
                <button className="btn-secondary text-sm">
                  <ThumbsUp className="w-4 h-4 mr-1" /> Approve & Use
                </button>
              </div>
            )}

            {result?.type === 'summary' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Conversation Summary</h3>
                <p className="text-gray-800 mb-4">{result.summary}</p>
                {result.keyPoints?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Key Points</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {result.keyPoints.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4 inline-flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Sentiment:</span>
                  <span className={`font-medium ${
                    result.sentiment === 'positive' ? 'text-green-600' :
                    result.sentiment === 'negative' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {result.sentiment}
                  </span>
                </div>
              </div>
            )}

            {result?.type === 'extract' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Extracted Lead Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(result).filter(([k]) => k !== 'type').map(([key, value]) => (
                    value && (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase">{key}</p>
                        <p className="text-gray-900 font-medium">{String(value)}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {result?.type === 'followup' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Suggested Follow-up</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap">
                  {result.followUp}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
