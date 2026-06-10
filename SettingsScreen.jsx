import { useState } from 'react';
import { db } from '../db';
import { exportCSV, exportJSON, importJSON } from '../utils';

const COLORS = ['#22c55e','#3b82f6','#8b5cf6','#ec4899','#f97316','#06b6d4','#ef4444','#a78bfa','#d4a017','#6b7280','#14b8a6','#f59e0b'];
const ICONS = ['🛒','🚌','🏠','👶','🍽️','📱','💊','👔','💼','📦','✈️','🎮','💇','🐕','📚','🏋️','🎁','⚽','🍺','🚗'];

export default function SettingsScreen({ categories, transactions, onRefresh, t, lang, onLangChange, userName, onNameChange }) {
  const [editCat, setEditCat] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', icon: '📦', color: '#6b7280', budget: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState('');
  const [nameInput, setNameInput] = useState(userName);

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 2500); };

  const saveCat = async () => {
    if (!editCat.name) return;
    await db.categories.update(editCat.id, { name: editCat.name, icon: editCat.icon, color: editCat.color, budget: parseFloat(editCat.budget) || 0 });
    setEditCat(null); onRefresh();
  };

  const addCat = async () => {
    if (!newCat.name) return;
    await db.categories.add({ ...newCat, budget: parseFloat(newCat.budget) || 0 });
    setNewCat({ name: '', icon: '📦', color: '#6b7280', budget: 0 });
    setShowAdd(false); onRefresh();
  };

  const deleteCat = async (id) => { await db.categories.delete(id); onRefresh(); };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await importJSON(db, file); onRefresh(); showMsg(t.importSuccess); }
    catch { showMsg(t.importError); }
  };

  // Google Drive: download backup then open Drive
  const handleSaveToDrive = async () => {
    await exportJSON(db);
    setTimeout(() => window.open('https://drive.google.com/drive/my-drive', '_blank'), 800);
    showMsg('📥 ' + (lang === 'ar' ? 'الملف نزل — ارفعه على Drive الآن' : 'File downloaded — upload it to Drive now'));
  };

  const CatEditor = ({ cat, onSave, onCancel }) => (
    <div className="card mt-2 space-y-3">
      <input className="input-field" placeholder={t.categoryName} value={cat.name}
        onChange={e => { const u={...cat,name:e.target.value}; editCat?setEditCat(u):setNewCat(u); }} />
      <div>
        <p className="text-xs mb-1" style={{color:'#6b7280'}}>{t.icon}</p>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(ic => (
            <button key={ic} onClick={() => { const u={...cat,icon:ic}; editCat?setEditCat(u):setNewCat(u); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{background:cat.icon===ic?'#1a2a4a':'#121e36',border:cat.icon===ic?'1px solid #d4a017':'1px solid transparent'}}>
              {ic}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs mb-1" style={{color:'#6b7280'}}>{t.color}</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(col => (
            <button key={col} onClick={() => { const u={...cat,color:col}; editCat?setEditCat(u):setNewCat(u); }}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{background:col,borderColor:cat.color===col?'white':'transparent'}} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs mb-1" style={{color:'#6b7280'}}>{t.monthlyBudgetLabel}</p>
        <input type="number" className="input-field" placeholder="0" value={cat.budget}
          onChange={e => { const u={...cat,budget:e.target.value}; editCat?setEditCat(u):setNewCat(u); }} />
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-ghost flex-1">{t.cancel}</button>
        <button onClick={onSave} className="btn-primary flex-1">{t.save}</button>
      </div>
    </div>
  );

  return (
    <div className="pb-28">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white">{t.settingsTitle}</h1>
      </div>

      {msg && <div className="mx-4 mb-4 p-3 rounded-xl text-center text-sm font-medium text-white fade-in" style={{background:'#1a2a4a'}}>{msg}</div>}

      {/* Profile */}
      <div className="px-4 mb-5">
        <h2 className="text-base font-bold text-white mb-3">{t.profile}</h2>
        <div className="card space-y-3">
          <div>
            <label className="text-sm mb-1 block" style={{color:'#9ca3af'}}>{t.yourName}</label>
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder={t.namePlaceholder}
                value={nameInput} onChange={e => setNameInput(e.target.value)} />
              <button className="btn-primary px-4"
                onClick={() => { onNameChange(nameInput); showMsg(t.nameSaved); }}>
                {t.save}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="px-4 mb-5">
        <h2 className="text-base font-bold text-white mb-3">{t.language}</h2>
        <div className="flex gap-3">
          {[{v:'ar',l:'العربية',flag:'🇸🇦'},{v:'en',l:'English',flag:'🇬🇧'}].map(lng => (
            <button key={lng.v} onClick={() => onLangChange(lng.v)}
              className="flex-1 py-3 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: lang===lng.v ? '#1a2a4a' : '#121e36',
                borderColor: lang===lng.v ? '#d4a017' : '#1a2a4a',
                color: lang===lng.v ? '#e8c04a' : '#9ca3af'
              }}>
              <span>{lng.flag}</span> {lng.l}
            </button>
          ))}
        </div>
      </div>

      {/* Google Drive */}
      <div className="px-4 mb-5">
        <h2 className="text-base font-bold text-white mb-3">{t.googleDrive}</h2>
        <div className="space-y-2">
          <button onClick={handleSaveToDrive}
            className="card w-full flex items-center gap-3 py-3 text-right cursor-pointer transition-all"
            style={{}}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{background:'#1e3a8a22'}}>
              <span className="text-2xl">☁️</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{t.saveToGDrive}</p>
              <p className="text-xs" style={{color:'#6b7280'}}>{t.saveToGDriveDesc}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{background:'#1a2a4a',color:'#d4a017'}}>
              {lang==='ar'?'خطوتين':'2 steps'}
            </span>
          </button>

          <div className="card p-4" style={{border:'1px dashed #1a2a4a'}}>
            <p className="text-sm font-medium text-white mb-2">{t.importFromGDrive}</p>
            <p className="text-xs mb-3" style={{color:'#6b7280'}}>{t.importFromGDriveDesc}</p>
            <div className="flex gap-2">
              <button onClick={() => window.open('https://drive.google.com/drive/my-drive','_blank')}
                className="btn-ghost text-sm py-2 flex-1">
                📂 {t.openGDrive}
              </button>
              <label className="btn-primary text-sm py-2 flex-1 text-center cursor-pointer">
                📥 {lang==='ar'?'استيراد':'Import'}
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Backup */}
      <div className="px-4 mb-5">
        <h2 className="text-base font-bold text-white mb-3">{t.backup}</h2>
        <div className="space-y-2">
          <button onClick={() => exportCSV(transactions, categories)}
            className="card w-full flex items-center gap-3 py-3 text-right cursor-pointer">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm font-medium text-white">{t.exportCSV}</p>
              <p className="text-xs" style={{color:'#6b7280'}}>{t.exportCSVDesc}</p>
            </div>
          </button>
          <button onClick={() => exportJSON(db)}
            className="card w-full flex items-center gap-3 py-3 text-right cursor-pointer">
            <span className="text-2xl">💾</span>
            <div>
              <p className="text-sm font-medium text-white">{t.exportJSON}</p>
              <p className="text-xs" style={{color:'#6b7280'}}>{t.exportJSONDesc}</p>
            </div>
          </button>
          <label className="card w-full flex items-center gap-3 py-3 text-right cursor-pointer">
            <span className="text-2xl">📥</span>
            <div>
              <p className="text-sm font-medium text-white">{t.importJSON}</p>
              <p className="text-xs" style={{color:'#6b7280'}}>{t.importJSONDesc}</p>
            </div>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">{t.categories}</h2>
          <button onClick={() => setShowAdd(!showAdd)} style={{color:'#d4a017'}} className="text-sm font-medium">
            {t.addCategory}
          </button>
        </div>
        {showAdd && <CatEditor cat={newCat} onSave={addCat} onCancel={() => setShowAdd(false)} />}
        <div className="space-y-2 mt-2">
          {categories.map(cat => (
            <div key={cat.id}>
              <div className="card flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{background:cat.color+'22'}}>{cat.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{cat.name}</p>
                  {cat.budget > 0 && <p className="text-xs" style={{color:'#6b7280'}}>
                    {lang==='ar'?'ميزانية':'Budget'}: {cat.budget?.toLocaleString('nb-NO')} kr
                  </p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditCat(cat)} className="text-xs px-2 py-1 rounded"
                    style={{background:'#1a2a4a',color:'#a0b0d0'}}>{t.edit}</button>
                  <button onClick={() => deleteCat(cat.id)} className="text-xs px-2 py-1 rounded"
                    style={{background:'#2a1a1a',color:'#f87171'}}>{t.delete}</button>
                </div>
              </div>
              {editCat?.id === cat.id && <CatEditor cat={editCat} onSave={saveCat} onCancel={() => setEditCat(null)} />}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4">
        <div className="card text-center py-4">
          <p className="text-xs mb-1" style={{color:'#6b7280'}}>{t.totalStored}</p>
          <p className="text-2xl font-bold text-white">{transactions.length}</p>
          <p className="text-xs mt-1" style={{color:'#6b7280'}}>{t.savedOnDevice}</p>
        </div>
      </div>
    </div>
  );
}
