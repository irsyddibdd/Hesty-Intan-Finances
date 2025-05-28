
import { Category, Account, AccountType, CategoryType } from './types';

export const APP_NAME = "Manajer Keuangan Pribadi";
export const DEFAULT_CURRENCY = "IDR";
export const DEFAULT_LOCALE = "id-ID";

export const DEFAULT_INITIAL_CATEGORIES: Category[] = [
  // Expenses
  { id: 'cat-exp-1', name: 'Makanan & Minuman', type: CategoryType.EXPENSE, icon: 'fas fa-utensils', color: 'text-red-500' },
  { id: 'cat-exp-2', name: 'Transportasi', type: CategoryType.EXPENSE, icon: 'fas fa-bus', color: 'text-blue-500' },
  { id: 'cat-exp-3', name: 'Tagihan & Utilitas', type: CategoryType.EXPENSE, icon: 'fas fa-file-invoice-dollar', color: 'text-yellow-500' },
  { id: 'cat-exp-4', name: 'Belanja', type: CategoryType.EXPENSE, icon: 'fas fa-shopping-cart', color: 'text-green-500' },
  { id: 'cat-exp-5', name: 'Hiburan', type: CategoryType.EXPENSE, icon: 'fas fa-film', color: 'text-purple-500' },
  { id: 'cat-exp-6', name: 'Kesehatan', type: CategoryType.EXPENSE, icon: 'fas fa-heartbeat', color: 'text-pink-500' },
  { id: 'cat-exp-7', name: 'Pendidikan', type: CategoryType.EXPENSE, icon: 'fas fa-graduation-cap', color: 'text-indigo-500' },
  // Income
  { id: 'cat-inc-1', name: 'Gaji', type: CategoryType.INCOME, icon: 'fas fa-money-bill-wave', color: 'text-emerald-500' },
  { id: 'cat-inc-2', name: 'Bonus', type: CategoryType.INCOME, icon: 'fas fa-gift', color: 'text-teal-500' },
  { id: 'cat-inc-3', name: 'Investasi', type: CategoryType.INCOME, icon: 'fas fa-chart-line', color: 'text-cyan-500' },
];

export const DEFAULT_INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Bank BCA', type: AccountType.BANK, balance: 10000000, icon: 'fas fa-university' },
  { id: 'acc-2', name: 'GoPay', type: AccountType.EWALLET, balance: 500000, icon: 'fas fa-wallet' },
  { id: 'acc-3', name: 'Tunai', type: AccountType.CASH, balance: 200000, icon: 'fas fa-money-bill-alt' },
];

export const NProgressConfig = {
  showSpinner: false,
  easing: 'ease',
  speed: 500,
};

export const ICON_LIST = [
  'fas fa-utensils', 'fas fa-bus', 'fas fa-file-invoice-dollar', 'fas fa-shopping-cart',
  'fas fa-film', 'fas fa-heartbeat', 'fas fa-graduation-cap', 'fas fa-home',
  'fas fa-plane', 'fas fa-car', 'fas fa-bicycle', 'fas fa-train', 'fas fa-subway',
  'fas fa-money-bill-wave', 'fas fa-gift', 'fas fa-chart-line', 'fas fa-piggy-bank',
  'fas fa-university', 'fas fa-wallet', 'fas fa-money-bill-alt', 'fas fa-credit-card',
  'fas fa-tags', 'fas fa-receipt', 'fas fa-tools', 'fas fa-gas-pump', 'fas fa-tshirt',
  'fas fa-gamepad', 'fas fa-book', 'fas fa-laptop-medical', 'fas fa-pills'
];

export const COLOR_LIST = [
  'text-red-500', 'text-orange-500', 'text-amber-500', 'text-yellow-500', 'text-lime-500',
  'text-green-500', 'text-emerald-500', 'text-teal-500', 'text-cyan-500', 'text-sky-500',
  'text-blue-500', 'text-indigo-500', 'text-violet-500', 'text-purple-500', 'text-fuchsia-500',
  'text-pink-500', 'text-rose-500'
];

export const ACCOUNT_TYPE_OPTIONS = [
  { value: AccountType.BANK, label: 'Bank', icon: 'fas fa-university' },
  { value: AccountType.EWALLET, label: 'E-Wallet', icon: 'fas fa-wallet' },
  { value: AccountType.CREDIT_CARD, label: 'Kartu Kredit', icon: 'fas fa-credit-card' },
  { value: AccountType.CASH, label: 'Tunai', icon: 'fas fa-money-bill-alt' },
];
