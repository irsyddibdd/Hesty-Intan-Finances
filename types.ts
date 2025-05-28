
export enum ThemeMode {
    LIGHT = 'light',
    DARK = 'dark',
  }
  
  export interface User {
    id: string;
    email: string;
    name?: string;
    // Mocked: no password stored client-side
  }
  
  export enum AccountType {
    BANK = 'Bank',
    EWALLET = 'E-Wallet',
    CREDIT_CARD = 'Kartu Kredit',
    CASH = 'Tunai'
  }
  
  export interface Account {
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    icon?: string; // e.g., FontAwesome class
  }
  
  export enum CategoryType {
    INCOME = 'income',
    EXPENSE = 'expense',
  }
  
  export interface Category {
    id: string;
    name: string;
    type: CategoryType;
    icon?: string; // e.g., FontAwesome class
    color?: string; // e.g., Tailwind color class or hex
  }
  
  export interface Transaction {
    id: string;
    date: string; // ISO string for simplicity, format on display
    description: string;
    amount: number;
    type: CategoryType;
    categoryId: string;
    accountId: string;
  }
  
  export enum BudgetPeriod {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
  }
  
  export interface Budget {
    id: string;
    categoryId: string;
    amount: number;
    period: BudgetPeriod;
    startDate: string; // ISO string
    // endDate derived or also stored
  }
  
  export interface Settings {
    theme: ThemeMode;
    language: 'id' | 'en'; // Default 'id'
    currency: 'IDR' | 'USD'; // Default 'IDR'
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  }
  
  // For chart data
  export interface ChartDataPoint {
    name: string;
    value: number;
    fill?: string;
  }
  
  export interface IncomeExpenseChartDataPoint {
    name: string; // e.g., 'Jan', 'Feb'
    income: number;
    expenses: number;
  }
  