import { useEffect, useState } from 'react';
import { contacts } from '@/lib/api';
import { Users, Search, Phone, Tag } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  tags: string[];
  leadScore: number;
  lastMessageAt: string;
}

export default function ContactsPage() {
  const [list, setList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    contacts.list(params.toString())
      .then((data) => setList(data.contacts))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500">Your WhatsApp customer database</p>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search contacts..."
          className="input pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-gray-500">Loading contacts...</div>
      ) : list.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No contacts yet</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 font-medium text-gray-600">Lead Score</th>
                <th className="px-4 py-3 font-medium text-gray-600">Tags</th>
                <th className="px-4 py-3 font-medium text-gray-600">Last Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phoneNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.leadScore > 70 ? 'bg-green-100 text-green-700' :
                      c.leadScore > 40 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {c.leadScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.map((t) => (
                        <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
