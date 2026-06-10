import { useState, useRef } from 'react';
import { db } from '../db';
import { format } from 'date-fns';
import { paymentMethods } from '../utils';

export default function AddTransaction({ categories, onClose, editItem, t }) {
  const [type, setType] = useState(editItem?.type || 'expense');
  const [amount, setAmount] = useState(editItem?.amount?.toString() || '');
  const [category, setCategory] = useState(editItem?.category?.toString() || '');
  const [date, setDate] = useState(editItem?.date || format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState(editItem?.note || '');
  const [paymentMethod, setPaymentMethod] = useState(editItem?.paymentMethod || 'card');
  const [source, setSource] = useState(editItem?.source || (t.sources?.[0] || 'Salary'));
  const [receipt, setReceipt] = useState(editItem?.receipt || null);
  const [receiptPreview, setReceiptPreview] = useState(editItem?.receipt || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        setReceipt(compressed); setReceiptPreview(compressed);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setError('');
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) return setError(t.errorAmount);
    if (type === 'expense' && !category) return setError(t.errorCategory);
    setLoading(true);
    try {
      const data = { type, amount: amt, date, note, paymentMethod, receipt: receipt||null, createdAt: new Date().toISOString() };
      if (type==='expense') data.category = parseInt(category);
      else { data.source = source; data.category = null; }
      if (editItem?.id) await db.transactions.update(editItem.id, data);
      else await db.transactions.add(data);
      onClose(true);
    } catch { setError(t.errorGeneral); }
    setLoading(false);
  };

  const pmLabels = { card: t.card, cash: t.cash, vipps: 'Vipps' };
  const pmIcons  = { card: '💳', cash: '💵', vipps: '📲' };

  return (
    <div className="modal-overlay fade-in" onClick={(e)=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-sheet slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{editItem ? t.editOp : t.addNew}</h2>
          <button onClick={()=>onClose()} style={{color:'#9ca3af',fontSize:'24px',lineHeight:1}}>×</button>
        </div>

        {/* Type */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{background:'#121e36'}}>
          {[{v:'expense',l:t.expense,i:'💸'},{v:'income',l:t.incomeLabel,i:'💰'}].map(tp=>(
            <button key={tp.v} onClick={()=>setType(tp.v)}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={type===tp.v?{background:'linear-gradient(135deg,#d4a017,#e8c04a)',color:'#080d1a'}:{color:'#9ca3af'}}>
              {tp.i} {tp.l}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="text-sm mb-1 block" style={{color:'#9ca3af'}}>{t.amount}</label>
          <input type="number" inputMode="decimal" placeholder="0.00" value={amount}
            onChange={e=>setAmount(e.target.value)} className="input-field text-xl font-bold" autoFocus />
        </div>

        {/* Category / Source */}
        {type==='expense' ? (
          <div className="mb-4">
            <label className="text-sm mb-1 block" style={{color:'#9ca3af'}}>{t.category}</label>
            <div className="grid grid-cols-5 gap-2">
              {categories.map(c=>(
                <button key={c.id} onClick={()=>setCategory(c.id.toString())}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
                  style={{background:category===c.id.toString()?'#1a2a4a':'#121e36',borderColor:category===c.id.toString()?c.color:'#1a2a4a'}}>
                  <span className="text-lg">{c.icon}</span>
                  <span style={{fontSize:'9px',color:'#d1d5db',textAlign:'center',lineHeight:1.2}}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="text-sm mb-1 block" style={{color:'#9ca3af'}}>{t.source}</label>
            <div className="flex gap-2 flex-wrap">
              {(t.sources||['Salary','Extra','Bonus','Other']).map(s=>(
                <button key={s} onClick={()=>setSource(s)}
                  className="px-3 py-2 rounded-lg text-sm border transition-all"
                  style={{background:'#121e36',borderColor:source===s?'#d4a017':'#1a2a4a',color:source===s?'#e8c04a':'#9ca3af'}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment Method */}
        {type==='expense' && (
          <div className="mb-4">
            <label className="text-sm mb-1 block" style={{color:'#9ca3af'}}>{t.paymentMethod}</label>
            <div className="flex gap-2">
              {['card','cash','vipps'].map(m=>(
                <button key={m} onClick={()=>setPaymentMethod(m)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all"
                  style={{background:paymentMethod===m?'#1a2a4a':'#121e36',borderColor:paymentMethod===m?'#d4a017':'#1a2a4a',color:paymentMethod===m?'#e8c04a':'#9ca3af'}}>
                  {pmIcons[m]} {pmLabels[m]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        <div className="mb-4">
          <label className="text-sm mb-1 block" style={{color:'#9ca3af'}}>{t.date}</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input-field" />
        </div>

        {/* Note */}
        <div className="mb-4">
          <label className="text-sm mb-1 block" style={{color:'#9ca3af'}}>{t.note}</label>
          <input type="text" placeholder={t.notePlaceholder} value={note}
            onChange={e=>setNote(e.target.value)} className="input-field" />
        </div>

        {/* Receipt */}
        <div className="mb-5">
          <label className="text-sm mb-2 block" style={{color:'#9ca3af'}}>{t.receiptPhoto}</label>
          {receiptPreview ? (
            <div className="relative">
              <img src={receiptPreview} alt="receipt" className="w-full rounded-xl object-cover"
                style={{maxHeight:'160px',border:'1px solid #1a2a4a'}} />
              <button onClick={()=>{setReceipt(null);setReceiptPreview(null);}}
                className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{background:'rgba(0,0,0,0.7)'}}>×</button>
              <button onClick={()=>fileRef.current?.click()}
                className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs"
                style={{background:'rgba(0,0,0,0.7)',color:'#e8c04a'}}>
                {t.edit||'Change'}
              </button>
            </div>
          ) : (
            <button onClick={()=>fileRef.current?.click()}
              className="w-full py-4 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all"
              style={{borderColor:'#1a2a4a',background:'#121e36'}}>
              <span className="text-2xl">📷</span>
              <span className="text-sm" style={{color:'#6b7280'}}>{t.uploadReceipt}</span>
              <span className="text-xs" style={{color:'#4a5a7a'}}>{t.savedOnDevice}</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleReceiptChange} />
        </div>

        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

        <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full text-center">
          {loading ? '...' : editItem ? t.saveChanges : (type==='expense' ? t.addExpenseBtn : t.addIncomeBtn)}
        </button>
      </div>
    </div>
  );
}
