
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo, PropsWithChildren, Dispatch, SetStateAction } from 'react';
import { HashRouter, Routes, Route, Link, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ThemeMode, User, Account, Category, Transaction, Budget, Settings, CategoryType, AccountType, BudgetPeriod, ChartDataPoint, IncomeExpenseChartDataPoint } from './types';
import { DEFAULT_INITIAL_CATEGORIES, DEFAULT_INITIAL_ACCOUNTS, ICON_LIST, COLOR_LIST, ACCOUNT_TYPE_OPTIONS } from './constants';

// UTILITY FUNCTIONS
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const formatCurrencyIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const formatDateID = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
};

const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return new Date().toISOString().split('T')[0];
  return new Date(dateString).toISOString().split('T')[0];
};


// LOCAL STORAGE HOOK
function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };
  return [storedValue, setValue];
}

// THEME CONTEXT
interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<ThemeMode>('theme', ThemeMode.LIGHT);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT);
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT);
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

// AUTH CONTEXT (MOCKED)
interface AuthContextType {
  user: User | null;
  login: (email: string) => void; // Simplified login
  logout: () => void;
  isAuthenticated: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const isAuthenticated = !!user;

  const login = (email: string) => {
    setUser({ id: generateId(), email }); // Mock login
  };
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};


// DATA CONTEXT
interface DataContextType {
  accounts: Account[];
  setAccounts: Dispatch<SetStateAction<Account[]>>;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (accountId: string) => void;
  categories: Category[];
  setCategories: Dispatch<SetStateAction<Category[]>>;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  transactions: Transaction[];
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  budgets: Budget[];
  setBudgets: Dispatch<SetStateAction<Budget[]>>;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (budgetId: string) => void;
  resetAllData: () => void;
  getCategoryById: (id: string) => Category | undefined;
  getAccountById: (id: string) => Account | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DataProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [accounts, setAccounts] = useLocalStorage<Account[]>('accounts', DEFAULT_INITIAL_ACCOUNTS);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', DEFAULT_INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', []);

  const addAccount = (account: Omit<Account, 'id'>) => setAccounts(prev => [...prev, { ...account, id: generateId() }]);
  const updateAccount = (updatedAccount: Account) => setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
  const deleteAccount = (accountId: string) => setAccounts(prev => prev.filter(acc => acc.id !== accountId));

  const addCategory = (category: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...category, id: generateId() }]);
  const updateCategory = (updatedCategory: Category) => setCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
  const deleteCategory = (categoryId: string) => setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  
  const getCategoryById = useCallback((id: string) => categories.find(cat => cat.id === id), [categories]);
  const getAccountById = useCallback((id: string) => accounts.find(acc => acc.id === id), [accounts]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: generateId() };
    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    // Update account balance
    setAccounts(prevAccounts => prevAccounts.map(acc => {
        if (acc.id === transaction.accountId) {
            const balanceChange = transaction.type === CategoryType.INCOME ? transaction.amount : -transaction.amount;
            return { ...acc, balance: acc.balance + balanceChange };
        }
        return acc;
    }));
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    const oldTransaction = transactions.find(t => t.id === updatedTransaction.id);
    
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    setAccounts(prevAccounts => prevAccounts.map(acc => {
      let newBalance = acc.balance;
      // Revert old transaction if it existed and affected this account
      if (oldTransaction && oldTransaction.accountId === acc.id) {
        const oldImpact = oldTransaction.type === CategoryType.INCOME ? oldTransaction.amount : -oldTransaction.amount;
        newBalance -= oldImpact;
      }
      // Apply new transaction if it affects this account
      if (updatedTransaction.accountId === acc.id) {
        const newImpact = updatedTransaction.type === CategoryType.INCOME ? updatedTransaction.amount : -updatedTransaction.amount;
        newBalance += newImpact;
      }
      return { ...acc, balance: newBalance };
    }));
  };
  
  const deleteTransaction = (transactionId: string) => {
     const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (transactionToDelete) {
      setAccounts(prevAccounts => prevAccounts.map(acc => {
        if (acc.id === transactionToDelete.accountId) {
          const balanceChange = transactionToDelete.type === CategoryType.INCOME ? -transactionToDelete.amount : transactionToDelete.amount;
          return { ...acc, balance: acc.balance + balanceChange };
        }
        return acc;
      }));
    }
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  };

  const addBudget = (budget: Omit<Budget, 'id'>) => setBudgets(prev => [...prev, { ...budget, id: generateId() }]);
  const updateBudget = (updatedBudget: Budget) => setBudgets(prev => prev.map(b => b.id === updatedBudget.id ? updatedBudget : b));
  const deleteBudget = (budgetId: string) => setBudgets(prev => prev.filter(b => b.id !== budgetId));

  const resetAllData = () => {
    if (window.confirm("Apakah Anda yakin ingin mereset semua data keuangan? Tindakan ini tidak dapat diurungkan.")) {
      setAccounts(DEFAULT_INITIAL_ACCOUNTS);
      setCategories(DEFAULT_INITIAL_CATEGORIES);
      setTransactions([]);
      setBudgets([]);
    }
  };

  return (
    <DataContext.Provider value={{
      accounts, setAccounts, addAccount, updateAccount, deleteAccount, getAccountById,
      categories, setCategories, addCategory, updateCategory, deleteCategory, getCategoryById,
      transactions, setTransactions, addTransaction, updateTransaction, deleteTransaction,
      budgets, setBudgets, addBudget, updateBudget, deleteBudget,
      resetAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};

const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

// UI COMPONENTS
const Card: React.FC<PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => {
  return (
    <div className={`bg-lightSurface dark:bg-darkSurface shadow-lg rounded-xl p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<PropsWithChildren<ButtonProps>> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  ...props 
}) => {
  const baseCoreStyle = "rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-colors duration-150 inline-flex items-center justify-center";
  
  let variantStyle = "";
  switch(variant) {
    case 'primary': variantStyle = "bg-primary text-white hover:bg-primary-light focus:ring-primary"; break;
    case 'secondary': variantStyle = "bg-secondary text-white hover:bg-secondary-light focus:ring-secondary"; break;
    case 'danger': variantStyle = "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"; break;
    case 'ghost': variantStyle = "bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 text-lightText dark:text-darkText focus:ring-primary"; break;
  }

  let sizeStyle = "";
  switch(size) {
    case 'sm': sizeStyle = "px-2 py-1 text-xs font-medium"; break;
    case 'md': sizeStyle = "px-3 sm:px-4 py-2 text-sm font-semibold"; break; // Adjusted padding for 'md'
    case 'lg': sizeStyle = "px-4 sm:px-6 py-2 sm:py-3 text-base font-semibold"; break; // Adjusted padding for 'lg'
  }
  
  return (
    <button className={`${baseCoreStyle} ${sizeStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({ label, id, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-lightTextSecondary dark:text-darkTextSecondary mb-1">{label}</label>}
      <input
        id={id}
        className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-lightSurface dark:bg-darkSurface text-lightText dark:text-darkText ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }> = ({ label, id, children, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-lightTextSecondary dark:text-darkTextSecondary mb-1">{label}</label>}
      <select
        id={id}
        className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-lightSurface dark:bg-darkSurface text-lightText dark:text-darkText ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}
const Modal: React.FC<PropsWithChildren<ModalProps>> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-lightSurface dark:bg-darkSurface p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-lightText dark:text-darkText">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="text-2xl leading-none p-1 -mr-2 -mt-2">&times;</Button>
        </div>
        {children}
      </div>
    </div>
  );
};

// LAYOUT COMPONENTS
interface HeaderProps {
  toggleMobileSidebar: () => void;
}
const Header: React.FC<HeaderProps> = ({ toggleMobileSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-lightSurface dark:bg-darkSurface shadow-md p-3 sm:p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-40 h-16">
      <div className="flex items-center">
        <button 
          onClick={toggleMobileSidebar} 
          className="md:hidden text-xl text-lightTextSecondary dark:text-darkTextSecondary hover:text-primary dark:hover:text-primary mr-2 p-1"
          aria-label="Toggle sidebar"
        >
          <i className="fas fa-bars"></i>
        </button>
        <Link to="/" className="text-lg sm:text-xl font-bold text-primary">Management Keuangan</Link>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button onClick={toggleTheme} className="text-lg sm:text-xl text-lightTextSecondary dark:text-darkTextSecondary hover:text-primary dark:hover:text-primary p-1">
          {theme === ThemeMode.LIGHT ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
        </button>
        {isAuthenticated && user && (
          <div className="relative group">
             <span className="cursor-pointer text-lightText dark:text-darkText flex items-center">
                <i className="fas fa-user-circle mr-1 text-xl sm:text-2xl"></i> 
                <span className="hidden sm:inline">{user.email.split('@')[0]}</span>
             </span>
             <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-lightSurface dark:bg-darkSurface rounded-md shadow-lg py-1 hidden group-hover:block">
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-lightText dark:text-darkText hover:bg-slate-100 dark:hover:bg-slate-700">
                  <i className="fas fa-sign-out-alt mr-2"></i>Keluar
                </button>
             </div>
          </div>
        )}
      </div>
    </header>
  );
};

interface SidebarProps {
  isMobileSidebarOpen: boolean;
  closeMobileSidebar: () => void;
}
const Sidebar: React.FC<SidebarProps> = ({ isMobileSidebarOpen, closeMobileSidebar }) => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-primary-light hover:text-white transition-colors duration-150 ${
      isActive ? 'bg-primary text-white font-semibold' : 'text-lightTextSecondary dark:text-darkTextSecondary hover:text-lightText dark:hover:text-darkText'
    }`;

  return (
    <aside 
      className={`w-64 bg-lightSurface dark:bg-darkSurface p-4 shadow-lg overflow-y-auto fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0
                  ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      onClick={(e) => e.stopPropagation()} // Prevent click inside sidebar from closing it
    >
      <div className="md:hidden flex justify-between items-center mb-4">
          <span className="text-lg font-bold text-primary">Menu</span>
          <button onClick={closeMobileSidebar} className="text-xl p-1">
            <i className="fas fa-times"></i>
          </button>
      </div>
      <nav className="space-y-1">
        <NavLink to="/" className={navLinkClass} onClick={closeMobileSidebar} end><i className="fas fa-tachometer-alt w-5"></i><span>Dasbor</span></NavLink>
        <NavLink to="/transactions" className={navLinkClass} onClick={closeMobileSidebar}><i className="fas fa-exchange-alt w-5"></i><span>Transaksi</span></NavLink>
        <NavLink to="/budgets" className={navLinkClass} onClick={closeMobileSidebar}><i className="fas fa-bullseye w-5"></i><span>Anggaran</span></NavLink>
        <NavLink to="/reports" className={navLinkClass} onClick={closeMobileSidebar}><i className="fas fa-chart-pie w-5"></i><span>Laporan</span></NavLink>
        <NavLink to="/settings" className={navLinkClass} onClick={closeMobileSidebar}><i className="fas fa-cog w-5"></i><span>Pengaturan</span></NavLink>
      </nav>
    </aside>
  );
};

const ProtectedRoute: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const MainLayout: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  
  const location = useLocation();
  useEffect(() => {
    // Close mobile sidebar on route change
    closeMobileSidebar();
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header toggleMobileSidebar={toggleMobileSidebar} />
      <div className="flex flex-1 pt-16"> {/* Adjust pt for header height */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" 
            onClick={closeMobileSidebar}
            aria-hidden="true"
          ></div>
        )}
        <Sidebar isMobileSidebarOpen={isMobileSidebarOpen} closeMobileSidebar={closeMobileSidebar} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto bg-lightBg dark:bg-darkBg transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};

// PAGE COMPONENTS
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Mocked, not validated
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { // Basic check
      login(email);
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-lightBg dark:bg-darkBg p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold text-center text-primary mb-6">Login Akun Anda</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@anda.com" required />
          <Input type="password" label="Kata Sandi" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required />
          <Button type="submit" variant="primary" className="w-full" size="lg">Masuk</Button>
        </form>
        <p className="text-center mt-4 text-sm text-lightTextSecondary dark:text-darkTextSecondary">
          Belum punya akun? <Link to="/register" className="text-primary hover:underline">Daftar di sini</Link>
        </p>
         <p className="text-center mt-2 text-xs text-lightTextSecondary dark:text-darkTextSecondary">
          (Gunakan email apa saja, kata sandi tidak divalidasi untuk demo ini)
        </p>
      </Card>
    </div>
  );
};

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth(); 
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      login(email); 
      navigate("/");
    }
  };
    return (
    <div className="min-h-screen flex items-center justify-center bg-lightBg dark:bg-darkBg p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold text-center text-primary mb-6">Buat Akun Baru</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@anda.com" required />
          <Input type="password" label="Kata Sandi" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required />
          <Input type="password" label="Konfirmasi Kata Sandi" placeholder="********" required />
          <Button type="submit" variant="primary" className="w-full" size="lg">Daftar</Button>
        </form>
        <p className="text-center mt-4 text-sm text-lightTextSecondary dark:text-darkTextSecondary">
          Sudah punya akun? <Link to="/login" className="text-primary hover:underline">Masuk</Link>
        </p>
      </Card>
    </div>
  );
};

// Dashboard Page Components
const SummaryCard: React.FC<{ title: string; amount: number; icon: string; colorClass: string }> = ({ title, amount, icon, colorClass }) => {
  return (
    <Card className="flex items-center space-x-3 sm:space-x-4">
      <div className={`p-2 sm:p-3 rounded-full bg-opacity-20 ${colorClass.replace('text-', 'bg-')}`}>
        <i className={`${icon} ${colorClass} text-xl sm:text-2xl`}></i>
      </div>
      <div>
        <p className="text-xs sm:text-sm text-lightTextSecondary dark:text-darkTextSecondary">{title}</p>
        <p className="text-lg sm:text-2xl font-semibold text-lightText dark:text-darkText">{formatCurrencyIDR(amount)}</p>
      </div>
    </Card>
  );
};

const ExpenseBreakdownPieChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  const { theme } = useTheme();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D'];
  if (!data || data.length === 0) return <div className="text-center py-8 text-lightTextSecondary dark:text-darkTextSecondary">Tidak ada data pengeluaran.</div>;
  
  return (
    <ResponsiveContainer width="100%" height={250}> {/* Adjusted height for mobile */}
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatCurrencyIDR(value)} />
        <Legend wrapperStyle={{fontSize: '12px'}}/>
      </PieChart>
    </ResponsiveContainer>
  );
};

const IncomeExpenseBarChartComponent: React.FC<{ data: IncomeExpenseChartDataPoint[] }> = ({ data }) => {
   if (!data || data.length === 0) return <div className="text-center py-8 text-lightTextSecondary dark:text-darkTextSecondary">Tidak ada data pendapatan/pengeluaran.</div>;
  return (
    <ResponsiveContainer width="100%" height={250}> {/* Adjusted height for mobile */}
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{fontSize: 10}} />
        <YAxis tickFormatter={(value) => `${formatCurrencyIDR(value/1000000)}Jt`} tick={{fontSize: 10}} />
        <Tooltip formatter={(value: number) => formatCurrencyIDR(value)} />
        <Legend wrapperStyle={{fontSize: '12px'}} />
        <Bar dataKey="income" fill="#22c55e" name="Pendapatan" />
        <Bar dataKey="expenses" fill="#ef4444" name="Pengeluaran" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const NetCashFlowLineChart: React.FC<{ data: {name: string; cashFlow: number}[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-center py-8 text-lightTextSecondary dark:text-darkTextSecondary">Tidak ada data arus kas.</div>;
  return (
    <ResponsiveContainer width="100%" height={250}> {/* Adjusted height for mobile */}
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{fontSize: 10}} />
        <YAxis tickFormatter={(value) => `${formatCurrencyIDR(value/1000000)}Jt`} tick={{fontSize: 10}}/>
        <Tooltip formatter={(value: number) => formatCurrencyIDR(value)} />
        <Legend wrapperStyle={{fontSize: '12px'}}/>
        <Line type="monotone" dataKey="cashFlow" stroke="#8884d8" name="Arus Kas Bersih" activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};


const DashboardPage: React.FC = () => {
  const { transactions, categories, accounts, getCategoryById } = useData();

  const monthlySummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        if (tx.type === CategoryType.INCOME) {
          totalIncome += tx.amount;
        } else {
          totalExpenses += tx.amount;
        }
      }
    });
    return { totalIncome, totalExpenses };
  }, [transactions]);

  const overallBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const expenseBreakdownData: ChartDataPoint[] = useMemo(() => {
    const expenseMap = new Map<string, number>();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return tx.type === CategoryType.EXPENSE && 
               txDate.getMonth() === currentMonth && 
               txDate.getFullYear() === currentYear;
      })
      .forEach(tx => {
        const category = getCategoryById(tx.categoryId);
        const categoryName = category ? category.name : 'Lainnya';
        expenseMap.set(categoryName, (expenseMap.get(categoryName) || 0) + tx.amount);
      });
    
    return Array.from(expenseMap, ([name, value]) => {
       const cat = categories.find(c => c.name === name && c.type === CategoryType.EXPENSE);
       let fillColor = undefined;
       // Try to match color from category, if defined
       if(cat && cat.color){
            // Simplified: assuming Tailwind color classes like text-red-500. Need mapping to hex for recharts.
            // This is a placeholder. Real mapping would be more complex or use a library.
            const colorMapping: { [key: string]: string } = {
              'text-red-500': '#EF4444', 'text-blue-500': '#3B82F6', 'text-yellow-500': '#EAB308',
              'text-green-500':'#22C55E', 'text-purple-500': '#A855F7', 'text-pink-500':'#EC4899',
              'text-indigo-500': '#6366F1'
              // Add other colors from COLOR_LIST
            };
            fillColor = colorMapping[cat.color] || undefined;
       }
       return { name, value, fill: fillColor }; 
    });
  }, [transactions, getCategoryById, categories]);
  
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const incomeExpenseChartData: IncomeExpenseChartDataPoint[] = useMemo(() => {
    const dataMap = new Map<string, { income: number, expenses: number }>();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    const currentYear = now.getFullYear();

    // Initialize for the last 6 months including current
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, now.getMonth() - i, 1);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`; // Shorten year
      dataMap.set(monthKey, { income: 0, expenses: 0 });
    }
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      // Only consider transactions within the last 6 months from current month's start
      const sixMonthsAgo = new Date(currentYear, now.getMonth() - 5, 1);
      if (txDate >= sixMonthsAgo) {
          const monthKey = `${monthNames[txDate.getMonth()]} ${txDate.getFullYear().toString().slice(-2)}`;
          if (dataMap.has(monthKey)) {
            const current = dataMap.get(monthKey)!;
            if (tx.type === CategoryType.INCOME) {
              current.income += tx.amount;
            } else {
              current.expenses += tx.amount;
            }
            dataMap.set(monthKey, current);
          }
      }
    });

    return Array.from(dataMap, ([name, values]) => ({ name, ...values }));
  }, [transactions]);


  const netCashFlowData = incomeExpenseChartData.map(d => ({ name: d.name, cashFlow: d.income - d.expenses }));


  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-lightText dark:text-darkText">Dasbor Keuangan</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <SummaryCard title="Pendapatan Bulan Ini" amount={monthlySummary.totalIncome} icon="fas fa-arrow-up" colorClass="text-green-500" />
        <SummaryCard title="Pengeluaran Bulan Ini" amount={monthlySummary.totalExpenses} icon="fas fa-arrow-down" colorClass="text-red-500" />
        <SummaryCard title="Saldo Keseluruhan" amount={overallBalance} icon="fas fa-wallet" colorClass="text-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Rincian Pengeluaran (Bulan Ini)</h2>
          <ExpenseBreakdownPieChart data={expenseBreakdownData} />
        </Card>
        <Card>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Pendapatan vs Pengeluaran (6 Bln)</h2>
          <IncomeExpenseBarChartComponent data={incomeExpenseChartData} />
        </Card>
         <Card className="lg:col-span-2">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Tren Arus Kas Bersih (6 Bln)</h2>
          <NetCashFlowLineChart data={netCashFlowData} />
        </Card>
      </div>

      <Card>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Transaksi Terkini</h2>
        {recentTransactions.length > 0 ? (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {recentTransactions.map(tx => {
              const category = getCategoryById(tx.categoryId);
              return (
                <li key={tx.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm sm:text-base">{tx.description}</p>
                    <p className="text-xs sm:text-sm text-lightTextSecondary dark:text-darkTextSecondary">
                      {formatDateID(tx.date)} - {category?.name || 'Tanpa Kategori'}
                    </p>
                  </div>
                  <p className={`font-semibold text-sm sm:text-base ${tx.type === CategoryType.INCOME ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === CategoryType.INCOME ? '+' : '-'} {formatCurrencyIDR(tx.amount)}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-lightTextSecondary dark:text-darkTextSecondary">Belum ada transaksi.</p>
        )}
      </Card>
    </div>
  );
};


// Transactions Page Components
interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
  initialData?: Transaction;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onClose, initialData }) => {
  const { categories, accounts } = useData();
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [date, setDate] = useState(initialData ? formatDateForInput(initialData.date) : formatDateForInput());
  const [type, setType] = useState<CategoryType>(initialData?.type || CategoryType.EXPENSE);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [accountId, setAccountId] = useState(initialData?.accountId || '');

  const filteredCategories = useMemo(() => categories.filter(c => c.type === type), [categories, type]);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setDate(formatDateForInput(initialData.date));
      setType(initialData.type);
      setCategoryId(initialData.categoryId);
      setAccountId(initialData.accountId);
    } else {
      // Reset for new transaction
      setDescription('');
      setAmount('');
      setDate(formatDateForInput());
      setType(CategoryType.EXPENSE);
      // Set default category and account for new transaction
      setCategoryId(filteredCategories.length > 0 ? filteredCategories[0].id : '');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
    }
  }, [initialData, categories, accounts]); // Added categories and accounts dependency for initial reset
  
   useEffect(() => {
    // This effect handles changes in 'type' or if the initial data itself changes.
    // If type changes, reset categoryId to the first available one for that type.
    const currentCategory = categories.find(c => c.id === categoryId);
    if (!currentCategory || currentCategory.type !== type) {
        setCategoryId(filteredCategories.length > 0 ? filteredCategories[0].id : '');
    }
    // If no accountId is set, or if the initialData accountId is being loaded,
    // and there are accounts, set to the first account.
    if (accounts.length > 0 && (!accountId || (initialData && accountId !== initialData.accountId))) {
        if (!accounts.find(acc=> acc.id === accountId)) { // If current accountId is not valid
             setAccountId(accounts[0].id);
        } else if (!accountId) { // If accountId is just empty
            setAccountId(accounts[0].id);
        }
    }
  }, [type, filteredCategories, accounts, initialData, categoryId, accountId]); // Added accountId to dependencies


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !categoryId || !accountId) {
      alert('Harap isi semua kolom yang diperlukan.');
      return;
    }
    onSubmit({
      description,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      type,
      categoryId,
      accountId
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <Input label="Deskripsi" value={description} onChange={e => setDescription(e.target.value)} required />
      <Input type="number" label="Jumlah (IDR)" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Contoh: 50000"/>
      <Input type="date" label="Tanggal" value={date} onChange={e => setDate(e.target.value)} required />
      <Select label="Tipe" value={type} onChange={e => setType(e.target.value as CategoryType)}>
        <option value={CategoryType.EXPENSE}>Pengeluaran</option>
        <option value={CategoryType.INCOME}>Pemasukan</option>
      </Select>
      <Select label="Kategori" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
        <option value="" disabled={filteredCategories.length > 0}>Pilih Kategori</option>
        {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
         {filteredCategories.length === 0 && <option value="" disabled>Tidak ada kategori {type === CategoryType.EXPENSE ? 'pengeluaran' : 'pemasukan'}</option>}
      </Select>
      <Select label="Akun" value={accountId} onChange={e => setAccountId(e.target.value)} required>
        <option value="" disabled={accounts.length > 0}>Pilih Akun</option>
        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrencyIDR(acc.balance)})</option>)}
        {accounts.length === 0 && <option value="" disabled>Tidak ada akun</option>}
      </Select>
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} size="md">Batal</Button>
        <Button type="submit" variant="primary" size="md">{initialData ? 'Simpan' : 'Tambah'}</Button>
      </div>
    </form>
  );
};

const TransactionsPage: React.FC = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, getCategoryById, getAccountById } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModal = (transaction?: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTransaction(undefined);
    setIsModalOpen(false);
  };

  const handleSubmitTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      updateTransaction({ ...editingTransaction, ...transactionData });
    } else {
      addTransaction(transactionData);
    }
    handleCloseModal();
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      deleteTransaction(transactionId);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getCategoryById(tx.categoryId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getAccountById(tx.accountId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm, getCategoryById, getAccountById]);


  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-lightText dark:text-darkText">Manajemen Transaksi</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="md">
          <i className="fas fa-plus mr-1 sm:mr-2"></i><span className="hidden sm:inline">Tambah</span> Transaksi
        </Button>
      </div>
      
      <Input 
        type="text"
        placeholder="Cari (deskripsi, kategori, akun)..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-full sm:max-w-md"
      />

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}>
        <TransactionForm onSubmit={handleSubmitTransaction} onClose={handleCloseModal} initialData={editingTransaction} />
      </Modal>

      <Card className="overflow-x-auto p-0 sm:p-0"> {/* Adjusted padding for table */}
        {filteredTransactions.length > 0 ? (
          <table className="w-full min-w-[700px]"> {/* Increased min-width slightly */}
            <thead className="border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left p-2 sm:p-3 font-semibold text-lightText dark:text-darkText text-xs sm:text-sm">Tanggal</th>
                <th className="text-left p-2 sm:p-3 font-semibold text-lightText dark:text-darkText text-xs sm:text-sm">Deskripsi</th>
                <th className="text-left p-2 sm:p-3 font-semibold text-lightText dark:text-darkText text-xs sm:text-sm">Kategori</th>
                <th className="text-left p-2 sm:p-3 font-semibold text-lightText dark:text-darkText text-xs sm:text-sm">Akun</th>
                <th className="text-right p-2 sm:p-3 font-semibold text-lightText dark:text-darkText text-xs sm:text-sm">Jumlah</th>
                <th className="text-center p-2 sm:p-3 font-semibold text-lightText dark:text-darkText text-xs sm:text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => {
                const category = getCategoryById(tx.categoryId);
                const account = getAccountById(tx.accountId);
                return (
                  <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs sm:text-sm">
                    <td className="p-2 sm:p-3 text-lightTextSecondary dark:text-darkTextSecondary whitespace-nowrap">{formatDateID(tx.date)}</td>
                    <td className="p-2 sm:p-3 text-lightText dark:text-darkText">{tx.description}</td>
                    <td className="p-2 sm:p-3">
                      <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${category?.color ? category.color.replace('text-','bg-').replace('-500', '-100 dark:'+category.color.replace('text-','bg-').replace('-500', '-800') ) : 'bg-gray-200 dark:bg-gray-600'} ${category?.color ? category.color.replace('-500', '-700 dark:'+category.color.replace('-500', '-300')) : 'text-gray-800 dark:text-gray-200'}`}>
                        <i className={`${category?.icon || 'fas fa-tag'} mr-1`}></i>{category?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3 text-lightTextSecondary dark:text-darkTextSecondary">{account?.name || 'N/A'}</td>
                    <td className={`p-2 sm:p-3 text-right font-medium whitespace-nowrap ${tx.type === CategoryType.INCOME ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {tx.type === CategoryType.INCOME ? '+' : '-'} {formatCurrencyIDR(tx.amount)}
                    </td>
                    <td className="p-1 sm:p-3 text-center space-x-0 sm:space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(tx)} className="p-1 text-blue-500 hover:text-blue-700">
                        <i className="fas fa-edit"></i><span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTransaction(tx.id)} className="p-1 text-red-500 hover:text-red-700">
                        <i className="fas fa-trash"></i><span className="sr-only">Hapus</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-8 text-lightTextSecondary dark:text-darkTextSecondary">Belum ada transaksi yang cocok.</p>
        )}
      </Card>
    </div>
  );
};

// Budgets Page (Simplified)
interface BudgetFormProps {
  onSubmit: (budget: Omit<Budget, 'id'>) => void;
  onClose: () => void;
  initialData?: Budget;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ onSubmit, onClose, initialData }) => {
  const { categories } = useData();
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [period, setPeriod] = useState<BudgetPeriod>(initialData?.period || BudgetPeriod.MONTHLY);
  const [startDate, setStartDate] = useState(initialData ? formatDateForInput(initialData.startDate) : formatDateForInput(new Date(new Date().setDate(1)).toISOString()));


  const expenseCategories = useMemo(() => categories.filter(c => c.type === CategoryType.EXPENSE), [categories]);

  useEffect(() => {
    if (initialData) {
        setCategoryId(initialData.categoryId);
        setAmount(initialData.amount.toString());
        setPeriod(initialData.period);
        setStartDate(formatDateForInput(initialData.startDate));
    } else {
        setCategoryId(expenseCategories.length > 0 ? expenseCategories[0].id : '');
        setAmount('');
        setPeriod(BudgetPeriod.MONTHLY);
        setStartDate(formatDateForInput(new Date(new Date().setDate(1)).toISOString()));
    }
  }, [initialData, expenseCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount || !period || !startDate) {
      alert('Harap isi semua kolom.');
      return;
    }
    onSubmit({
      categoryId,
      amount: parseFloat(amount),
      period,
      startDate: new Date(startDate).toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <Select label="Kategori Pengeluaran" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
        <option value="" disabled={expenseCategories.length > 0}>Pilih Kategori</option>
        {expenseCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        {expenseCategories.length === 0 && <option value="" disabled>Tidak ada kategori pengeluaran</option>}
      </Select>
      <Input type="number" label="Jumlah Anggaran (IDR)" value={amount} onChange={e => setAmount(e.target.value)} required />
      <Select label="Periode" value={period} onChange={e => setPeriod(e.target.value as BudgetPeriod)}>
        <option value={BudgetPeriod.MONTHLY}>Bulanan</option>
        <option value={BudgetPeriod.YEARLY}>Tahunan</option>
      </Select>
      <Input type="date" label="Tanggal Mulai" value={startDate} onChange={e => setStartDate(e.target.value)} required />
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} size="md">Batal</Button>
        <Button type="submit" variant="primary" size="md">{initialData ? 'Simpan' : 'Tambah'}</Button>
      </div>
    </form>
  );
};


const BudgetsPage: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, getCategoryById, transactions } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);

  const handleOpenModal = (budget?: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setEditingBudget(undefined);
    setIsModalOpen(false);
  };
  const handleSubmitBudget = (budgetData: Omit<Budget, 'id'>) => {
    if (editingBudget) {
      updateBudget({ ...editingBudget, ...budgetData });
    } else {
      addBudget(budgetData);
    }
    handleCloseModal();
  };
  const handleDeleteBudget = (budgetId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus anggaran ini?')) {
      deleteBudget(budgetId);
    }
  };

  const getActualSpending = useCallback((budget: Budget): number => {
    const budgetStartDate = new Date(budget.startDate);
    const budgetEndDate = new Date(budgetStartDate);
    if (budget.period === BudgetPeriod.MONTHLY) {
      budgetEndDate.setMonth(budgetEndDate.getMonth() + 1);
    } else { // Yearly
      budgetEndDate.setFullYear(budgetEndDate.getFullYear() + 1);
    }

    return transactions
      .filter(tx => 
        tx.categoryId === budget.categoryId && 
        tx.type === CategoryType.EXPENSE &&
        new Date(tx.date) >= budgetStartDate &&
        new Date(tx.date) < budgetEndDate
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-lightText dark:text-darkText">Manajemen Anggaran</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="md">
            <i className="fas fa-plus mr-1 sm:mr-2"></i><span className="hidden sm:inline">Tambah</span> Anggaran
        </Button>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingBudget ? 'Edit Anggaran' : 'Tambah Anggaran'}>
        <BudgetForm onSubmit={handleSubmitBudget} onClose={handleCloseModal} initialData={editingBudget} />
      </Modal>

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {budgets.map(budget => {
            const category = getCategoryById(budget.categoryId);
            const actualSpending = getActualSpending(budget);
            const progress = budget.amount > 0 ? (actualSpending / budget.amount) * 100 : 0;
            const remaining = budget.amount - actualSpending;
            
            let progressBarColor = 'bg-green-500';
            if (progress > 75 && progress <= 100) progressBarColor = 'bg-yellow-500';
            if (progress > 100) progressBarColor = 'bg-red-500';

            return (
              <Card key={budget.id} className="p-3 sm:p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-md sm:text-lg font-semibold text-lightText dark:text-darkText">{category?.name || 'N/A'}</h3>
                        <p className="text-xs sm:text-sm text-lightTextSecondary dark:text-darkTextSecondary">Periode: {budget.period === BudgetPeriod.MONTHLY ? 'Bulanan' : 'Tahunan'}</p>
                        <p className="text-xs sm:text-sm text-lightTextSecondary dark:text-darkTextSecondary">Mulai: {formatDateID(budget.startDate)}</p>
                    </div>
                     <div className="space-x-0 sm:space-x-1 flex">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(budget)} className="p-1 text-xs text-blue-500 hover:text-blue-700"><i className="fas fa-edit"></i></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteBudget(budget.id)} className="p-1 text-xs text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></Button>
                    </div>
                </div>
                
                <div className="mt-3 sm:mt-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-1 text-lightText dark:text-darkText">
                    <span>{formatCurrencyIDR(actualSpending)}</span>
                    <span>{formatCurrencyIDR(budget.amount)}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 sm:h-2.5">
                    <div className={`${progressBarColor} h-2 sm:h-2.5 rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                  </div>
                   <p className={`text-xs sm:text-sm mt-1 ${remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {remaining >=0 ? `Sisa: ${formatCurrencyIDR(remaining)}` : `Lebih: ${formatCurrencyIDR(Math.abs(remaining))}`}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-8">
            <i className="fas fa-folder-open text-3xl sm:text-4xl text-slate-400 dark:text-slate-500 mb-3 sm:mb-4"></i>
            <p className="text-sm text-lightTextSecondary dark:text-darkTextSecondary">Belum ada anggaran yang dibuat.</p>
        </Card>
      )}
    </div>
  );
};

const ReportsPage: React.FC = () => {
  const { transactions, getCategoryById, categories } = useData(); // Added categories
  const cashFlow = useMemo(() => {
    let income = 0;
    let expenses = 0;
    transactions.forEach(tx => {
      if (tx.type === CategoryType.INCOME) income += tx.amount;
      else expenses += tx.amount;
    });
    return { income, expenses, net: income - expenses };
  }, [transactions]);

  const expenseByCategory: ChartDataPoint[] = useMemo(() => {
    const categoryMap = new Map<string, {value: number, fill?: string}>();
    transactions.filter(tx => tx.type === CategoryType.EXPENSE).forEach(tx => {
      const category = getCategoryById(tx.categoryId);
      const name = category?.name || 'Lain-lain';
      const current = categoryMap.get(name) || { value: 0 };
      current.value += tx.amount;
      // Assign fill color for pie chart based on category color
      if(category && category.color){
            const colorMapping: { [key: string]: string } = {
              'text-red-500': '#EF4444', 'text-orange-500': '#F97316', 'text-amber-500': '#F59E0B',
              'text-yellow-500': '#EAB308', 'text-lime-500': '#84CC16', 'text-green-500':'#22C55E', 
              'text-emerald-500': '#10B981', 'text-teal-500': '#14B8A6', 'text-cyan-500': '#06B6D4',
              'text-sky-500': '#0EA5E9', 'text-blue-500': '#3B82F6', 'text-indigo-500': '#6366F1',
              'text-violet-500': '#8B5CF6', 'text-purple-500': '#A855F7', 'text-fuchsia-500': '#D946EF',
              'text-pink-500':'#EC4899', 'text-rose-500': '#F43F5E'
            };
            current.fill = colorMapping[category.color] || undefined;
      }
      categoryMap.set(name, current);
    });
    return Array.from(categoryMap, ([name, data]) => ({ name, value: data.value, fill: data.fill }));
  }, [transactions, getCategoryById, categories]); // Added categories

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-lightText dark:text-darkText">Laporan Keuangan</h1>
      <Card>
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-lightText dark:text-darkText">Laporan Arus Kas (Keseluruhan)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs sm:text-sm text-lightTextSecondary dark:text-darkTextSecondary">Total Pemasukan</p>
            <p className="text-xl sm:text-2xl font-semibold text-green-500">{formatCurrencyIDR(cashFlow.income)}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-lightTextSecondary dark:text-darkTextSecondary">Total Pengeluaran</p>
            <p className="text-xl sm:text-2xl font-semibold text-red-500">{formatCurrencyIDR(cashFlow.expenses)}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-lightTextSecondary dark:text-darkTextSecondary">Arus Kas Bersih</p>
            <p className={`text-xl sm:text-2xl font-semibold ${cashFlow.net >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>{formatCurrencyIDR(cashFlow.net)}</p>
          </div>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-lightText dark:text-darkText">Pengeluaran per Kategori (Keseluruhan)</h2>
        <ExpenseBreakdownPieChart data={expenseByCategory} />
      </Card>
    </div>
  );
};

// Settings Page Components
const CategoryManagement: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, transactions } = useData(); // Added transactions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(CategoryType.EXPENSE);
  const [icon, setIcon] = useState(ICON_LIST[0]);
  const [color, setColor] = useState(COLOR_LIST[0]);

  const handleOpenModal = (category?: Category) => {
    setEditingCategory(category);
    setName(category?.name || '');
    setType(category?.type || CategoryType.EXPENSE);
    setIcon(category?.icon || ICON_LIST[0]);
    setColor(category?.color || COLOR_LIST[0]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCategory(undefined);
    setIsModalOpen(false);
    setName('');
    setType(CategoryType.EXPENSE);
    setIcon(ICON_LIST[0]);
    setColor(COLOR_LIST[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const categoryData = { name, type, icon, color };
    if (editingCategory) {
      updateCategory({ ...editingCategory, ...categoryData });
    } else {
      addCategory(categoryData);
    }
    handleCloseModal();
  };

  const handleDelete = (categoryId: string) => {
    if (transactions.some(tx => tx.categoryId === categoryId)) {
      alert('Kategori ini tidak dapat dihapus karena memiliki transaksi terkait.');
      return;
    }
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      deleteCategory(categoryId);
    }
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-semibold text-lightText dark:text-darkText">Manajemen Kategori</h2>
        <Button onClick={() => handleOpenModal()} variant="primary" size="md">
            <i className="fas fa-plus mr-1 sm:mr-2"></i><span className="hidden sm:inline">Tambah</span> Kategori
        </Button>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <Input label="Nama Kategori" value={name} onChange={e => setName(e.target.value)} required />
          <Select label="Tipe Kategori" value={type} onChange={e => setType(e.target.value as CategoryType)}>
            <option value={CategoryType.EXPENSE}>Pengeluaran</option>
            <option value={CategoryType.INCOME}>Pemasukan</option>
          </Select>
          <Select label="Ikon" value={icon} onChange={e => setIcon(e.target.value)}>
            {ICON_LIST.map(ic => <option key={ic} value={ic}><i className={`${ic} mr-2`}></i> {ic.split('fa-')[1]?.replace(/-/g, ' ') || ic}</option>)}
          </Select>
           <Select label="Warna (Tailwind Class)" value={color} onChange={e => setColor(e.target.value)}>
            {COLOR_LIST.map(c => <option key={c} value={c} className={`${c} font-medium`}>{c.split('-')[1]} {c.split('-')[2]}</option>)}
          </Select>
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleCloseModal} size="md">Batal</Button>
            <Button type="submit" variant="primary" size="md">{editingCategory ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>
      <ul className="space-y-2">
        {categories.map(cat => (
          <li key={cat.id} className="flex justify-between items-center p-2 sm:p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
            <div className="flex items-center overflow-hidden">
              <i className={`${cat.icon} ${cat.color} text-lg sm:text-xl mr-2 sm:mr-3 w-5 sm:w-6 text-center`}></i>
              <div className="overflow-hidden whitespace-nowrap text-ellipsis">
                <span className="text-sm sm:text-base text-lightText dark:text-darkText">{cat.name}</span>
                <span className="text-xs text-lightTextSecondary dark:text-darkTextSecondary hidden sm:inline"> ({cat.type === CategoryType.INCOME ? 'Pemasukan' : 'Pengeluaran'})</span>
              </div>
            </div>
            <div className="space-x-0 sm:space-x-1 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => handleOpenModal(cat)} className="p-1 text-blue-500"><i className="fas fa-edit"></i></Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDelete(cat.id)} 
                className="p-1 text-red-500"
                disabled={transactions.some(tx => tx.categoryId === cat.id)}
                title={transactions.some(tx => tx.categoryId === cat.id) ? "Kategori tidak dapat dihapus jika memiliki transaksi terkait." : ""}
              >
                <i className="fas fa-trash"></i>
              </Button>
            </div>
          </li>
        ))}
         {categories.length === 0 && <p className="text-center py-4 text-sm text-lightTextSecondary dark:text-darkTextSecondary">Belum ada kategori.</p>}
      </ul>
    </Card>
  );
};

const AccountManagement: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, transactions } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>(AccountType.BANK);
  const [balance, setBalance] = useState('');
  const [icon, setIcon] = useState(ACCOUNT_TYPE_OPTIONS.find(opt => opt.value === AccountType.BANK)?.icon || 'fas fa-university');


  const handleOpenModal = (account?: Account) => {
    setEditingAccount(account);
    setName(account?.name || '');
    setType(account?.type || AccountType.BANK);
    setBalance(account?.balance?.toString() || '0');
    setIcon(account?.icon || ACCOUNT_TYPE_OPTIONS.find(opt => opt.value === (account?.type || AccountType.BANK))?.icon || 'fas fa-university');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingAccount(undefined);
    setIsModalOpen(false);
    setName('');
    setType(AccountType.BANK);
    setBalance('');
    setIcon(ACCOUNT_TYPE_OPTIONS.find(opt => opt.value === AccountType.BANK)?.icon || 'fas fa-university');
  };

  const handleTypeChange = (newType: AccountType) => {
    setType(newType);
    const selectedOption = ACCOUNT_TYPE_OPTIONS.find(opt => opt.value === newType);
    if (selectedOption) setIcon(selectedOption.icon);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || balance === '') return; 
    const accountData = { name, type, balance: parseFloat(balance), icon };
    if (editingAccount) {
      updateAccount({ ...editingAccount, ...accountData });
    } else {
      addAccount(accountData);
    }
    handleCloseModal();
  };
  
  return (
    <Card>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-semibold text-lightText dark:text-darkText">Manajemen Akun</h2>
        <Button onClick={() => handleOpenModal()} variant="primary" size="md">
          <i className="fas fa-plus mr-1 sm:mr-2"></i><span className="hidden sm:inline">Tambah</span> Akun
        </Button>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingAccount ? 'Edit Akun' : 'Tambah Akun'}>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <Input label="Nama Akun" value={name} onChange={e => setName(e.target.value)} required />
          <Select label="Tipe Akun" value={type} onChange={e => handleTypeChange(e.target.value as AccountType)}>
            {ACCOUNT_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
          <Input type="number" label="Saldo Awal/Saat Ini (IDR)" value={balance} onChange={e => setBalance(e.target.value)} required 
            disabled={!!editingAccount && transactions.some(tx => tx.accountId === editingAccount.id)}
            title={!!editingAccount && transactions.some(tx => tx.accountId === editingAccount.id) ? "Saldo tidak dapat diubah jika akun sudah memiliki transaksi. Ubah melalui transaksi." : ""}
          />
          <Select label="Ikon" value={icon} onChange={e => setIcon(e.target.value)}>
            {ICON_LIST.map(ic => <option key={ic} value={ic}><i className={`${ic} mr-2`}></i> {ic.split('fa-')[1]?.replace(/-/g, ' ') || ic}</option>)}
          </Select>
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleCloseModal} size="md">Batal</Button>
            <Button type="submit" variant="primary" size="md">{editingAccount ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>
      <ul className="space-y-2">
        {accounts.map(acc => (
          <li key={acc.id} className="flex justify-between items-center p-2 sm:p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
            <div className="flex items-center overflow-hidden">
              <i className={`${acc.icon || 'fas fa-question-circle'} text-primary text-lg sm:text-xl mr-2 sm:mr-3 w-5 sm:w-6 text-center`}></i>
              <div className="overflow-hidden whitespace-nowrap text-ellipsis">
                <p className="font-medium text-sm sm:text-base text-lightText dark:text-darkText">{acc.name} <span className="text-xs text-lightTextSecondary dark:text-darkTextSecondary">({acc.type})</span></p>
                <p className="text-xs sm:text-sm text-lightText dark:text-darkText">{formatCurrencyIDR(acc.balance)}</p>
              </div>
            </div>
            <div className="space-x-0 sm:space-x-1 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => handleOpenModal(acc)} className="p-1 text-blue-500"><i className="fas fa-edit"></i></Button>
              <Button variant="ghost" size="sm" onClick={() => deleteAccount(acc.id)} className="p-1 text-red-500"
                disabled={transactions.some(tx => tx.accountId === acc.id)}
                title={transactions.some(tx => tx.accountId === acc.id) ? "Akun tidak dapat dihapus jika memiliki transaksi terkait." : ""}
              ><i className="fas fa-trash"></i></Button>
            </div>
          </li>
        ))}
        {accounts.length === 0 && <p className="text-center py-4 text-sm text-lightTextSecondary dark:text-darkTextSecondary">Belum ada akun.</p>}
      </ul>
    </Card>
  );
};

const PreferencesSettings: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [language, setLanguage] = useState('id');
    const [currency, setCurrency] = useState('IDR');
    const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

    return (
        <Card>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-lightText dark:text-darkText">Preferensi Aplikasi</h2>
            <div className="space-y-4 sm:space-y-6">
                <div>
                    <label className="block text-sm font-medium text-lightTextSecondary dark:text-darkTextSecondary mb-1">Tema Aplikasi</label>
                    <Button onClick={toggleTheme} variant="secondary" size="md">
                        Mode {theme === ThemeMode.LIGHT ? 'Gelap' : 'Terang'}
                    </Button>
                </div>
                <Select label="Bahasa (UI Placeholder)" value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en" disabled>English (Soon)</option>
                </Select>
                 <Select label="Mata Uang (UI Placeholder)" value={currency} onChange={e => setCurrency(e.target.value)}>
                    <option value="IDR">Rupiah (IDR)</option>
                    <option value="USD" disabled>US Dollar (USD) (Soon)</option>
                </Select>
                <Select label="Format Tanggal (UI Placeholder)" value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="DD MonthName YYYY" disabled>DD NamaBulan YYYY (Soon)</option>
                </Select>
            </div>
        </Card>
    );
};

const DataManagementSettings: React.FC = () => {
    const { resetAllData } = useData();
    return (
        <Card>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-lightText dark:text-darkText">Manajemen Data</h2>
            <div className="space-y-3 sm:space-y-4">
                <Button variant="secondary" className="w-full" size="md" onClick={() => alert('Fitur Impor CSV akan segera hadir!')}>
                    <i className="fas fa-file-import mr-2"></i>Impor Data dari CSV
                </Button>
                <Button variant="secondary" className="w-full" size="md" onClick={() => alert('Fitur Ekspor CSV akan segera hadir!')}>
                    <i className="fas fa-file-export mr-2"></i>Ekspor Data ke CSV
                </Button>
                <Button variant="danger" className="w-full" size="md" onClick={resetAllData}>
                    <i className="fas fa-trash-alt mr-2"></i>Reset Semua Data
                </Button>
                <p className="text-xs text-red-500 text-center">Perhatian: Reset data akan menghapus semua data Anda secara permanen.</p>
            </div>
        </Card>
    );
};

const ProfileSettings: React.FC = () => {
    const { user } = useAuth();
    const [currentEmail, setCurrentEmail] = useState(user?.email || '');
    
    return (
        <Card>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-lightText dark:text-darkText">Pengaturan Profil</h2>
            <form className="space-y-3 sm:space-y-4">
                <Input label="Email Terdaftar" type="email" value={currentEmail} readOnly disabled className="bg-slate-100 dark:bg-slate-700"/>
                <Input label="Kata Sandi Baru (UI Placeholder)" type="password" placeholder="Masukkan kata sandi baru"/>
                <Input label="Konfirmasi Kata Sandi (UI Placeholder)" type="password" placeholder="Konfirmasi kata sandi baru"/>
                <Button variant="primary" size="md" onClick={() => alert('Fungsi ubah profil akan segera hadir!')}>Simpan Perubahan</Button>
            </form>
        </Card>
    );
};


const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'categories' | 'accounts' | 'data'>('categories');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSettings />;
      case 'preferences': return <PreferencesSettings />;
      case 'categories': return <CategoryManagement />;
      case 'accounts': return <AccountManagement />;
      case 'data': return <DataManagementSettings />;
      default: return null;
    }
  };

  const TabButton: React.FC<PropsWithChildren<{tabKey: typeof activeTab, icon: string}>> = ({ tabKey, icon, children }) => (
    <button
        onClick={() => setActiveTab(tabKey)}
        className={`flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2.5 rounded-md font-medium transition-colors text-xs sm:text-sm whitespace-nowrap
            ${activeTab === tabKey 
                ? 'bg-primary text-white' 
                : 'text-lightTextSecondary dark:text-darkTextSecondary hover:bg-slate-200 dark:hover:bg-slate-700'}`}
    >
        <i className={`${icon} w-4 sm:w-5 text-center`}></i>
        <span className="hidden sm:inline">{children}</span>
        <span className="sm:hidden">{children.toString().split(' ')[0]}</span> {/* Show first word on very small screens */}
    </button>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-lightText dark:text-darkText">Pengaturan</h1>
      <div className="flex flex-col md:flex-row md:space-x-4 lg:space-x-6 space-y-4 md:space-y-0">
        <nav className="md:w-1/4 lg:w-1/5 xl:w-1/6 flex flex-row md:flex-col overflow-x-auto pb-2 md:pb-0 md:space-x-0 space-x-2 md:space-y-1.5">
            <TabButton tabKey="categories" icon="fas fa-tags">Kategori</TabButton>
            <TabButton tabKey="accounts" icon="fas fa-credit-card">Akun</TabButton>
            <TabButton tabKey="preferences" icon="fas fa-sliders-h">Preferensi</TabButton>
            <TabButton tabKey="data" icon="fas fa-database">Data</TabButton>
            <TabButton tabKey="profile" icon="fas fa-user-cog">Profil</TabButton>
        </nav>
        <div className="md:w-3/4 lg:w-4/5 xl:w-5/6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};


// APP ROOT
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <HashRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/budgets" element={<BudgetsPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </HashRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
