import { useEffect, useState } from 'react';
import { conversations } from '@/lib/api';
import { Inbox, Filter, Search, MessageSquare } from 'lucide-react';

interface Convo {
  id: string;
  status: string;
  priority: string;
  unreadCount: number;
  lastMessageAt: string;
  contact: { name: string; phoneNumber: string; leadScore: number };
  assignee?: { name: string };
  revenueOpportunity: boolean;
  supportRisk: boolean;
}

export default function InboxPage() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (filter) params.set('search', filter);
    conversations.list(params.toString())
      .then((data) => setConvos(data.conversations))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, filter]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      waiting: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-gray-100 text-gray-700',
      closed: 'bg-gray-100 text-gray-500',
      escalated: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const priorityBadge = (p: string) => {
    const map: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      critical: 'bg-red-100 text-red-600',
    };
    return map[p] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-500">Manage all WhatsApp conversations</p>
        </div>
        <div className="flex gap-2">
          <select
            className="input py-1 text-sm w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="waiting">Waiting</option>
            <option value="escalated">Escalated</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by contact name or phone..."
          className="input pl-9"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-gray-500">Loading conversations...</div>
      ) : convos.length === 0 ? (
        <div className="card p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No conversations found</p>
          <p className="text-sm text-gray-400">Install the Chrome extension to start capturing WhatsApp chats</p>
        </div>
      ) : (
        <div className="space-y-2">
          {convos.map((convo) => (
            <a
              key={convo.id}
              href={`/inbox`}
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold">
                {convo.contact.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">{convo.contact.name}</span>
                  {convo.unreadCount > 0 && (
                    <span className="bg-brand-600 text-white text-xs px-2 py-0.5 rounded-full">{convo.unreadCount}</span>
                  )}
                  {convo.revenueOpportunity && <span className="text-orange-500 text-xs font-medium">$ Opportunity</span>}
                  {convo.supportRisk && <span className="text-red-500 text-xs font-medium">! Support Risk</span>}
                </div>
                <p className="text-sm text-gray-500 truncate">{convo.contact.phoneNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(convo.status)}`}>
                  {convo.status}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityBadge(convo.priority)}`}>
                  {convo.priority}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {convo.assignee ? `Assigned to ${convo.assignee.name}` : 'Unassigned'}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
