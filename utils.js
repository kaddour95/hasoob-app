import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

// Norwegian NOK formatting
export const formatNOK = (amount) => {
  if (amount === undefined || amount === null) return '0 kr';
  const formatted = new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} kr`;
};

export const formatDate = (dateStr) => {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(d, 'd MMM yyyy', { locale: ar });
  } catch { return dateStr; }
};

export const formatMonthYear = (dateStr) => {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(d, 'MMMM yyyy', { locale: ar });
  } catch { return dateStr; }
};

export const getCurrentMonth = () => format(new Date(), 'yyyy-MM');
export const getMonthKey = (date) => format(new Date(date), 'yyyy-MM');

export const getMonthRange = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return { start: startOfMonth(d), end: endOfMonth(d) };
};

export const getLast6Months = () => {
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM', { locale: ar }) };
  });
};

export const getProgressColor = (pct) => {
  if (pct < 60) return '#22c55e';
  if (pct < 85) return '#f59e0b';
  return '#ef4444';
};

export const exportCSV = (transactions, categories) => {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
  const headers = ['التاريخ', 'النوع', 'المبلغ', 'التصنيف', 'طريقة الدفع', 'ملاحظة'];
  const rows = transactions.map(t => [
    t.date, t.type === 'income' ? 'دخل' : 'مصروف',
    t.amount, catMap[t.category] || t.category,
    t.paymentMethod || '', t.note || ''
  ]);
  const bom = '\uFEFF';
  const csv = bom + [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `hasoob-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click(); URL.revokeObjectURL(url);
};

export const exportJSON = async (db) => {
  const [transactions, categories, incomes] = await Promise.all([
    db.transactions.toArray(), db.categories.toArray(), db.incomes.toArray()
  ]);
  const data = { version: 1, exportedAt: new Date().toISOString(), transactions, categories, incomes };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `hasoob-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  a.click(); URL.revokeObjectURL(url);
};

export const importJSON = async (db, file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.transactions || !data.categories) throw new Error('ملف غير صحيح');
        await db.transactions.clear();
        await db.categories.clear();
        await db.incomes.clear();
        await db.categories.bulkAdd(data.categories);
        await db.transactions.bulkAdd(data.transactions);
        if (data.incomes) await db.incomes.bulkAdd(data.incomes);
        resolve(true);
      } catch (err) { reject(err); }
    };
    reader.readAsText(file);
  });
};

export const paymentMethods = [
  { value: 'card', label: 'بطاقة', icon: '💳' },
  { value: 'cash', label: 'كاش', icon: '💵' },
  { value: 'vipps', label: 'Vipps', icon: '📲' },
];
