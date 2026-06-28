import { useEffect, useState } from 'react';
import {
  createProfile,
  deleteProfile,
  fetchImportTemplates,
  importTrades,
  updateProfile,
} from '../services/api';
import { useProfile } from '../context/ProfileContext';

export default function SettingsPage() {
  const { profiles, activeProfileId, setActiveProfileId, refreshProfiles } = useProfile();
  const [newName, setNewName] = useState('');
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<{ id: string; label: string }[]>([]);
  const [template, setTemplate] = useState('langge');
  const [importMsg, setImportMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchImportTemplates().then(setTemplates).catch(console.error);
  }, []);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const p = await createProfile(name);
      setNewName('');
      await refreshProfiles();
      setActiveProfileId(p.id);
    } catch (e) {
      console.error(e);
      alert('创建失败，名称可能已存在');
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (id: number) => {
    const name = renameValue.trim();
    if (!name) return;
    setBusy(true);
    try {
      await updateProfile(id, name);
      setRenameId(null);
      await refreshProfiles();
    } catch (e) {
      console.error(e);
      alert('重命名失败');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId == null) return;
    setBusy(true);
    try {
      await deleteProfile(deleteId);
      setDeleteId(null);
      await refreshProfiles();
    } catch (e) {
      console.error(e);
      alert('删除失败');
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | null) => {
    if (!file || activeProfileId == null) return;
    setImportMsg('');
    setBusy(true);
    try {
      const r = await importTrades(file, template);
      setImportMsg(`导入完成：成功 ${r.success}，失败 ${r.failed}`);
    } catch (e) {
      console.error(e);
      setImportMsg('导入失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 overflow-auto">
      <h1 className="text-2xl font-bold">设置</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">档案</h2>
        <div className="flex gap-2">
          <input
            className="input input-bordered flex-1"
            placeholder="新档案名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="button" className="btn btn-primary" disabled={busy} onClick={handleCreate}>
            创建
          </button>
        </div>
        <ul className="space-y-2">
          {profiles.map((p) => (
            <li key={p.id} className="flex items-center gap-2 border border-base-300 rounded-lg p-3">
              {renameId === p.id ? (
                <>
                  <input
                    className="input input-bordered input-sm flex-1"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                  />
                  <button type="button" className="btn btn-sm" disabled={busy} onClick={() => handleRename(p.id)}>
                    保存
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setRenameId(null)}>
                    取消
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{p.name}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setRenameId(p.id);
                      setRenameValue(p.name);
                    }}
                  >
                    重命名
                  </button>
                  <button type="button" className="btn btn-sm btn-error btn-outline" onClick={() => setDeleteId(p.id)}>
                    删除
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">导入交易</h2>
        <p className="text-sm text-base-content/70">导入到当前选中的档案（导航栏切换）。</p>
        <select
          className="select select-bordered w-full max-w-xs"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="file-input file-input-bordered w-full max-w-md"
          disabled={busy || activeProfileId == null}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {importMsg ? <p className="text-sm">{importMsg}</p> : null}
      </section>

      {deleteId != null ? (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">删除档案？</h3>
            <p className="py-2">将永久删除该档案下的全部交易记录，无法恢复。</p>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => setDeleteId(null)}>
                取消
              </button>
              <button type="button" className="btn btn-error" disabled={busy} onClick={confirmDelete}>
                确认删除
              </button>
            </div>
          </div>
          <button type="button" className="modal-backdrop" aria-label="关闭" onClick={() => setDeleteId(null)} />
        </dialog>
      ) : null}
    </div>
  );
}