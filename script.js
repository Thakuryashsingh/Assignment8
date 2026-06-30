
document.addEventListener("DOMContentLoaded", () => {
  
  let state = {
    users: JSON.parse(localStorage.getItem("ftp_users")) || [],
    currentUser: localStorage.getItem("ftp_currentUser") || null,
    settings: JSON.parse(localStorage.getItem("ftp_settings")) || {},
    transactions: JSON.parse(localStorage.getItem("ftp_transactions")) || [],
    theme: localStorage.getItem("ftp_theme") || "light"
  };

  const categoriesMap = {
    income: ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"],
    expense: ["Food & Dining", "Shopping", "Bills", "Recharge", "Travel", "Healthcare", "Education", "Entertainment", "Utilities", "Fuel", "Other"]
  };

  const UI = {
    authContainer: document.getElementById("auth-container"),
    appContainer: document.getElementById("app-container"),
    loginPage: document.getElementById("login-page"),
    registerPage: document.getElementById("register-page"),
    dashboardPage: document.getElementById("dashboard-page"),
    settingsPage: document.getElementById("settings-page"),
    transactionModal: document.getElementById("transaction-modal"),
    
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    settingsForm: document.getElementById("settings-form"),
    transactionForm: document.getElementById("transaction-form"),
    
    loginUser: document.getElementById("login-username"),
    loginPass: document.getElementById("login-password"),
    userSuggestions: document.getElementById("username-suggestions"),
    regUser: document.getElementById("register-username"),
    regPass: document.getElementById("register-password"),
    
    loginError: document.getElementById("login-error"),
    registerError: document.getElementById("register-error"),
    userDisplayName: document.getElementById("user-display-name"),
    
 
    navDashboard: document.getElementById("nav-dashboard"),
    navSettings: document.getElementById("nav-settings"),
    logoutBtn: document.getElementById("logout-btn"),
    sidebarAddBtn: document.getElementById("sidebar-add-btn"),
    
   
    cardBalance: document.getElementById("card-balance"),
    cardIncome: document.getElementById("card-income"),
    cardExpense: document.getElementById("card-expense"),
    cardTransactions: document.getElementById("card-transactions"),
    
   
    txSearch: document.getElementById("transaction-search"),
    txFilter: document.getElementById("transaction-filter"),
    tableBody: document.getElementById("transactions-table-body"),
    themeToggle: document.getElementById("theme-toggle"),
    resetAllBtn: document.getElementById("reset-all-btn"),
    
 
    fullNameInput: document.getElementById("full-name-input"),
    currencySelect: document.getElementById("currency-select"),
    
  
    modalTitle: document.getElementById("modal-title"),
    txId: document.getElementById("transaction-id"),
    txType: document.getElementById("transaction-type"),
    txDesc: document.getElementById("transaction-description"),
    txAmount: document.getElementById("transaction-amount"),
    txDate: document.getElementById("transaction-date"),
    txCategory: document.getElementById("transaction-category"),
    modalCloseIcon: document.getElementById("modal-close-icon"),
    modalCancelBtn: document.getElementById("modal-cancel-btn")
  };

  let cashFlowChartInstance = null;

  initApp();

  function initApp() {
    applyTheme();
    updateView();
    bindEvents();
    
    if (state.currentUser) {
      renderDashboard();
    }
  }

  function saveState(key, data) {
    state[key] = data;
    localStorage.setItem(`ftp_${key}`, JSON.stringify(data));
  }

  function updateView() {
    if (state.currentUser) {
      UI.authContainer.classList.add("hidden");
      UI.appContainer.classList.remove("hidden");
      goToSection("dashboard");
    } else {
      UI.appContainer.classList.add("hidden");
      UI.authContainer.classList.remove("hidden");
      showAuthPanel("login");
    }
  }

  function goToSection(targetPanel) {
    if (!state.currentUser) return;
    
    if (targetPanel === "dashboard") {
      UI.dashboardPage.classList.remove("hidden");
      UI.settingsPage.classList.add("hidden");
      UI.navDashboard.classList.add("active");
      UI.navSettings.classList.remove("active");
      renderDashboard();
    } else if (targetPanel === "settings") {
      UI.settingsPage.classList.remove("hidden");
      UI.dashboardPage.classList.add("hidden");
      UI.navSettings.classList.add("active");
      UI.navDashboard.classList.remove("active");
      loadSettings();
    }
  }

  function showAuthPanel(panel) {
    UI.loginError.style.display = "none";
    UI.registerError.style.display = "none";
    if (panel === "login") {
      UI.loginPage.classList.remove("hidden");
      UI.registerPage.classList.add("hidden");
      UI.loginForm.reset();
    } else {
      UI.registerPage.classList.remove("hidden");
      UI.loginPage.classList.add("hidden");
      UI.registerForm.reset();
    }
  }

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    UI.themeToggle.checked = (state.theme === "dark");
  }

  function bindEvents() {
    const registerLink = document.getElementById("to-register-btn");
    const loginLink = document.getElementById("to-login-btn");

    if (registerLink) {
      registerLink.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showAuthPanel("register");
      });
    }

    if (loginLink) {
      loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showAuthPanel("login");
      });
    }

    UI.registerForm.addEventListener("submit", registerUser);
    UI.loginForm.addEventListener("submit", loginUser);
    
    UI.loginUser.addEventListener("focus", showUsernameSuggestions);
    document.addEventListener("click", (e) => {
      if (!UI.loginUser.contains(e.target) && !UI.userSuggestions.contains(e.target)) {
        UI.userSuggestions.style.display = "none";
      }
    });

    UI.navDashboard.addEventListener("click", () => goToSection("dashboard"));
    UI.navSettings.addEventListener("click", () => goToSection("settings"));
    UI.logoutBtn.addEventListener("click", logoutUser);

    UI.sidebarAddBtn.addEventListener("click", () => openTransactionDialog());
    UI.modalCloseIcon.addEventListener("click", closeTransactionDialog);
    UI.modalCancelBtn.addEventListener("click", closeTransactionDialog);
    UI.txType.addEventListener("change", (e) => populateCategories(e.target.value));
    UI.transactionForm.addEventListener("submit", saveTransaction);

    UI.txSearch.addEventListener("input", refreshDashboard);
    UI.txFilter.addEventListener("change", refreshDashboard);

    UI.themeToggle.addEventListener("change", (e) => {
      const activeTheme = e.target.checked ? "dark" : "light";
      state.theme = activeTheme;
      localStorage.setItem("ftp_theme", activeTheme);
      document.documentElement.setAttribute("data-theme", activeTheme);
      refreshDashboard();
    });

    UI.settingsForm.addEventListener("submit", saveSettings);
    UI.resetAllBtn.addEventListener("click", resetAppData);

    UI.tableBody.addEventListener("click", (e) => {
      const editTrigger = e.target.closest(".edit-action");
      const deleteTrigger = e.target.closest(".delete-action");
      
      if (editTrigger) {
        openTransactionDialog(editTrigger.dataset.id);
      } else if (deleteTrigger) {
        deleteTransaction(deleteTrigger.dataset.id);
      }
    });
  }

  function showUsernameSuggestions() {
    UI.userSuggestions.innerHTML = "";
    if (state.users.length === 0) {
      UI.userSuggestions.style.display = "none";
      return;
    }
    
    state.users.forEach(user => {
      const row = document.createElement("div");
      row.className = "suggestion-item";
      row.textContent = user.username;
      row.addEventListener("click", () => {
        UI.loginUser.value = user.username;
        UI.loginPass.value = user.password;
        UI.userSuggestions.style.display = "none";
        UI.loginBtn.click();
      });
      UI.userSuggestions.appendChild(row);
    });
    UI.userSuggestions.style.display = "block";
  }

  function registerUser(e) {
    e.preventDefault();
    UI.registerError.style.display = "none";

    const username = UI.regUser.value.trim();
    const password = UI.regPass.value;

    if (!username || !password) {
      showError(UI.registerError, "All account identification parameters are strictly required.");
      return;
    }

    const accountExists = state.users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (accountExists) {
      showError(UI.registerError, "The designated username configuration is unresolvable or already assigned.");
      return;
    }

    const updatedUserPool = [...state.users, { username, password }];
    saveState("users", updatedUserPool);
    
    showAuthPanel("login");
    UI.loginUser.value = username;
  }

  function loginUser(e) {
    e.preventDefault();
    UI.loginError.style.display = "none";

    const username = UI.loginUser.value.trim();
    const password = UI.loginPass.value;

    const targetedProfile = state.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (!targetedProfile) {
      showError(UI.loginError, "Invalid Username or Password");
      return;
    }

    localStorage.setItem("ftp_currentUser", targetedProfile.username);
    state.currentUser = targetedProfile.username;
    
    updateView();
  }

  function logoutUser() {
    localStorage.removeItem("ftp_currentUser");
    state.currentUser = null;
    updateView();
  }

  function showError(element, text) {
    element.textContent = text;
    element.style.display = "block";
  }

  function loadSettings() {
    const userKey = state.currentUser;
    const profile = state.settings[userKey] || { fullName: userKey, currency: "USD|$" };
    
    UI.userDisplayName.textContent = profile.fullName || userKey;
    UI.fullNameInput.value = profile.fullName || "";
    UI.currencySelect.value = profile.currency || "USD|$";
  }

  function saveSettings(e) {
    e.preventDefault();
    const userKey = state.currentUser;
    
    const configuredSettings = {
      ...state.settings,
      [userKey]: {
        fullName: UI.fullNameInput.value.trim() || userKey,
        currency: UI.currencySelect.value
      }
    };

    saveState("settings", configuredSettings);
    loadSettings();
    goToSection("dashboard");
  }

  function getCurrencySymbol() {
    const userKey = state.currentUser;
    const profile = state.settings[userKey];
    if (profile && profile.currency) {
      return profile.currency.split("|")[1];
    }
    return "$";
  }

  function getUserTransactions() {
    return state.transactions.filter(t => t.userOwner === state.currentUser);
  }

  function populateCategories(type, preselectedValue = "") {
    UI.txCategory.innerHTML = "";
    const optionsList = categoriesMap[type] || [];
    
    optionsList.forEach(category => {
      const el = document.createElement("option");
      el.value = category;
      el.textContent = category;
      UI.txCategory.appendChild(el);
    });

    if (preselectedValue) {
      UI.txCategory.value = preselectedValue;
    }
  }

  function openTransactionDialog(id = null) {
    UI.transactionForm.reset();
    
    if (id) {
      UI.modalTitle.textContent = "Edit Transaction";
      const record = state.transactions.find(t => t.id === id);
      if (!record) return;

      UI.txId.value = record.id;
      UI.txType.value = record.type;
      UI.txDesc.value = record.description;
      UI.txAmount.value = record.amount;
      UI.txDate.value = record.date;
      
      populateCategories(record.type, record.category);
    } else {
      UI.modalTitle.textContent = "Add Transaction";
      UI.txId.value = "";
      UI.txType.value = "expense";
      UI.txDate.value = new Date().toISOString().split('T')[0];
      populateCategories("expense");
    }
    UI.transactionModal.classList.remove("hidden");
  }

  function closeTransactionDialog() {
    UI.transactionModal.classList.add("hidden");
  }

  function saveTransaction(e) {
    e.preventDefault();
    if (!UI.transactionForm.checkValidity()) return;

    const id = UI.txId.value;
    const type = UI.txType.value;
    const description = UI.txDesc.value.trim();
    const amount = parseFloat(UI.txAmount.value);
    const date = UI.txDate.value;
    const category = UI.txCategory.value;
    const userOwner = state.currentUser;

    if (id) {
      const transactionIndex = state.transactions.findIndex(t => t.id === id);
      if (transactionIndex !== -1) {
        state.transactions[transactionIndex] = { id, type, description, amount, date, category, userOwner };
      }
    } else {
      const newTransaction = {
        id: "tx_" + Date.now() + Math.random().toString(36).substr(2, 5),
        type, description, amount, date, category, userOwner
      };
      state.transactions.push(newTransaction);
    }

    saveState("transactions", state.transactions);
    closeTransactionDialog();
    renderDashboard();
  }

  function deleteTransaction(id) {
    if (!confirm("Are you sure you want to permanently delete this transaction ledger entry?")) return;
    
    const postClearanceTransactions = state.transactions.filter(t => t.id !== id);
    saveState("transactions", postClearanceTransactions);
    renderDashboard();
  }

  function refreshDashboard() {
    const dataRecords = getFilteredTransactions();
    updateDashboardMetrics(dataRecords);
    renderTransactionsTable(dataRecords);
    renderCashFlowChart(dataRecords);
  }

  function getFilteredTransactions() {
    const searchString = UI.txSearch.value.toLowerCase().trim();
    const filterCriteria = UI.txFilter.value;
    const underlyingDataset = getUserTransactions();

    return underlyingDataset.filter(item => {
      const matchSearch = item.description.toLowerCase().includes(searchString);
      const matchFilter = (filterCriteria === "all") || (item.type === filterCriteria);
      return matchSearch && matchFilter;
    });
  }

  function renderDashboard() {
    const userKey = state.currentUser;
    const profile = state.settings[userKey] || { fullName: userKey, currency: "USD|$" };
    UI.userDisplayName.textContent = profile.fullName || userKey;

    refreshDashboard();
  }

  function updateDashboardMetrics(visibleDataset) {
    const currencySymbol = getCurrencySymbol();
    let incomeSum = 0;
    let expenseSum = 0;

    visibleDataset.forEach(tx => {
      if (tx.type === "income") incomeSum += tx.amount;
      else if (tx.type === "expense") expenseSum += tx.amount;
    });

    const netBalance = incomeSum - expenseSum;

    UI.cardBalance.textContent = `${netBalance < 0 ? '-' : ''}${currencySymbol}${Math.abs(netBalance).toFixed(2)}`;
    UI.cardIncome.textContent = `${currencySymbol}${incomeSum.toFixed(2)}`;
    UI.cardExpense.textContent = `${currencySymbol}${expenseSum.toFixed(2)}`;
    UI.cardTransactions.textContent = visibleDataset.length.toString();
  }

  function renderTransactionsTable(dataset) {
    UI.tableBody.innerHTML = "";
    const symbol = getCurrencySymbol();

    if (dataset.length === 0) {
      UI.tableBody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align: center; padding: 2rem;">No transaction parameters resolve to current visualization filter matching rules.</td></tr>`;
      return;
    }

    const chronologicalSet = [...dataset].sort((a, b) => new Date(b.date) - new Date(a.date));

    chronologicalSet.forEach(tx => {
      const tr = document.createElement("tr");
      const contextualAmountClass = tx.type === "income" ? "txt-success" : "txt-danger";
      const displayAmountPrefix = tx.type === "income" ? "+" : "-";

      tr.innerHTML = `
        <td>${tx.date}</td>
        <td style="font-weight: 600;">${tx.description}</td>
        <td><span class="badge-category">${tx.category}</span></td>
        <td class="${contextualAmountClass}" style="font-weight: 600;">
          ${displayAmountPrefix}${symbol}${tx.amount.toFixed(2)}
        </td>
        <td>
          <div class="action-icon-group">
            <button class="btn-action-icon edit-action" data-id="${tx.id}" title="Edit Data Entry">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
            </button>
            <button class="btn-action-icon delete-action" data-id="${tx.id}" title="Delete Record">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      `;
      UI.tableBody.appendChild(tr);
    });
  }

  function renderCashFlowChart(dataset) {
    if (cashFlowChartInstance) {
      cashFlowChartInstance.destroy();
    }

    let incomeAggregate = 0;
    let expenseAggregate = 0;

    dataset.forEach(item => {
      if (item.type === "income") incomeAggregate += item.amount;
      else if (item.type === "expense") expenseAggregate += item.amount;
    });

    const isDarkModeActive = document.documentElement.getAttribute("data-theme") === "dark";
    const contrastGridColor = isDarkModeActive ? "#374151" : "#e2e8f0";
    const baseTextLabelColor = isDarkModeActive ? "#9ca3af" : "#64748b";

    const chartContext2D = document.getElementById("cashFlowChart").getContext("2d");
    
    cashFlowChartInstance = new Chart(chartContext2D, {
      type: 'bar',
      data: {
        labels: ['Income vs Expenses'],
        datasets: [
          {
            label: 'Income',
            data: [incomeAggregate],
            backgroundColor: '#16a34a',
            borderRadius: 6,
            barThickness: 60
          },
          {
            label: 'Expenses',
            data: [expenseAggregate],
            backgroundColor: '#dc2626',
            borderRadius: 6,
            barThickness: 60
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: baseTextLabelColor, font: { family: 'Inter', weight: 500 } }
          },
          tooltip: {
            padding: 12,
            fontFamily: 'Inter'
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: baseTextLabelColor }
          },
          y: {
            grid: { color: contrastGridColor },
            ticks: { color: baseTextLabelColor },
            beginAtZero: true
          }
        }
      }
    });
  }

  function resetAppData() {
    if (!confirm("WARNING: This will delete all your transaction data permanently!")) return;

    const userKey = state.currentUser;

    state.transactions = state.transactions.filter(t => t.userOwner !== userKey);
    localStorage.setItem("ftp_transactions", JSON.stringify(state.transactions));

    renderDashboard();
  }
});
