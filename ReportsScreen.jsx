import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { formatNOK, getLast6Months } from '../utils';

const RADIAN = Math.PI / 180;
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontFamily="Cairo">{(percent*100).toFixed(0)}%</text>;
};

export default function ReportsScreen({ transactions, categories, t, lang }) {
  const currentMonthKey = format(new Date(), 'yyyy-MM');
  const catMap = useMemo(() => Object.fromEntries(categories.map(c=>[c.id,c])), [categories]);
  const months = getLast6Months();

  const pieData = useMemo(() => {
    const byCat = {};
    transactions.filter(tx=>tx.type==='expense'&&tx.date?.startsWith(currentMonthKey))
      .forEach(tx=>{ byCat[tx.category]=(byCat[tx.category]||0)+tx.amount; });
    return Object.entries(byCat).map(([cid,val])=>({
      name: catMap[parseInt(cid)]?.name||'Other', value: val,
      color: catMap[parseInt(cid)]?.color||'#6b7280',
      icon: catMap[parseInt(cid)]?.icon||'📦'
    })).sort((a,b)=>b.value-a.value);
  }, [transactions, categories, currentMonthKey, catMap]);

  const barData = useMemo(() => months.map(m=>({
    name: m.label,
    [t.expenses||'Expenses']: transactions.filter(tx=>tx.type==='expense'&&tx.date?.startsWith(m.key)).reduce((s,tx)=>s+tx.amount,0),
    [t.income||'Income']: transactions.filter(tx=>tx.type==='income'&&tx.date?.startsWith(m.key)).reduce((s,tx)=>s+tx.amount,0),
  })), [transactions, months, t]);

  const expKey = t.expenses||'Expenses';
  const incKey = t.income||'Income';

  const monthExpenses = transactions.filter(tx=>tx.type==='expense'&&tx.date?.startsWith(currentMonthKey));
  const maxExp = monthExpenses.length ? Math.max(...monthExpenses.map(tx=>tx.amount)) : 0;
  const avgDaily = monthExpenses.reduce((s,tx)=>s+tx.amount,0) / new Date().getDate();

  const monthLabel = lang==='ar'
    ? new Date().toLocaleString('ar',{month:'long',year:'numeric'})
    : new Date().toLocaleString('en',{month:'long',year:'numeric'});

  return (
    <div className="pb-28">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white">{t.reportsTitle}</h1>
        <p className="text-sm" style={{color:'#9ca3af'}}>{monthLabel}</p>
      </div>

      {/* Pie */}
      <div className="px-4 mb-5">
        <div className="card">
          <h2 className="text-base font-bold text-white mb-4">{t.distributionChart}</h2>
          {pieData.length===0 ? (
            <div className="text-center py-8" style={{color:'#6b7280'}}>{t.noData}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false} label={CustomLabel}>
                    {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {pieData.slice(0,5).map((d,i)=>(
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:d.color}}/>
                    <span className="text-sm flex-1" style={{color:'#d1d5db'}}>{d.icon} {d.name}</span>
                    <span className="text-sm font-bold text-white">{formatNOK(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bar */}
      <div className="px-4 mb-5">
        <div className="card">
          <h2 className="text-base font-bold text-white mb-4">{t.last6Months}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{top:5,right:5,bottom:5,left:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2a4a"/>
              <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize:11,fontFamily:'Cairo',fill:'#9ca3af'}}/>
              <YAxis stroke="#6b7280" tick={{fontSize:10,fill:'#6b7280'}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
              <Tooltip contentStyle={{background:'#0d1525',border:'1px solid #1a2a4a',borderRadius:'8px',fontFamily:'Cairo'}}
                labelStyle={{color:'#e8eaf0'}} formatter={v=>[formatNOK(v)]}/>
              <Bar dataKey={incKey} fill="#22c55e" radius={[4,4,0,0]}/>
              <Bar dataKey={expKey} fill="#ef4444" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{background:'#22c55e'}}/>
              <span className="text-xs" style={{color:'#9ca3af'}}>{t.income}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{background:'#ef4444'}}/>
              <span className="text-xs" style={{color:'#9ca3af'}}>{t.expenses}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            {label:t.highestExpense, value:formatNOK(maxExp), color:'#ef4444'},
            {label:t.dailyAverage,   value:formatNOK(avgDaily), color:'#f59e0b'},
            {label:t.expenseCount,   value:`${monthExpenses.length} ${t.operations||''}`, color:'#3b82f6'},
            {label:t.topCategory,    value:pieData[0]?`${pieData[0].icon} ${pieData[0].name}`:'—', color:'#8b5cf6'},
          ].map((s,i)=>(
            <div key={i} className="card text-center">
              <p className="text-xs mb-1" style={{color:'#6b7280'}}>{s.label}</p>
              <p className="text-base font-bold" style={{color:s.color}}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
