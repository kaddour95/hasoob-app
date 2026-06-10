import { useMemo } from 'react';
import { formatNOK, formatDate, getProgressColor } from '../utils';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';

export default function HomeScreen({ transactions, categories, onEdit, t, userName, lang }) {
  const currentMonthKey = format(new Date(), 'yyyy-MM');

  const monthlyData = useMemo(() => {
    const monthTxs = transactions.filter(tx => tx.date?.startsWith(currentMonthKey));
    const totalExpense = monthTxs.filter(tx => tx.type==='expense').reduce((s,tx)=>s+tx.amount,0);
    const totalIncome  = monthTxs.filter(tx => tx.type==='income').reduce((s,tx)=>s+tx.amount,0);
    return { totalExpense, totalIncome, net: totalIncome - totalExpense, count: monthTxs.length };
  }, [transactions, currentMonthKey]);

  const categoryBudgets = useMemo(() => categories.map(cat => {
    const spent = transactions
      .filter(tx => tx.type==='expense' && tx.category===cat.id && tx.date?.startsWith(currentMonthKey))
      .reduce((s,tx)=>s+tx.amount,0);
    const budget = cat.budget || 0;
    const pct = budget > 0 ? Math.min((spent/budget)*100,100) : 0;
    return { ...cat, spent, pct };
  }).filter(c => c.spent > 0 || c.budget > 0), [transactions, categories, currentMonthKey]);

  const recent = useMemo(() =>
    [...transactions].sort((a,b)=>new Date(b.createdAt||b.date)-new Date(a.createdAt||a.date)).slice(0,8),
    [transactions]
  );
  const catMap = useMemo(() => Object.fromEntries(categories.map(c=>[c.id,c])), [categories]);

  const monthName = lang === 'ar'
    ? new Date().toLocaleString('ar', { month:'long' })
    : new Date().toLocaleString('en', { month:'long' });

  const greeting = userName ? `${t.hello} ${userName} 👋` : `${t.hello} 👋`;

  return (
    <div className="pb-28">
      <div className="px-4 pt-6 pb-4">
        <p style={{color:'#a0b0d0',fontSize:'14px'}}>{greeting}</p>
        <h1 className="text-2xl font-bold text-white">{t.monthlySummary} {monthName}</h1>
      </div>

      {/* Summary Card */}
      <div className="px-4 mb-5">
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{background:'linear-gradient(135deg,#1a2a4a 0%,#0d1525 100%)',border:'1px solid #1e3260'}}>
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full opacity-10"
            style={{background:'radial-gradient(circle,#d4a017,transparent)',transform:'translate(-30%,-30%)'}} />
          <p className="text-sm mb-1" style={{color:'#a0b0d0'}}>{t.totalExpenses}</p>
          <p className="text-3xl font-bold mb-4 text-red-400">{formatNOK(monthlyData.totalExpense)}</p>
          <div className="flex justify-between">
            <div>
              <p className="text-xs mb-0.5" style={{color:'#a0b0d0'}}>{t.income}</p>
              <p className="text-lg font-bold text-green-400">{formatNOK(monthlyData.totalIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs mb-0.5" style={{color:'#a0b0d0'}}>{t.net}</p>
              <p className={`text-lg font-bold ${monthlyData.net>=0?'text-green-400':'text-red-400'}`}>
                {monthlyData.net>=0?'+':''}{formatNOK(monthlyData.net)}
              </p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{color:'#a0b0d0'}}>{t.operationsCount}</p>
              <p className="text-lg font-bold text-white">{monthlyData.count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      {categoryBudgets.length > 0 && (
        <div className="px-4 mb-5">
          <h2 className="text-base font-bold text-white mb-3">{t.monthlyBudget}</h2>
          <div className="space-y-2">
            {categoryBudgets.sort((a,b)=>b.pct-a.pct).slice(0,6).map(cat=>(
              <div key={cat.id} className="card py-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-sm font-medium text-white">{cat.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold" style={{color:getProgressColor(cat.pct)}}>{formatNOK(cat.spent)}</span>
                    {cat.budget>0 && <span className="text-xs" style={{color:'#6b7280'}}> / {formatNOK(cat.budget)}</span>}
                  </div>
                </div>
                {cat.budget>0 && (
                  <div className="w-full h-1.5 rounded-full" style={{background:'#1a2a4a'}}>
                    <div className="h-full rounded-full progress-bar"
                      style={{width:`${cat.pct}%`,background:getProgressColor(cat.pct)}} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      <div className="px-4">
        <h2 className="text-base font-bold text-white mb-3">{t.recentOps}</h2>
        {recent.length===0 ? (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">💸</p>
            <p style={{color:'#9ca3af'}}>{t.noTransactions}</p>
            <p className="text-sm mt-1" style={{color:'#6b7280'}}>{t.addFirstExpense}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(tx=>{
              const cat=catMap[tx.category];
              return (
                <div key={tx.id} className="card flex items-center gap-3 py-3 cursor-pointer" onClick={()=>onEdit(tx)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{background:cat?cat.color+'22':'#22c55e22'}}>
                    {tx.type==='income'?'💰':(cat?.icon||'💸')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">
                      {tx.type==='income'?(tx.source||t.income):(cat?.name||'—')}
                    </p>
                    <p className="text-xs truncate" style={{color:'#6b7280'}}>
                      {formatDate(tx.date)}{tx.note?` · ${tx.note}`:''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {tx.receipt && <span className="text-sm">📎</span>}
                    <p className={`font-bold text-sm ${tx.type==='income'?'text-green-400':'text-red-400'}`}>
                      {tx.type==='income'?'+':'-'}{formatNOK(tx.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
