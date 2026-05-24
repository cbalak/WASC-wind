import { useEffect, useState } from 'react';
import { conversations, analytics } from '@/lib/api';
import {
  Flame,
  TrendingUp,
  AlertTriangle,
  Clock,
  MessageCircle,
  Zap,
  Users,
  Target,
} from 'lucide-react';

interface DashboardStats {
  newLeads: number;
  waitingReplies: number;
  unresolved: number;
  hotOpportunities: number;
  supportFires: number;
  followUpsDue: number;
  avgHealthScore: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([conversations.dashboard(), analytics.dashboard()])
      .then(([convData, anData]) => {
        setStats(convData);
        setAnalyticsData(anData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading dashboard...</div>;
  }

  const cards = [
    { label: 'New Leads', value: stats?.newLeads ?? 0, icon: Users, color: 'bg-blue-50 text-blue-700' },
    { label: 'Hot Opportunities', value: stats?.hotOpportunities ?? 0, icon: Target, color: 'bg-orange-50 text-orange-700' },
    { label: 'Support Fires', value: stats?.supportFires ?? 0, icon: Flame, color: 'bg-red-50 text-red-700' },
    { label: 'Waiting Replies', value: stats?.waitingReplies ?? 0, icon: MessageCircle, color: 'bg-purple-50 text-purple-700' },
    { label: 'Follow-ups Due', value: stats?.followUpsDue ?? 0, icon: Clock, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Avg Health Score', value: `${stats?.avgHealthScore ?? 0}%`, icon: TrendingUp, color: 'bg-brand-50 text-brand-700' },
    { label: 'Revenue at Risk', value: analyticsData?.current?.revenueAtRisk ?? 0, icon: AlertTriangle, color: 'bg-rose-50 text-rose-700' },
    { label: 'AI Actions Saved', value: analyticsData?.thisMonth?.aiActionsSaved ?? 0, icon: Zap, color: 'bg-cyan-50 text-cyan-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-6">Your WhatsApp command centre at a glance</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">This Month Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">New leads</span>
              <span className="font-medium">{analyticsData?.thisMonth?.newLeads ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Missed leads</span>
              <span className="font-medium text-red-600">{analyticsData?.thisMonth?.missedLeads ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Deals created</span>
              <span className="font-medium">{analyticsData?.thisMonth?.dealsCreated ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">AI actions saved</span>
              <span className="font-medium">{analyticsData?.thisMonth?.aiActionsSaved ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/inbox" className="btn-primary text-center text-sm py-3">Open Inbox</a>
            <a href="/ai" className="btn-secondary text-center text-sm py-3">AI Copilot</a>
            <a href="/contacts" className="btn-secondary text-center text-sm py-3">View Contacts</a>
            <a href="/crm" className="btn-secondary text-center text-sm py-3">CRM Sync</a>
          </div>
        </div>
      </div>
    </div>
  );
}
