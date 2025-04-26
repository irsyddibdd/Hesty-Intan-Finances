// Google Sheets API Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const API_KEY = 'YOUR_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

// Sheets configuration
const SHEETS = {
    CATEGORIES: 'Categories',
    EXPENSES: 'Expenses',
    REPORTS: 'Reports'
};

// Initialize Google API client
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    }).then(function() {
        // Listen for sign-in state changes
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        // Handle initial sign-in state
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
}

// Load Google API client
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

// Update UI based on sign-in status
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        // User is signed in, load data from Sheets
        loadData();
    } else {
        // User is not signed in, show sign-in button
        showSignInButton();
    }
}

// Show sign-in button
function showSignInButton() {
    const signInBtn = document.createElement('button');
    signInBtn.className = 'btn-primary text-white px-4 py-2 rounded-lg fixed bottom-4 left-4';
    signInBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In with Google';
    signInBtn.onclick = handleAuthClick;
    document.body.appendChild(signInBtn);
}

// Handle sign-in
function handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn();
}

// Handle sign-out
function handleSignoutClick() {
    gapi.auth2.getAuthInstance().signOut();
}

// Load data from Google Sheets
function loadData() {
    // Load categories
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.CATEGORIES}!A2:E`
    }).then(function(response) {
        const categories = response.result.values || [];
        renderCategories(categories);
    });

    // Load expenses
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.EXPENSES}!A2:E`
    }).then(function(response) {
        const expenses = response.result.values || [];
        renderExpenses(expenses);
    });

    // Load reports
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.REPORTS}!A2:D`
    }).then(function(response) {
        const reports = response.result.values || [];
        updateDashboard(reports);
    });
}

// Render categories from Google Sheets data
function renderCategories(categories) {
    const container = document.getElementById('budget-categories');
    container.innerHTML = '';

    categories.forEach(category => {
        const [name, description, budget, spent, icon] = category;
        const percentage = Math.min(100, (parseFloat(spent) / parseFloat(budget)) * 100);
        const categoryClass = getCategoryClass(icon);
        
        const categoryHtml = `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center">
                    <div class="category-icon ${categoryClass} mr-2">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <div>
                        <h4 class="font-medium">${name}</h4>
                        <p class="text-sm text-gray-500">${description || 'Tidak ada deskripsi'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold">Rp ${formatNumber(budget)}</p>
                    <div class="progress-bar mt-1 w-32">
                        <div class="progress-fill ${getProgressClass(percentage)}" style="width: ${percentage}%;"></div>
                    </div>
                    <p class="text-xs text-gray-500">Rp ${formatNumber(spent)} terpakai</p>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', categoryHtml);
    });
}

// Render expenses from Google Sheets data
function renderExpenses(expenses) {
    const container = document.getElementById('expense-list');
    container.innerHTML = '';

    expenses.forEach(expense => {
        const [date, category, description, amount] = expense;
        const categoryDetails = getCategoryDetails(category);
        const displayDate = new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const expenseHtml = `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-2">${displayDate}</td>
                <td class="py-3 px-2">
                    <div class="flex items-center">
                        <div class="category-icon ${categoryDetails.class} mr-2">
                            <i class="fas fa-${categoryDetails.icon}"></i>
                        </div>
                        ${categoryDetails.name}
                    </div>
                </td>
                <td class="py-3 px-2">${description || 'Tidak ada deskripsi'}</td>
                <td class="py-3 px-2 text-right text-red-500 font-medium">Rp ${formatNumber(amount)}</td>
                <td class="py-3 px-2 text-right">
                    <button class="text-gray-500 hover:text-pink-500 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-gray-500 hover:text-pink-500">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        
        if (container.firstChild) {
            container.insertBefore(createElementFromHTML(expenseHtml), container.firstChild);
        } else {
            container.innerHTML = expenseHtml;
        }
    });
}

// Update dashboard with data from Google Sheets
function updateDashboard(reports) {
    // Update summary cards
    if (reports.length > 0) {
        const [totalBalance, monthlyBudget, savingsGoal] = reports[0];
        document.getElementById('total-balance').textContent = `Rp ${formatNumber(totalBalance)}`;
        document.getElementById('monthly-budget').textContent = `Rp ${formatNumber(monthlyBudget)}`;
        document.getElementById('savings-goal').textContent = `Rp ${formatNumber(savingsGoal)}`;
    }
}

// Save data to Google Sheets
function saveToGoogleSheets(sheetName, data) {
    const values = Object.values(data);
    
    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [values]
        }
    }).then(function(response) {
        console.log(`${sheetName} data saved:`, response.result);
        showNotification('Data berhasil disimpan!', 'success');
        loadData(); // Refresh data
    }, function(reason) {
        console.error('Error saving data:', reason.result.error.message);
        showNotification('Gagal menyimpan data!', 'error');
    });
}

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Load Google API client
    handleClientLoad();
    
    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    mobileMenuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });
    
    // Category Modal
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryModal = document.getElementById('category-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    addCategoryBtn.addEventListener('click', function() {
        categoryModal.classList.remove('hidden');
    });
    
    closeModalBtn.addEventListener('click', function() {
        categoryModal.classList.add('hidden');
    });
    
    cancelBtn.addEventListener('click', function() {
        categoryModal.classList.add('hidden');
    });
    
    // Icon Selection
    const iconButtons = document.querySelectorAll('[data-icon]');
    const selectedIconInput = document.getElementById('selected-icon');
    
    iconButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            iconButtons.forEach(btn => {
                btn.classList.remove('ring-2', 'ring-pink-500');
            });
            
            // Add active class to clicked button
            this.classList.add('ring-2', 'ring-pink-500');
            
            // Update hidden input value
            selectedIconInput.value = this.getAttribute('data-icon');
        });
    });
    
    // Form Submission - Add Category
    const categoryForm = document.getElementById('category-form');
    
    categoryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('category-name').value;
        const description = document.getElementById('category-description').value;
        const budget = document.getElementById('category-budget').value;
        const icon = document.getElementById('selected-icon').value;
        
        // Save to Google Sheets
        saveToGoogleSheets(SHEETS.CATEGORIES, {
            name: name,
            description: description,
            budget: budget,
            spent: 0,
            icon: icon
        });
        
        // Reset form and close modal
        categoryForm.reset();
        categoryModal.classList.add('hidden');
    });
    
    // Expense Form Submission
    const expenseForm = document.getElementById('expense-form');
    
    expenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = document.getElementById('expense-amount').value;
        const category = document.getElementById('expense-category').value;
        const date = document.getElementById('expense-date').value;
        const description = document.getElementById('expense-description').value;
        
        // Save to Google Sheets
        saveToGoogleSheets(SHEETS.EXPENSES, {
            date: date,
            category: category,
            description: description,
            amount: amount
        });
        
        // Reset form
        expenseForm.reset();
        
        // Check for budget alerts
        checkBudgetAlerts(category, parseFloat(amount));
    });
    
    // Report Form - Show/Hide Custom Date Range
    const timePeriodSelect = document.getElementById('time-period');
    const customRangeFields = document.getElementById('custom-range-fields');
    
    timePeriodSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customRangeFields.style.display = 'grid';
        } else {
            customRangeFields.style.display = 'none';
        }
    });
    
    // Initialize date fields
    const today = new Date();
    document.getElementById('expense-date').valueAsDate = today;
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('start-date').valueAsDate = firstDayOfMonth;
    document.getElementById('end-date').valueAsDate = today;
    
    // Initialize Charts
    initializeCharts();
    
    // Helper Functions
    function formatNumber(num) {
        return new Intl.NumberFormat('id-ID').format(num);
    }
    
    function getCategoryClass(icon) {
        const map = {
            'utensils': 'food',
            'car': 'transport',
            'home': 'housing',
            'film': 'entertainment',
            'shopping-bag': 'shopping',
            'lightbulb': 'utilities',
            'heartbeat': 'health',
            'ellipsis-h': 'other'
        };
        return map[icon] || 'other';
    }
    
    function getCategoryDetails(category) {
        const map = {
            'food': { name: 'Makanan & Restoran', class: 'food', icon: 'utensils' },
            'transport': { name: 'Transportasi', class: 'transport', icon: 'car' },
            'housing': { name: 'Perumahan', class: 'housing', icon: 'home' },
            'entertainment': { name: 'Hiburan', class: 'entertainment', icon: 'film' },
            'shopping': { name: 'Belanja', class: 'shopping', icon: 'shopping-bag' },
            'utilities': { name: 'Utilitas', class: 'utilities', icon: 'lightbulb' },
            'health': { name: 'Kesehatan', class: 'health', icon: 'heartbeat' },
            'other': { name: 'Lainnya', class: 'other', icon: 'ellipsis-h' }
        };
        return map[category] || map['other'];
    }
    
    function getProgressClass(percentage) {
        if (percentage > 80) return 'danger';
        if (percentage > 50) return 'warning';
        return 'safe';
    }
    
    function createElementFromHTML(htmlString) {
        const div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    }
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    function checkBudgetAlerts(category, amount) {
        // In a real app, we would check against the actual budget from Google Sheets
        // For demo, we'll just show an alert for entertainment category
        if (category === 'entertainment') {
            const alertBox = document.createElement('div');
            alertBox.className = 'fixed top-4 right-4 card p-4 bg-red-50 border-l-4 border-red-500 rounded max-w-xs alert';
            alertBox.innerHTML = `
                <div class="flex">
                    <div class="flex-shrink-0 text-red-500">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700">
                            Peringatan! Anda telah melebihi anggaran Hiburan sebesar Rp 300.000. Pertimbangkan untuk mengurangi pengeluaran di kategori ini.
                        </p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(alertBox);
            
            setTimeout(() => {
                alertBox.remove();
            }, 5000);
        }
    }
    
    // Chart Functions
    let expenseChart, trendChart, budgetChart, reportPieChart, reportBarChart;
    
    function initializeCharts() {
        // Expense Distribution Pie Chart
        const expenseCtx = document.getElementById('expenseChart').getContext('2d');
        expenseChart = new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: ['Makanan & Restoran', 'Transportasi', 'Perumahan', 'Hiburan', 'Belanja', 'Utilitas', 'Kesehatan', 'Lainnya'],
                datasets: [{
                    data: [6750000, 3000000, 18000000, 4050000, 1350000, 1800000, 1200000, 975000],
                    backgroundColor: [
                        '#FFD166',
                        '#06D6A0',
                        '#118AB2',
                        '#EF476F',
                        '#A78BFA',
                        '#83C5BE',
                        '#FF9E00',
                        '#B8B8B8'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: Rp ${formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Monthly Trend Line Chart
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                datasets: [
                    {
                        label: 'Pendapatan',
                        data: [72000000, 73500000, 75000000, 76500000, 78000000, 79500000],
                        borderColor: '#06D6A0',
                        backgroundColor: 'rgba(6, 214, 160, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Pengeluaran',
                        data: [48000000, 46500000, 45000000, 43500000, 42000000, 41250000],
                        borderColor: '#EF476F',
                        backgroundColor: 'rgba(239, 71, 111, 0.1)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: Rp ${formatNumber(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
        
        // Budget Overview Bar Chart
        const budgetCtx = document.getElementById('budgetChart').getContext('2d');
        budgetChart = new Chart(budgetCtx, {
            type: 'bar',
            data: {
                labels: ['Makanan', 'Transport', 'Perumahan', 'Hiburan', 'Belanja', 'Utilitas'],
                datasets: [
                    {
                        label: 'Anggaran',
                        data: [9000000, 6000000, 18000000, 3750000, 2250000, 3000000],
                        backgroundColor: 'rgba(255, 107, 139, 0.7)',
                        borderRadius: 4
                    },
                    {
                        label: 'Aktual',
                        data: [6750000, 3000000, 18000000, 4050000, 1350000, 1800000],
                        backgroundColor: 'rgba(107, 91, 149, 0.7)',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: Rp ${formatNumber(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
        
        // Report Pie Chart
        const reportPieCtx = document.getElementById('reportPieChart').getContext('2d');
        reportPieChart = new Chart(reportPieCtx, {
            type: 'pie',
            data: {
                labels: ['Makanan & Restoran', 'Transportasi', 'Perumahan', 'Hiburan', 'Belanja', 'Utilitas', 'Kesehatan', 'Lainnya'],
                datasets: [{
                    data: [6750000, 3000000, 18000000, 4050000, 1350000, 1800000, 1200000, 975000],
                    backgroundColor: [
                        '#FFD166',
                        '#06D6A0',
                        '#118AB2',
                        '#EF476F',
                        '#A78BFA',
                        '#83C5BE',
                        '#FF9E00',
                        '#B8B8B8'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: Rp ${formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Report Bar Chart
        const reportBarCtx = document.getElementById('reportBarChart').getContext('2d');
        reportBarChart = new Chart(reportBarCtx, {
            type: 'bar',
            data: {
                labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
                datasets: [
                    {
                        label: 'Makanan & Restoran',
                        data: [1800000, 1650000, 2250000, 1050000],
                        backgroundColor: '#FFD166',
                        borderRadius: 4
                    },
                    {
                        label: 'Transportasi',
                        data: [900000, 750000, 750000, 600000],
                        backgroundColor: '#06D6A0',
                        borderRadius: 4
                    },
                    {
                        label: 'Hiburan',
                        data: [1200000, 1050000, 900000, 900000],
                        backgroundColor: '#EF476F',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: Rp ${formatNumber(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    }
    
    function updateCharts() {
        // In a real app, we would fetch updated data from Google Sheets and update the charts
        // For demo purposes, we'll just randomize some data
        const newExpenseData = expenseChart.data.datasets[0].data.map(value => {
            return value + (Math.random() * 500000 - 250000);
        });
        
        expenseChart.data.datasets[0].data = newExpenseData;
        expenseChart.update();
    }
    
    function updateBudgetProgress() {
        // In a real app, we would calculate actual progress from Google Sheets data
        // For demo, we'll just animate to a random value
        const progressBars = document.querySelectorAll('.progress-fill');
        
        progressBars.forEach(bar => {
            const currentWidth = parseFloat(bar.style.width) || 0;
            const newWidth = Math.min(100, currentWidth + (Math.random() * 20));
            
            bar.style.width = `${newWidth}%`;
            
            // Update color based on percentage
            if (newWidth > 80) {
                bar.className = bar.className.replace(/safe|warning|danger/g, 'danger');
            } else if (newWidth > 50) {
                bar.className = bar.className.replace(/safe|warning|danger/g, 'warning');
            } else {
                bar.className = bar.className.replace(/safe|warning|danger/g, 'safe');
            }
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (!mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });
    
    // Add animation to cards on scroll
    const animateOnScroll = function() {
        const cards = document.querySelectorAll('.card');
        
        cards.forEach((card, index) => {
            const cardPosition = card.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (cardPosition < screenPosition) {
                card.classList.add('fade-in');
            }
        });
    };
    
    window.addEventListener('scroll', animateOnScroll);
    
    // Trigger initial animations
    animateOnScroll();
});