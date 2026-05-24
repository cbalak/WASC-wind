import { useEffect, useState } from 'react';
import { analytics } from '@/lib/api';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analytics.dashboard(), analytics.team()])
      .then(([dash, teamData]) => {
        setData(dash);
        setTeam(teamData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading analytics...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Analytics</h1>
      <p className="text-gray-500 mb-6">WhatsApp performance and team insights</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-500">Total Contacts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data?.current?.totalContacts ?? 0}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">Conversations</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data?.current?.totalConversations ?? 0}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-500">AI Actions (30d)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data?.current?.aiUsage ?? 0}</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Team Performance</h3>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 font-medium text-gray-600">Agent</th>
              <th className="px-4 py-2 font-medium text-gray-600">Role</th>
              <th className="px-4 py-2 font-medium text-gray-600">Assigned Convos</th>
              <th className="px-4 py-2 font-medium text-gray-600">Messages Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {team.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-2 text-gray-500 capitalize">{u.role}</td>
                <td className="px-4 py-2 text-gray-700">{u._count?.assignedConvos ?? 0}</td>
                <td className="px-4 py-2 text-gray-700">{u.messagesSent ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
