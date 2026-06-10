import { useState, useMemo } from 'react';
import { db } from '../db';
import { formatNOK, formatDate } from '../utils';

export default function TransactionsScreen({ transactions, categories, onEdit, t }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null);

  const catMap = useMemo(() => Object.fromEntries(categories.map(c=>[c.id,c])), [categories]);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filterType!=='all') list = list.filter(tx=>tx.type===filterType);
    if (filterCat!=='all') list = list.filter(tx=>tx.category?.toString()===filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(tx=>
        (tx.note||'').toLowerCase().includes(q) ||
        (catMap[tx.category]?.name||'').includes(q) ||
        (tx.source||'').includes(q) ||
        tx.amount.toString().includes(q)
      );
    }
    if (sortBy==='date') list.sort((a,b)=>new Date(b.date)-new Date(a.date));
    else list.sort((a,b)=>b.amount-a.amount);
    return list;
  }, [transactions, filterType, filterCat, search, sortBy, catMap]);

  const handleDelete = async (id) => { await db.transactions.delete(id); setDeleteConfirm(null); };

  return (
    <div className="pb-28">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white mb-4">{t.allOps}</h1>
        <input type="text" placeholder={t.search} value={search}
          onChange={e=>setSearch(e.target.value)} className="input-field mb-3" />
        <div className="flex gap-2 overflow-x-auto pb-2" style={{scrollbarWidth:'none'}}>
          {[{v:'all',l:t.all},{v:'expense',l:t.expenses},{v:'income',l:t.income}].map(f=>(
            <button key={f.v} onClick={()=>setFilterType(f.v)}
              className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-all"
              style={{background:filterType===f.v?'#1a2a4a':'#121e36',borderColor:filterType===f.v?'#d4a017':'#1a2a4a',color:filterType===f.v?'#e8c04a':'#9ca3af'}}>
              {f.l}
            </button>
          ))}
          <div style={{width:'1px',background:'#1a2a4a',margin:'0 4px'}} />
          {categories.map(c=>(
            <button key={c.id} onClick={()=>setFilterCat(filterCat===c.id.toString()?'all':c.id.toString())}
              className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-all"
              style={{background:filterCat===c.id.toString()?c.color+'22':'#121e36',borderColor:filterCat===c.id.toString()?c.color:'#1a2a4a',color:filterCat===c.id.toString()?c.color:'#9ca3af'}}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-3 flex items-center">
        <span className="text-xs" style={{color:'#6b7280'}}>{filtered.length} {t.operations||''}</span>
        <div className="mr-auto flex gap-2">
          {[{v:'date',l:t.newest},{v:'amount',l:t.highest}].map(s=>(
            <button key={s.v} onClick={()=>setSortBy(s.v)}
              className="text-xs px-2 py-1 rounded border"
              style={{borderColor:sortBy===s.v?'#d4a017':'#1a2a4a',color:sortBy===s.v?'#e8c04a':'#6b7280',background:'#121e36'}}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2">
        {filtered.length===0 ? (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">🔍</p>
            <p style={{color:'#9ca3af'}}>{t.noResults}</p>
          </div>
        ) : filtered.map(tx=>{
          const cat=catMap[tx.category];
          return (
            <div key={tx.id} className="card" style={{padding:'12px 14px'}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{background:cat?cat.color+'22':'#22c55e22'}}>
                  {tx.type==='income'?'💰':(cat?.icon||'💸')}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>onEdit(tx)}>
                  <p className="font-medium text-white text-sm truncate">
                    {tx.type==='income'?(tx.source||t.income):(cat?.name||'—')}
                  </p>
                  <p className="text-xs truncate" style={{color:'#6b7280'}}>
                    {formatDate(tx.date)}{tx.note?` · ${tx.note}`:''}
                    {tx.paymentMethod && tx.type==='expense' && (
                      <span>{tx.paymentMethod==='card'?' 💳':tx.paymentMethod==='cash'?' 💵':' 📲'}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className={`font-bold text-sm ${tx.type==='income'?'text-green-400':'text-red-400'}`}>
                    {tx.type==='income'?'+':'-'}{formatNOK(tx.amount)}
                  </p>
                  <button onClick={()=>setDeleteConfirm(tx.id)} style={{color:'#4a5a7a',fontSize:'20px',lineHeight:1}}>×</button>
                </div>
              </div>
              {tx.receipt && (
                <div className="mt-2 pt-2" style={{borderTop:'1px solid #1a2a4a'}}>
                  <button onClick={()=>setViewReceipt(tx.receipt)} className="flex items-center gap-2 w-full">
                    <img src={tx.receipt} alt="receipt" className="rounded-lg object-cover flex-shrink-0"
                      style={{width:'48px',height:'36px',border:'1px solid #1a2a4a'}} />
                    <span className="text-xs" style={{color:'#d4a017'}}>{t.viewReceipt}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Receipt Viewer */}
      {viewReceipt && (
        <div className="modal-overlay fade-in" onClick={()=>setViewReceipt(null)}
          style={{alignItems:'center',justifyContent:'center'}}>
          <div className="slide-up" style={{maxWidth:'500px',width:'92%',position:'relative'}}>
            <img src={viewReceipt} alt="receipt" style={{width:'100%',borderRadius:'16px',border:'1px solid #1a2a4a'}} />
            <button onClick={()=>setViewReceipt(null)}
              className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
              style={{background:'rgba(0,0,0,0.8)',fontSize:'18px'}}>×</button>
            <a href={viewReceipt} download="receipt.jpg"
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
              style={{background:'rgba(0,0,0,0.8)',fontSize:'18px'}}>⬇️</a>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay fade-in" onClick={()=>setDeleteConfirm(null)}>
          <div className="modal-sheet slide-up" style={{borderRadius:'20px'}}>
            <h3 className="text-lg font-bold text-white mb-2 text-center">{t.deleteOp}</h3>
            <p className="text-sm text-center mb-6" style={{color:'#9ca3af'}}>{t.deleteConfirm}</p>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteConfirm(null)} className="btn-ghost flex-1">{t.cancel}</button>
              <button onClick={()=>handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-xl font-bold text-white" style={{background:'#ef4444'}}>
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
