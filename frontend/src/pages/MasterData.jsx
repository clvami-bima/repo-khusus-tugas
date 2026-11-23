import { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import DataTable from '../components/DataTable';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'departments', label: 'Departemen', singular: 'departemen' },
  { key: 'positions', label: 'Jabatan', singular: 'jabatan' },
];

const EMPTY_FORM = { name: '', description: '', status: 'active' };

function MasterSection({ resource, singular, isAdmin }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function fetchRows() {
    setLoading(true);
    api
      .get(`/${resource}`)
      .then((res) => setRows(res.data))
      .catch(() => setError(`Gagal memuat data ${singular}.`))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  function openForm(row) {
    setError('');
    setForm(
      row
        ? { name: row.name, description: row.description || '', status: row.status }
        : EMPTY_FORM
    );
    setEditing(row || {});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing.id) {
        await api.put(`/${resource}/${editing.id}`, form);
      } else {
        await api.post(`/${resource}`, form);
      }
      setEditing(null);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.message || `Gagal menyimpan ${singular}.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Hapus ${singular} "${row.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setError('');
    try {
      await api.delete(`/${resource}/${row.id}`);
      fetchRows();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Gagal menghapus ${singular}. Mungkin masih dipakai data lain.`
      );
    }
  }

  const columns = [
    { key: 'name', header: 'Nama' },
    { key: 'description', header: 'Deskripsi', render: (r) => r.description || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {r.status === 'active' ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
  ];

  if (isAdmin) {
    columns.push({
      key: 'actions',
      header: 'Aksi',
      render: (r) => (
        <div className="flex gap-3">
          <button onClick={() => openForm(r)} className="text-accent hover:underline text-sm font-medium">
            Ubah
          </button>
          <button onClick={() => handleDelete(r)} className="text-danger hover:underline text-sm font-medium">
            Hapus
          </button>
        </div>
      ),
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{rows.length} data</p>
        {isAdmin && (
          <button
            onClick={() => openForm(null)}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            + Tambah {singular}
          </button>
        )}
      </div>

      {error && !editing && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <DataTable columns={columns} rows={rows} loading={loading} emptyMessage={`Belum ada data ${singular}.`} />

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {editing.id ? 'Ubah' : 'Tambah'} {singular}
            </h2>

            {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nama</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Deskripsi</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function MasterData() {
  const { user } = useAuth();
  const [tab, setTab] = useState(TABS[0]);
  const isAdmin = user?.role === 'admin';

  return (
    <DashboardLayout title="Data Master">
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
              tab.key === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <MasterSection key={tab.key} resource={tab.key} singular={tab.singular} isAdmin={isAdmin} />
    </DashboardLayout>
  );
}