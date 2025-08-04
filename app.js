// App State
let currentUser = null;
let sales = [];
let debts = [];

// On Load
window.onload = function () {
    const savedUser = localStorage.getItem('current-user');
    if (savedUser) {
        loadUserData(savedUser);
        showApp();
    } else {
        showLogin();
    }
};

// Login System
function showLogin() {
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'none';
}

function showSetup() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
}

function setupAccount() {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value;

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    if (localStorage.getItem(`user-${username}`)) {
        alert("Username already exists. Please choose another.");
        return;
    }

    const userData = {
        password: btoa(password), // Base64 encoding (not encryption)
        sales: [],
        debts: []
    };
    localStorage.setItem(`user-${username}`, JSON.stringify(userData));
    alert("Account created! You can now log in.");
    showLogin();
}

function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const userDataStr = localStorage.getItem(`user-${username}`);
    if (!userDataStr) {
        alert("User not found.");
        return;
    }

    const userData = JSON.parse(userDataStr);
    if (userData.password !== btoa(password)) {
        alert("Incorrect password.");
        return;
    }

    loadUserData(username);
    localStorage.setItem('current-user', username);
    showApp();
}

function loadUserData(username) {
    currentUser = username;
    const userData = JSON.parse(localStorage.getItem(`user-${username}`));
    sales = userData.sales || [];
    debts = userData.debts || [];
}

function saveUserData() {
    const userData = {
        password: JSON.parse(localStorage.getItem(`user-${currentUser}`)).password,
        sales,
        debts
    };
    localStorage.setItem(`user-${currentUser}`, JSON.stringify(userData));
    updateReports();
}

function logout() {
    if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem('current-user');
        currentUser = null;
        sales = [];
        debts = [];
        showLogin();
    }
}

function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    renderSales();
    renderDebts();
    updateReports();
}

// Tab functionality
function openTab(tabName) {
    const tabs = document.getElementsByClassName('tab');
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`.tab[onclick="openTab('${tabName}')"]`).classList.add('active');
    if (tabName === 'reports') {
        updateReports();
    }
}

// Set default date
document.getElementById('sale-date').valueAsDate = new Date();
document.getElementById('due-date').valueAsDate = new Date();

// Sales form
document.getElementById('sales-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const customerName = document.getElementById('customer-name').value;
    const product = document.getElementById('product').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const price = parseFloat(document.getElementById('price').value);
    const paymentMethod = document.getElementById('payment-method').value;
    const saleDate = document.getElementById('sale-date').value;
    const total = quantity * price;

    const sale = {
        id: Date.now(),
        customerName,
        product,
        quantity,
        price,
        total,
        paymentMethod,
        saleDate
    };

    sales.push(sale);
    saveUserData();
    renderSales();
    this.reset();
    document.getElementById('sale-date').valueAsDate = new Date();
});

// Debt form
document.getElementById('debt-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const customer = document.getElementById('debt-customer').value;
    const amount = parseFloat(document.getElementById('debt-amount').value);
    const reason = document.getElementById('debt-reason').value;
    const dueDate = document.getElementById('due-date').value;
    const status = document.getElementById('debt-status').value;

    const debt = {
        id: Date.now(),
        customer,
        amount,
        reason,
        dueDate,
        status
    };

    debts.push(debt);
    saveUserData();
    renderDebts();
    this.reset();
    document.getElementById('due-date').valueAsDate = new Date();
});

// Render Functions
function renderSales() {
    const salesBody = document.getElementById('sales-body');
    salesBody.innerHTML = '';
    let totalSales = 0;
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => sale.saleDate === today);

    todaySales.forEach(sale => {
        totalSales += sale.total;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.customerName}</td>
            <td>${sale.product}</td>
            <td>${sale.quantity}</td>
            <td>$${sale.price.toFixed(2)}</td>
            <td>$${sale.total.toFixed(2)}</td>
            <td>${formatPaymentMethod(sale.paymentMethod)}</td>
            <td>${formatDate(sale.saleDate)}</td>
            <td class="action-buttons">
                <button class="btn-edit" onclick="editSale(${sale.id})">Edit</button>
                <button class="btn-delete" onclick="deleteSale(${sale.id})">Delete</button>
            </td>
        `;
        salesBody.appendChild(row);
    });
    document.getElementById('total-sales').textContent = `$${totalSales.toFixed(2)}`;
}

function renderDebts() {
    const debtsBody = document.getElementById('debts-body');
    debtsBody.innerHTML = '';
    let totalDebt = 0;

    debts.forEach(debt => {
        if (debt.status === 'pending' || debt.status === 'overdue') {
            totalDebt += debt.amount;
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${debt.customer}</td>
            <td>$${debt.amount.toFixed(2)}</td>
            <td>${debt.reason}</td>
            <td>${formatDate(debt.dueDate)}</td>
            <td><span class="${debt.status === 'pending' || debt.status === 'overdue' ? 'debt-owed' : 'debt-paid'}">${formatStatus(debt.status)}</span></td>
            <td class="action-buttons">
                <button class="btn-edit" onclick="editDebt(${debt.id})">Edit</button>
                <button class="btn-delete" onclick="deleteDebt(${debt.id})">Delete</button>
            </td>
        `;
        debtsBody.appendChild(row);
    });
    document.getElementById('total-debt').textContent = `$${totalDebt.toFixed(2)}`;
}

function renderHistory() {
    const historyBody = document.getElementById('history-body');
    historyBody.innerHTML = '';
    const sortedSales = [...sales].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
    sortedSales.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(sale.saleDate)}</td>
            <td>${sale.customerName}</td>
            <td>${sale.product}</td>
            <td>$${sale.total.toFixed(2)}</td>
            <td>${formatPaymentMethod(sale.paymentMethod)}</td>
        `;
        historyBody.appendChild(row);
    });
}

function updateReports() {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => sale.saleDate === today);
    const dailySalesTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const dailyTransactionCount = todaySales.length;
    const outstandingDebts = debts
        .filter(d => d.status === 'pending' || d.status === 'overdue')
        .reduce((sum, d) => sum + d.amount, 0);
    const netIncome = dailySalesTotal - outstandingDebts;

    document.getElementById('daily-sales').textContent = `$${dailySalesTotal.toFixed(2)}`;
    document.getElementById('daily-transactions').textContent = dailyTransactionCount;
    document.getElementById('daily-debts').textContent = `$${outstandingDebts.toFixed(2)}`;
    document.getElementById('net-income').textContent = `$${netIncome.toFixed(2)}`;
    renderHistory();
}

// Edit/Delete
function editSale(id) {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;
    document.getElementById('customer-name').value = sale.customerName;
    document.getElementById('product').value = sale.product;
    document.getElementById('quantity').value = sale.quantity;
    document.getElementById('price').value = sale.price;
    document.getElementById('payment-method').value = sale.paymentMethod;
    document.getElementById('sale-date').value = sale.saleDate;
    deleteSale(id);
}

function deleteSale(id) {
    if (confirm('Delete this sale?')) {
        sales = sales.filter(s => s.id !== id);
        saveUserData();
        renderSales();
    }
}

function editDebt(id) {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    document.getElementById('debt-customer').value = debt.customer;
    document.getElementById('debt-amount').value = debt.amount;
    document.getElementById('debt-reason').value = debt.reason;
    document.getElementById('due-date').value = debt.dueDate;
    document.getElementById('debt-status').value = debt.status;
    deleteDebt(id);
}

function deleteDebt(id) {
    if (confirm('Delete this debt?')) {
        debts = debts.filter(d => d.id !== id);
        saveUserData();
        renderDebts();
    }
}

// Export & Import
function exportData() {
    const data = {
        user: currentUser,
        sales,
        debts,
        backupDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.sales !== undefined && data.debts !== undefined && data.user === currentUser) {
                if (confirm("This will overwrite current data. Continue?")) {
                    sales = data.sales;
                    debts = data.debts;
                    saveUserData();
                    renderSales();
                    renderDebts();
                    updateReports();
                    alert("Data imported successfully!");
                }
            } else if (data.user && data.user !== currentUser) {
                alert("This data belongs to another user and cannot be imported.");
            } else {
                alert("Invalid or corrupted file.");
            }
        } catch (err) {
            alert("Error reading file. Please upload a valid JSON.");
        }
    };
    reader.readAsText(file);
}

// Helpers
function formatPaymentMethod(method) {
    const map = { cash: 'Cash', credit: 'Credit', mobile: 'Mobile', card: 'Card' };
    return map[method] || method;
}

function formatStatus(status) {
    const map = { pending: 'Pending', paid: 'Paid', overdue: 'Overdue' };
    return map[status] || status;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Initialize
renderSales();
renderDebts();
updateReports();