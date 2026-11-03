/**
 * Vanilla JavaScript Calorie Tracker
 * Persistent local storage, zero external libraries.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'calorie_tracker_data_v1';

  // Application State
  var state = {
    dailyGoal: 2000,
    entries: [] // { id, name, calories, category, date, createdAt }
  };

  var activeDate = getTodayDateString();

  // DOM Elements
  var activeDateInput = document.getElementById('activeDateInput');
  var goalDisplay = document.getElementById('goalDisplay');
  var editGoalBtn = document.getElementById('editGoalBtn');
  var statTarget = document.getElementById('statTarget');
  var statConsumed = document.getElementById('statConsumed');
  var statRemaining = document.getElementById('statRemaining');
  var remainingLabel = document.getElementById('remainingLabel');
  var progressPercent = document.getElementById('progressPercent');
  var progressBar = document.getElementById('progressBar');

  var mealForm = document.getElementById('mealForm');
  var foodNameInput = document.getElementById('foodNameInput');
  var caloriesInput = document.getElementById('caloriesInput');
  var categoryInput = document.getElementById('categoryInput');

  var clearDayBtn = document.getElementById('clearDayBtn');
  var emptyState = document.getElementById('emptyState');

  var listBreakfast = document.getElementById('list-breakfast');
  var listLunch = document.getElementById('list-lunch');
  var listDinner = document.getElementById('list-dinner');
  var listSnack = document.getElementById('list-snack');

  var totalBreakfast = document.getElementById('total-breakfast');
  var totalLunch = document.getElementById('total-lunch');
  var totalDinner = document.getElementById('total-dinner');
  var totalSnack = document.getElementById('total-snack');

  // Helper: Get local date formatted as YYYY-MM-DD
  function getTodayDateString() {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  // Load state from localStorage
  function loadState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (typeof parsed.dailyGoal === 'number' && parsed.dailyGoal > 0) {
          state.dailyGoal = parsed.dailyGoal;
        }
        if (Array.isArray(parsed.entries)) {
          state.entries = parsed.entries;
        }
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }
  }

  // Save state to localStorage
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
      alert('Local storage is full or disabled. Changes may not persist.');
    }
  }

  // Render the entire UI based on state and active date
  function render() {
    // Sync Date Input
    activeDateInput.value = activeDate;

    // Filter meals for selected date
    var dayEntries = state.entries.filter(function (entry) {
      return entry.date === activeDate;
    });

    // Calculate consumed totals
    var consumedTotal = 0;
    var categoryTotals = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0
    };

    dayEntries.forEach(function (entry) {
      var cals = parseInt(entry.calories, 10) || 0;
      consumedTotal += cals;
      if (categoryTotals[entry.category] !== undefined) {
        categoryTotals[entry.category] += cals;
      }
    });

    var goal = state.dailyGoal;
    var remaining = goal - consumedTotal;
    var percentage = goal > 0 ? Math.round((consumedTotal / goal) * 100) : 0;

    // Update Overview Header & Cards
    goalDisplay.textContent = goal.toLocaleString();
    statTarget.textContent = goal.toLocaleString();
    statConsumed.textContent = consumedTotal.toLocaleString();

    if (remaining >= 0) {
      remainingLabel.textContent = 'Remaining';
      statRemaining.textContent = remaining.toLocaleString();
      statRemaining.className = 'stat-value text-green';
    } else {
      remainingLabel.textContent = 'Over Target';
      statRemaining.textContent = Math.abs(remaining).toLocaleString();
      statRemaining.className = 'stat-value text-danger';
    }

    // Update Progress Bar
    progressPercent.textContent = percentage + '%';
    var visualWidth = Math.min(percentage, 100);
    progressBar.style.width = visualWidth + '%';

    if (percentage > 100) {
      progressBar.style.backgroundColor = '#dc2626'; // Over-target Red
    } else if (percentage >= 85) {
      progressBar.style.backgroundColor = '#f59e0b'; // Amber warning
    } else {
      progressBar.style.backgroundColor = '#2563eb'; // Blue
    }

    // Update Category Totals Display
    totalBreakfast.textContent = categoryTotals.breakfast.toLocaleString() + ' kcal';
    totalLunch.textContent = categoryTotals.lunch.toLocaleString() + ' kcal';
    totalDinner.textContent = categoryTotals.dinner.toLocaleString() + ' kcal';
    totalSnack.textContent = categoryTotals.snack.toLocaleString() + ' kcal';

    // Clear lists
    listBreakfast.innerHTML = '';
    listLunch.innerHTML = '';
    listDinner.innerHTML = '';
    listSnack.innerHTML = '';

    // Empty state visibility
    if (dayEntries.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
    }

    // Populate Category Lists
    var categoryMap = {
      breakfast: listBreakfast,
      lunch: listLunch,
      dinner: listDinner,
      snack: listSnack
    };

    dayEntries.forEach(function (entry) {
      var targetList = categoryMap[entry.category] || listSnack;
      var li = createMealElement(entry);
      targetList.appendChild(li);
    });

    // Check empty categories for placeholder text
    Object.keys(categoryMap).forEach(function (cat) {
      var listEl = categoryMap[cat];
      if (listEl.children.length === 0) {
        var emptyLi = document.createElement('li');
        emptyLi.className = 'category-empty';
        emptyLi.textContent = 'No items logged.';
        listEl.appendChild(emptyLi);
      }
    });
  }

  // Create individual DOM element for a meal entry
  function createMealElement(entry) {
    var li = document.createElement('li');
    li.className = 'meal-item';

    var detailsDiv = document.createElement('div');
    detailsDiv.className = 'meal-item-details';

    var nameSpan = document.createElement('span');
    nameSpan.className = 'meal-name';
    nameSpan.textContent = entry.name; // textContent prevents XSS

    detailsDiv.appendChild(nameSpan);

    var rightDiv = document.createElement('div');
    rightDiv.className = 'meal-item-right';

    var calSpan = document.createElement('span');
    calSpan.className = 'meal-calories';
    calSpan.textContent = parseInt(entry.calories, 10).toLocaleString() + ' kcal';

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('type', 'button');
    deleteBtn.setAttribute('title', 'Delete Entry');
    deleteBtn.innerHTML = '&#10005;'; // multiplication cross
    deleteBtn.addEventListener('click', function () {
      deleteMeal(entry.id);
    });

    rightDiv.appendChild(calSpan);
    rightDiv.appendChild(deleteBtn);

    li.appendChild(detailsDiv);
    li.appendChild(rightDiv);

    return li;
  }

  // Add meal handler
  function handleAddMeal(e) {
    e.preventDefault();

    var name = foodNameInput.value.trim();
    var calories = parseInt(caloriesInput.value, 10);
    var category = categoryInput.value;

    if (!name) {
      alert('Please enter a food or meal description.');
      foodNameInput.focus();
      return;
    }

    if (isNaN(calories) || calories <= 0) {
      alert('Please enter a valid positive number for calories.');
      caloriesInput.focus();
      return;
    }

    var newEntry = {
      id: 'entry_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: name,
      calories: calories,
      category: category,
      date: activeDate,
      createdAt: new Date().toISOString()
    };

    state.entries.push(newEntry);
    saveState();
    render();

    // Reset inputs
    foodNameInput.value = '';
    caloriesInput.value = '';
    foodNameInput.focus();
  }

  // Delete meal
  function deleteMeal(id) {
    state.entries = state.entries.filter(function (entry) {
      return entry.id !== id;
    });
    saveState();
    render();
  }

  // Edit daily calorie target
  function handleEditGoal() {
    var current = state.dailyGoal;
    var input = prompt('Enter your daily calorie goal (kcal):', current);
    if (input === null) return; // user cancelled

    var newGoal = parseInt(input.trim(), 10);
    if (!isNaN(newGoal) && newGoal > 0 && newGoal <= 30000) {
      state.dailyGoal = newGoal;
      saveState();
      render();
    } else {
      alert('Please enter a valid target between 1 and 30,000 kcal.');
    }
  }

  // Reset/Clear all meals for currently selected day
  function handleClearDay() {
    var dayEntries = state.entries.filter(function (entry) {
      return entry.date === activeDate;
    });

    if (dayEntries.length === 0) {
      alert('No entries exist for the selected date.');
      return;
    }

    var confirmed = confirm('Are you sure you want to delete all meal entries for ' + activeDate + '?');
    if (confirmed) {
      state.entries = state.entries.filter(function (entry) {
        return entry.date !== activeDate;
      });
      saveState();
      render();
    }
  }

  // Date selection changed
  function handleDateChange(e) {
    if (e.target.value) {
      activeDate = e.target.value;
      render();
    }
  }

  // Initialize
  function init() {
    loadState();

    // Attach Event Listeners
    mealForm.addEventListener('submit', handleAddMeal);
    editGoalBtn.addEventListener('click', handleEditGoal);
    clearDayBtn.addEventListener('click', handleClearDay);
    activeDateInput.addEventListener('change', handleDateChange);

    render();
  }

  init();
})();

