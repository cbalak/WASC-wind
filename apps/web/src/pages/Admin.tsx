import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import { Shield, Building2, FileText, AlertTriangle } from 'lucide-react';

export default function AdminPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tenants' | 'logs' | 'security'>('tenants');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([admin.tenants(), admin.auditLogs(), admin.securityEvents()])
      .then(([t, l, e]) => {
        setTenants(t);
        setLogs(l);
        setEvents(e);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading admin data...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Control Centre</h1>
      <p className="text-gray-500 mb-6">Manage tenants, audit logs and security</p>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'tenants' as const, label: 'Tenants', icon: Building2 },
          { key: 'logs' as const, label: 'Audit Logs', icon: FileText },
          { key: 'security' as const, label: 'Security Events', icon: AlertTriangle },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tenants' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Plan</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Users</th>
                <th className="px-4 py-3 font-medium text-gray-600">Contacts</th>
                <th className="px-4 py-3 font-medium text-gray-600">Convos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 capitalize">{t.plan}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      t.licenceStatus === 'active' ? 'bg-green-100 text-green-700' :
                      t.licenceStatus === 'trial' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {t.licenceStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">{t._count?.users ?? 0}</td>
                  <td className="px-4 py-3">{t._count?.contacts ?? 0}</td>
                  <td className="px-4 py-3">{t._count?.conversations ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="px-4 py-3 font-medium text-gray-600">Resource</th>
                <th className="px-4 py-3 font-medium text-gray-600">User</th>
                <th className="px-4 py-3 font-medium text-gray-600">Tenant</th>
                <th className="px-4 py-3 font-medium text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{l.action}</td>
                  <td className="px-4 py-3">{l.resource}</td>
                  <td className="px-4 py-3">{l.user?.email || 'System'}</td>
                  <td className="px-4 py-3">{l.tenant?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="px-4 py-3 font-medium text-gray-600">Severity</th>
                <th className="px-4 py-3 font-medium text-gray-600">Description</th>
                <th className="px-4 py-3 font-medium text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{e.eventType}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      e.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      e.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">{e.description}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(e.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
