import { useEffect, useState } from 'react';
import { crm } from '@/lib/api';
import { Link2, Plus, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface Conn {
  id: string;
  type: string;
  name: string;
  status: string;
  lastSyncAt: string;
  lastError: string;
}

export default function CRMPage() {
  const [connections, setConnections] = useState<Conn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'hubspot', name: '', accessToken: '' });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = () => {
    crm.list()
      .then((data) => setConnections(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleAdd = async () => {
    try {
      await crm.create({
        type: form.type,
        name: form.name,
        tokens: { accessToken: form.accessToken },
      });
      setShowAdd(false);
      setForm({ type: 'hubspot', name: '', accessToken: '' });
      loadConnections();
    } catch (err: any) {
      alert(err.data?.error || err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Sync</h1>
          <p className="text-gray-500">Connect your CRM and sync contacts automatically</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Add Connection
        </button>
      </div>

      {showAdd && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New CRM Connection</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CRM Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="hubspot">HubSpot</option>
                <option value="zoho">Zoho CRM</option>
                <option value="pipedrive">Pipedrive</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                className="input"
                placeholder="My HubSpot"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.type === 'webhook' ? 'Webhook URL' : 'Access Token / API Key'}
              </label>
              <input
                type="text"
                className="input"
                value={form.accessToken}
                onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="btn-primary">Connect</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading connections...</div>
      ) : connections.length === 0 ? (
        <div className="card p-12 text-center">
          <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No CRM connections yet</p>
          <p className="text-sm text-gray-400">Connect your CRM to sync WhatsApp contacts automatically</p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <div key={conn.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  conn.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {conn.status === 'connected' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{conn.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{conn.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleDateString() : 'Never'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  conn.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {conn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
