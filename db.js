import Dexie from 'dexie';

export const db = new Dexie('HasoobDB');

db.version(1).stores({
  transactions: '++id, type, amount, category, date, paymentMethod, note, createdAt',
  categories: '++id, name, icon, color, budget',
  incomes: '++id, amount, source, date, note, month',
  settings: 'key',
});

// Default categories
const defaultCategories = [
  { name: 'بقالة', icon: '🛒', color: '#22c55e', budget: 3000 },
  { name: 'مواصلات', icon: '🚌', color: '#3b82f6', budget: 1500 },
  { name: 'إيجار وفواتير', icon: '🏠', color: '#8b5cf6', budget: 12000 },
  { name: 'أطفال', icon: '👶', color: '#ec4899', budget: 2000 },
  { name: 'مطاعم', icon: '🍽️', color: '#f97316', budget: 1000 },
  { name: 'اشتراكات', icon: '📱', color: '#06b6d4', budget: 500 },
  { name: 'صحة', icon: '💊', color: '#ef4444', budget: 800 },
  { name: 'ملابس', icon: '👔', color: '#a78bfa', budget: 1000 },
  { name: 'شغل', icon: '💼', color: '#d4a017', budget: 500 },
  { name: 'أخرى', icon: '📦', color: '#6b7280', budget: 1000 },
];

db.on('populate', async () => {
  await db.categories.bulkAdd(defaultCategories);
});

export const initDB = async () => {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(defaultCategories);
  }
};
