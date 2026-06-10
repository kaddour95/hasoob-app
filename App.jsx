import { useState, useEffect, useCallback } from 'react';
import { db, initDB } from './db';
import HomeScreen from './screens/HomeScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import ReportsScreen from './screens/ReportsScreen';
import SettingsScreen from './screens/SettingsScreen';
import AddTransaction from './components/AddTransaction';
import { getT } from './i18n';

export default function App() {
  const [tab, setTab] = useState('home');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [ready, setReady] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem('hasoob_lang') || 'ar');
  const [userName, setUserName] = useState(() => localStorage.getItem('hasoob_name') || '');

  const t = getT(lang);
  const isRTL = lang === 'ar';

  const loadData = useCallback(async () => {
    const [txns, cats] = await Promise.all([
      db.transactions.orderBy('date').reverse().toArray(),
      db.categories.toArray()
    ]);
    setTransactions(txns);
    setCategories(cats);
  }, []);

  useEffect(() => {
    initDB().then(() => loadData()).then(() => setReady(true));
  }, [loadData]);

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const handleLangChange = (l) => { setLang(l); localStorage.setItem('hasoob_lang', l); };
  const handleNameChange = (n) => { setUserName(n); localStorage.setItem('hasoob_name', n); };
  const handleCloseAdd = (refresh) => { setShowAdd(false); setEditItem(null); if (refresh) loadData(); };
  const handleEdit = (item) => { setEditItem(item); setShowAdd(true); };

  const NAV = [
    { id: 'home',     icon: '🏠', label: t.home },
    { id: 'txns',     icon: '📋', label: t.transactions },
    { id: 'reports',  icon: '📊', label: t.reports },
    { id: 'settings', icon: '⚙️', label: t.settings },
  ];

  if (!ready) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',flexDirection:'column',gap:'16px',background:'#080d1a'}}>
      <div style={{fontSize:'48px'}}>💰</div>
      <p style={{color:'white',fontSize:'20px',fontWeight:'bold',fontFamily:'Cairo,sans-serif'}}>{t.appName}</p>
      <p style={{color:'#6b7280',fontSize:'14px',fontFamily:'Cairo,sans-serif'}}>{t.loading}</p>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#080d1a',maxWidth:'500px',margin:'0 auto',position:'relative',direction:isRTL?'rtl':'ltr'}}>
      {tab==='home'     && <HomeScreen transactions={transactions} categories={categories} onEdit={handleEdit} t={t} userName={userName} lang={lang}/>}
      {tab==='txns'     && <TransactionsScreen transactions={transactions} categories={categories} onEdit={handleEdit} t={t}/>}
      {tab==='reports'  && <ReportsScreen transactions={transactions} categories={categories} t={t} lang={lang}/>}
      {tab==='settings' && <SettingsScreen categories={categories} transactions={transactions} onRefresh={loadData} t={t} lang={lang} onLangChange={handleLangChange} userName={userName} onNameChange={handleNameChange}/>}
      <button className="fab" onClick={() => setShowAdd(true)}>+</button>
      <nav className="bottom-nav">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} className={`nav-item ${tab===n.id?'active':''}`}>
            <span style={{fontSize:'20px',lineHeight:1}}>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      {showAdd && <AddTransaction categories={categories} onClose={handleCloseAdd} editItem={editItem} t={t}/>}
    </div>
  );
}
