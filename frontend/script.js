const url = "http://127.0.0.1:5000"
// const url = "http://ofabian.pythonanywhere.com"
const key = authenticate()

const inp_price = document.getElementById('inp_price');
const inp_ratio = document.getElementById('inp_ratio');
const lbl_percent = document.getElementById('lbl_percent');
const inp_price_me = document.getElementById('inp_price_me');
const inp_price_other = document.getElementById('inp_price_other');
const lbl_name = document.getElementById('lbl_name');
const btn_submit = document.getElementById('btn_submit');

let EXPENSES_ALL = null;


const FABIAN = 'Fabian';
const ELISA = 'Elisa';

const data = {
    price: 0, ratio: 100, category: '', description: '',
}

// *** authentication ***
function getKey() {
    return localStorage.getItem("budget_key")
}

function setKey(key) {
    localStorage.setItem('budget_key', key)
}

function authenticate(isForceAuthenticate = false) {
    let key = getKey()
    if (!key || isForceAuthenticate) {
        key = prompt("Password")
        setKey(key)
    }
    return key
}

function handleError(err) {
    if (err == `SyntaxError: Unexpected token 'U', "Unauthorized Access" is not valid JSON`) {
        authenticate(true)
        location.reload()
    } else {
        alert("Error: " + err)
    }
}

function betterFetch(url, options = {}) {
    options.headers = {'Authorization': 'Basic ' + btoa(getKey())}
    return fetch(url, options)
}

const getName = () => {
    return localStorage.getItem('budget_name') || FABIAN;
}

const readName = () => {
    const lbl_name = document.getElementById('lbl_name');
    lbl_name.innerHTML = getName();
}

const update = () => {
    // round to 2 decimals
    inp_price_me.value = (inp_price.value * (inp_ratio.value / 100)).toFixed(2);
    inp_price_other.value = (inp_price.value * ((100 - inp_ratio.value) / 100)).toFixed(2);

    data.price = inp_price.value;
    data.ratio = inp_ratio.value;
}


const getMonthFromUrlParam = () => { // returns 0, -1, ... indicating how many months ago
    const urlParams = new URLSearchParams(window.location.search);
    const month = parseInt(urlParams.get('month'));
    return isNaN(month) ? 0 : month;
}

const fillDescriptions = (descriptions) => {
    const descriptionshtml = document.getElementById('descriptions')
    for (let i = 0; i < descriptions.length; i++) {
        const option = document.createElement('option')
        option.value = descriptions[i]
        descriptionshtml.appendChild(option)
    }
}

const updateDebtsAndExpensesAll = (maxTrials = 3) => {
    const nbMonthsAgo = getMonthFromUrlParam();

    const fullUrl = `${url}?month=${nbMonthsAgo}`;
    betterFetch(fullUrl)
        .then(response => response.json())
        .then(data => {
            const fabian = data.fabian; // eg: +14.00
            const elisa = data.elisa; // eg: +12.00
            const expenses = data.expenses;
            const monthlyExpenses = data.monthly_expenses;

            // list of how much saved at month 0, 1, 2, 3, ... (last element is current month)
            const monthlySaved = getName() === FABIAN ? data.savings_of_lifetime_fabian : data.savings_of_lifetime_elisa;

            // append monthlyExpenses to expenses
            monthlyExpenses.forEach(expense => {
                expenses.push(expense);
                expense.id = -1; // mark as monthly expense
            });

            const groupedExenses = data.grouped_expenses;
            const groupedMonthlyExenses = data.monthly_grouped_expenses;

            // merge groupedExenses and groupedMonthlyExenses. If category is in both, add prices
            groupedExenses.forEach(expense => {
                const category = expense.category;
                const priceFabian = expense.price_fabian;
                const priceElisa = expense.price_elisa;

                const monthlyExpense = groupedMonthlyExenses.find(expense => expense.category == category);

                if (monthlyExpense) {
                    expense.price_fabian += monthlyExpense.price_fabian;
                    expense.price_elisa += monthlyExpense.price_elisa;
                    console.log("adding monthly expense", monthlyExpense)
                }
            });
            // add all monthly expenses that are not in groupedExenses
            groupedMonthlyExenses.forEach(expense => {
                const category = expense.category;
                const priceFabian = expense.price_fabian;
                const priceElisa = expense.price_elisa;

                const monthlyExpense = groupedExenses.find(expense => expense.category == category);

                if (!monthlyExpense) {
                    groupedExenses.push(expense);
                    console.log("adding monthly expense", monthlyExpense)
                }
            });

            const historicDescriptions = data.historic_descriptions;

            fillDescriptions(historicDescriptions);

            updateDebts(fabian, elisa);
            updateExpensesAll(expenses);

            updateDonut(groupedExenses);
            updateBar(groupedExenses, expenses);

            printMonthlySaved(monthlySaved);

            ALL_EXPENSES = expenses;
        })
        .catch(e => {
            maxTrials > 0 ? updateDebtsAndExpensesAll(maxTrials - 1) : handleError(e)
        })
}

const printMonthlySaved = (monthlySaved) => {
    // Get the canvas context
    const ctx = document.getElementById('savingsChart').getContext('2d');

    // Prepare the labels (last 12 months or less)
    const labels = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    for (let i = Math.max(0, monthlySaved.length - 12); i < monthlySaved.length; i++) {
        labels.push(monthNames[(currentMonth - monthlySaved.length + i + 1 + 12) % 12]);
    }

    // Prepare the data (last 12 months or less)
    const data = monthlySaved.slice(Math.max(0, monthlySaved.length - 12));
    const targetData = new Array(data.length).fill(0);
    const valueData = new Array(data.length).fill(0);

    // hard cap of 1,000
    for (let i = 0; i < data.length; i++) {
        valueData[i] = Math.min(data[i].value, 800);
        targetData[i] = Math.min(data[i].target, 800);

    }

    // Prepare the target data (a constant value of 343)
    // const targetData = new Array(data.length).fill(343);

    // Create the chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Savings',
                data: valueData,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }, {
                label: 'Target',
                data: targetData,
                fill: false,
                borderColor: 'rgb(255, 99, 132)',
                borderDash: [5, 5], // This will make the line dashed
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false // This hides the "Savings" and "Target" buttons
                }
            }
        }
    });
}
const printCurrentDayAndMonth = () => {
    const nbMonthsAgo = getMonthFromUrlParam();

    // get date of nbMonthsAgo months ago
    const currentDate = new Date();
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - nbMonthsAgo, 1);
    const day = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();


    const lbl_day_progress_of_month = document.getElementById('lbl_day_progress_of_month');
    const lbl_total_days_in_month = document.getElementById('lbl_total_days_in_month');
    const lbl_month = document.getElementById('lbl_month');

    const monthExplicit = date.toLocaleString('default', {month: 'long'});

    // <!-- Oct - Day: 12/31 -->
    const msg = nbMonthsAgo < 0 ? `${monthExplicit}` : `${monthExplicit} &emsp; ${day}/${daysInMonth}`

    document.getElementById('selected_month_msg').innerHTML = msg
}

const getExpenesPerMainCategory = (expenses, incomeCategory) => {
    // expense: eg [{category: "Groceries", price_fabian: 10, price_elisa: 20}, ... ]

    let expensesBasics = 0;
    let expensesFun = 0;
    let expensesInfreq = 0;

    // exclude Income
    const incomeSum = getName() == FABIAN ? expenses.filter(expense => expense.category == incomeCategory).reduce((a, b) => {
        return a + b.price_fabian
    }, 0) : expenses.filter(expense => expense.category == incomeCategory).reduce((a, b) => {
        return a + b.price_elisa
    }, 0);

    expenses = expenses.filter(expense => expense.category != incomeCategory);

    expenses.forEach(expense => {
        const category = expense.category.toLowerCase();
        const priceFabian = expense.price_fabian;
        const priceElisa = expense.price_elisa;

        // lowercase all items in list
        const basics_keys = categories_basics_keys.map(category => category.toLowerCase());
        const fun_keys = categories_fun_keys.map(category => category.toLowerCase());
        const infreq_keys = categories_infreq_keys.map(category => category.toLowerCase());


        // category is in `categories_basics_keys`
        if (basics_keys.includes(category)) {
            // only my price
            expensesBasics += getName() == FABIAN ? priceFabian : priceElisa;
        } else if (fun_keys.includes(category)) {
            expensesFun += getName() == FABIAN ? priceFabian : priceElisa;
        } else if (infreq_keys.includes(category)) {
            expensesInfreq += getName() == FABIAN ? priceFabian : priceElisa;
        } else {
            alert(`Category ${category} not found in categories_basics_keys, categories_fun_keys or categories_infreq_keys`)
            raiseError(`Category ${category} not found in categories_basics_keys, categories_fun_keys or categories_infreq_keys`)
        }
    });

    return [expensesBasics, expensesFun, expensesInfreq, Math.abs(incomeSum)];
}

const stringSubstr = (str, maxLen) => {
    // expense.category.length > 10 ? expense.category.substring(0, 10) + '...' : expense.category
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str
}

const filterZip = (arr1, arr2, predicate) => {
    // keep only elements where predicate is true

    const result1 = [];
    const result2 = [];
    for (let i = 0; i < arr1.length; i++) {
        if (predicate(arr1[i])) {
            result1.push(arr1[i]);
            result2.push(arr2[i]);
        }
    }

    return [result1, result2];
}

const updateBar = (groupedExenses, indivualExpenses) => {
    // groupedExenses:
    // eg [{category: "Groceries", price_fabian: 10, price_elisa: 20}, ... ]
    const ctx = document.getElementById('barChart');

    const keys = groupedExenses.map(expense => expense.category);

    const maxLen = 10;
    // substring
    let labels = groupedExenses.map(expense => stringSubstr(expense.category, maxLen));
    let prices = groupedExenses.map(expense => getName() == FABIAN ? expense.price_fabian : expense.price_elisa);

    [prices, labels] = filterZip(prices, labels, (price) => price != 0);

    // make label "Inkomst" last
    const incomeIndex = labels.indexOf("Inkomst");
    if (incomeIndex != -1) {
        labels.push(labels.splice(incomeIndex, 1)[0]);
        prices.push(prices.splice(incomeIndex, 1)[0]);

        // make its value positive divide by 100
        prices[prices.length - 1] = Math.abs(prices[prices.length - 1]) / 100;
    }


    ctx.height = 350;

    const statistics = {
        labels: labels, keys: keys, datasets: [{
            label: '',
            data: prices,
            backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(0, 122, 251, 0.5)', 'rgba(255, 205, 86, 0.5)',],
        }]
    };


    let clicked = new Map();

    const config = {
        type: 'bar', data: statistics, options: {

            responsive: true, maintainAspectRatio: false, indexAxis: 'y',

            plugins: {
                legend: {
                    display: false // hide dataset label
                }, title: {}, labels: {
                    render: 'label+value', fontSize: 14, position: 'border', // outside, border
                    fontColor: '#FFFFFF',
                }, tooltip: {
                    callbacks: {
                        label: function (context) {
                            const price = context.dataset.data[context.dataIndex];
                            const category = context.label;
                            const expenses = indivualExpenses.filter(expense => stringSubstr(expense.category, maxLen) == category); // some category may be displayed as Zelfontwik...

                            // filter div_expenses to only show expenses of this category
                            const lst_expenses = document.getElementById('ul_expenses_all');

                            lst_expenses.innerHTML = '';
                            expenses.forEach(expense => {
                                const id = expense.id;
                                const date = expense.date; // eg: dd-mm
                                const day = date.split('-')[0];
                                const monthNumeric = date.split('-')[1];
                                const priceFabian = expense.price_fabian;
                                const priceElisa = expense.price_elisa;
                                const description = expense.description;

                                const myPrice = getName() == FABIAN ? priceFabian : priceElisa;

                                lst_expenses.innerHTML += getExepenseListItem(id, day, monthNumeric, category, description, myPrice, priceFabian + priceElisa);

                            });

                            return `€${price.toFixed(2)}`;
                        }
                    }
                    // callback after the tooltip has been is closed
                }
            }
        },
    };

    new Chart(ctx, config);
}

const updateMonthlyBudgetStatistics = (income, cap, rent, longterm, invest) => {
    // 💲<span id="lbl_income">##</span> =  🍞<span id="lbl_cap"></span> + 🏠<span id="lbl_rent">##</span> + ✈️<span id="lbl_longterm_savings">##</span> + 💸<span id="lbl_invest"></span>
    const lbl_income = document.getElementById('lbl_income');
    const lbl_cap = document.getElementById('lbl_cap');
    const lbl_rent = document.getElementById('lbl_rent');
    const lbl_longterm_savings = document.getElementById('lbl_longterm_savings');
    const lbl_invest = document.getElementById('lbl_invest');

    lbl_income.innerHTML = income.toFixed(0);
    lbl_cap.innerHTML = cap.toFixed(0);
    lbl_rent.innerHTML = rent.toFixed(0);
    lbl_longterm_savings.innerHTML = longterm.toFixed(0);
    lbl_invest.innerHTML = invest.toFixed(0);

}

const updateDonut = (groupedExenses) => {
    // eg prices = [400, 300, 700, 500]
    const prices = getExpenesPerMainCategory(groupedExenses, incomeCategory = "Inkomst")
    const ctx = document.getElementById('donutChart');

    const expensesBasics = prices[0];
    const expensesFun = prices[1];
    const expensesInfreq = prices[2];
    let income = prices[3];

    // income is 2500 or higher
    income = income < 2500 ? 2500 : income;


    // eg: 2500 salary,
    const rent = 455
    const cap = 850
    // const longterm = 300
    // const invest = income - rent - cap - longterm;
    const invest = 1000
    const longterm = income - rent - cap - invest;

    // eg 2600 - 455 - 850 - 300 = 1000
    const leftOver = cap - expensesBasics - expensesFun - expensesInfreq;
    updateMonthlyBudgetStatistics(income, cap, rent, longterm, invest);


    const statistics = {
        labels: [`🍎 €${expensesBasics.toFixed(2)}`, `🎉 €${expensesFun.toFixed(2)}`, `📎 €${expensesInfreq.toFixed(2)}`, `⬜ €${leftOver.toFixed(2)}`],
        datasets: [{
            data: [expensesBasics, expensesFun, expensesInfreq, leftOver],
            backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(0, 122, 251, 0.5)', 'rgba(255, 205, 86, 0.5)', 'rgba(240, 240, 240, 0.5)',],
        }]
    };

    const plugin = {
        id: 'my-plugin', beforeDraw: (chart, args, options) => {
            const data = chart.data.datasets[0].data;
            // exclude last element, round to 2 decimals
            const sum = data.slice(0, data.length - 1).reduce((a, b) => a + b, 0).toFixed(2);

            const width = chart.width, height = chart.height, ctx = chart.ctx;
            const legendWidth = chart.legend.width;
            const text = `€${sum}`
            const textX = Math.round((width - ctx.measureText(text).width) / 2) - legendWidth / 2
            const textY = height / 2;

            const textLength = text.length;
            const fontSize = textLength > 6 ? 1 : 1.5;

            ctx.restore();
            ctx.font = fontSize + "em Roboto";
            ctx.textBaseline = "middle";
            ctx.fillStyle = '#3e3e3e';

            ctx.fillText(text, textX, textY);
            ctx.save();
        },
    }

    const config = {
        type: 'doughnut', data: statistics, options: {
            responsive: true, plugins: {
                legend: {
                    position: 'right', labels: {
                        boxWidth: 10,
                    }
                }, title: {}, labels: {
                    render: 'label+value', fontSize: 14, position: 'border', // outside, border
                    fontColor: '#FFFFFF',
                },
            }
        }, plugins: [plugin]
    };

    new Chart(ctx, config);
}

const updateDebts = (fabian, elisa) => {
    // fabian eg: +14.00
    // elisa eg: +12.00
    const toPay = Math.abs((fabian - elisa).toFixed(2));

    const lbl_name_has_debt = document.getElementById('lbl_name_has_debt');
    const lbl_name_no_debt = document.getElementById('lbl_name_no_debt');
    const lbl_debt = document.getElementById('lbl_debt');

    if (elisa > fabian) { // elisa has debt
        lbl_name_has_debt.innerHTML = ELISA;
        lbl_name_no_debt.innerHTML = FABIAN;
        lbl_debt.innerHTML = toPay;
    } else {
        lbl_name_has_debt.innerHTML = FABIAN;
        lbl_name_no_debt.innerHTML = ELISA;
        lbl_debt.innerHTML = toPay;
    }
}

const expensePrompt = (id) => {
    if (id === -1) {
        alert('Monthly expenses cannot be edited')
        return;
    }
    confirm(`Delete expense with id ${id}?`) ? deleteExpense(id) : null;
}

const getExepenseListItem = (id, day, monthNumeric, category, description, myPrice, priceBoth) => {
    const month = monthNumeric == '01' ? 'Jan' : monthNumeric == '02' ? 'Feb' : monthNumeric == '03' ? 'Mar' : monthNumeric == '04' ? 'Apr' : monthNumeric == '05' ? 'May' : monthNumeric == '06' ? 'Jun' : monthNumeric == '07' ? 'Jul' : monthNumeric == '08' ? 'Aug' : monthNumeric == '09' ? 'Sep' : monthNumeric == '10' ? 'Oct' : monthNumeric == '11' ? 'Nov' : 'Dec';
    const colour = category == "Inkomst" ? "green" : "blue";
    return `
    <li class="expenseItem" onclick="expensePrompt(${id})">
      <span class="leftSpan">
        <span class="expenseItemTop expenseItemDay">${day}</span> <br>
        <span class="expenseItemBot">${month}</span>
      </span>
      <span class="centerSpan">
        <span class="expenseItemTop">${category}</span> <br>
        <span class="expenseItemBot">${description}</span>
      </span>
      <span class="rightSpan">
        ${getPriceText(myPrice, priceBoth, colour)}
      </span>
    </li>
    `

}

const getPriceText = (myPrice, total, color = "blue") => {
    if (myPrice == total) {
        return `<span class="expenseItemTop ${color}" style="font-size: 0.9em;">${myPrice.toFixed(2)}</span> <br>
    <span class="expenseItemBot"></span>`
    } else if (myPrice == 0) {
        return `&frasl;`;
    }
    return `<span style="font-size: 1.2em; position: relative; top: 10px;">
  <sup><span class="${color}">${myPrice}</span></sup>&frasl;<sub><span class="expenseTotal">${total.toFixed(2)}</span></sub>
  </span>`
}


const updateExpensesAll = (expenses) => {
    const lst_expenses = document.getElementById('ul_expenses_all');
    lst_expenses.innerHTML = '';

    expenses.forEach(expense => {
        // const date = expense.date; // eg: dd-mm
        // convert to dd/mm

        if (expense.date == null)
            expense.date = "00-00"

        const date = expense.date.split('-').reverse().join('/');
        const priceFabian = Math.abs(expense.price_fabian);
        const priceElisa = Math.abs(expense.price_elisa);
        const category = expense.category;
        const id = expense.id;

        // capitalize first letter of description, if not null or ''
        const description = expense.description == null || expense.description == '' ? '' : expense.description.charAt(0).toUpperCase() + expense.description.slice(1);

        const myPrice = getName() == FABIAN ? priceFabian : priceElisa;
        const day = date.split('/')[1];
        const monthNumeric = date.split('/')[0];


        lst_expenses.innerHTML += getExepenseListItem(id, day, monthNumeric, category, description, myPrice, priceFabian + priceElisa);

    });
}


const checkSubmit = () => {
    if (inp_price.value != '' && inp_price.value != 0 && data.category != '') {
        btn_submit.disabled = false;
    } else {
        btn_submit.disabled = true;
    }
}

const chooseCategory = (selectTag) => {
    const options = selectTag.options;
    const selectedOption = options[options.selectedIndex];
    const category = selectedOption.value;

    data.category = category;
    checkSubmit();

    // Set background colour of selectTag
    const selectTagId = selectTag.id;

    const selectTags = [
        document.getElementById('lst_categories_basics'),
        document.getElementById('lst_categories_fun'),
        document.getElementById('lst_categories_infreq')];

    const otherSelectTags = selectTags.filter(tag => tag.id != selectTagId)
    const currentSelectTag = document.getElementById(selectTagId);

    currentSelectTag.style.borderColor = '#034286';
    otherSelectTags.forEach(tag => tag.style.borderColor = '#dcdcdc');

    // Set other selectTag back to default
    otherSelectTags.forEach(tag => tag.selectedIndex = 0);


}


const submit = () => {
    // send data to server
    const category = data.category;

    let price_me = inp_price_me.value;
    let price_other = inp_price_other.value;
    if (category == 'Inkomst') { // make negative
        price_me = -Math.abs(price_me);
        price_other = -Math.abs(price_other);
    }

    const price_fabian = getName() == FABIAN ? price_me : price_other;
    const price_elisa = getName() == FABIAN ? price_other : price_me;
    const paidBy = getName().toLowerCase();

    const subcategory = null;
    const description = document.getElementById('inp_description').value;

    const fullUrl = `${url}/add_expense?price_fabian=${price_fabian}&price_elisa=${price_elisa}&paid_by=${paidBy}&category=${category}&subcategory=${subcategory}&description=${description}`;

    betterFetch(fullUrl)
        .then(response => response.json())
        .then(data => {
            location.reload();
        })
        .catch(e => handleError(e))

}

const editName = () => {
    // toggle between Fabian and Elisa. Store in localStorage
    const lbl_name = document.getElementById('lbl_name');
    if (lbl_name.innerHTML == FABIAN) {
        lbl_name.innerHTML = ELISA;
        localStorage.setItem('budget_name', ELISA);
    } else {
        lbl_name.innerHTML = FABIAN;
        localStorage.setItem('budget_name', FABIAN);
    }

    readName();
    // location.reload();
}

const deleteExpense = (id) => {
    const fullUrl = `${url}/delete_expense?id=${id}`;
    betterFetch(fullUrl)
        .then(response => response.json())
        .then(data => {
            location.reload();
        })
        .catch(e => handleError(e))
}

const clearExpensesFilter = () => {
    updateExpensesAll(ALL_EXPENSES);
}

// for select tags
const fillCategoriesList = () => {
    const lst_categories_basics = document.getElementById('lst_categories_basics');
    const lst_categories_fun = document.getElementById('lst_categories_fun');
    const lst_categories_infreq = document.getElementById('lst_categories_infreq');

    for (let i = 0; i < categories_basics_keys.length; i++) {
        const key = categories_basics_keys[i];
        const name = categories_basics_names[i];
        const option = document.createElement('option');
        option.value = key;
        option.innerHTML = name;
        lst_categories_basics.appendChild(option);
    }

    for (let i = 0; i < categories_fun_keys.length; i++) {
        const key = categories_fun_keys[i];
        const name = categories_fun_names[i];
        const option = document.createElement('option');
        option.value = key;
        option.innerHTML = name;
        lst_categories_fun.appendChild(option);
    }

    for (let i = 0; i < categories_infreq_keys.length; i++) {
        const key = categories_infreq_keys[i];
        const name = categories_infreq_names[i];
        const option = document.createElement('option');
        option.value = key;
        option.innerHTML = name;
        lst_categories_infreq.appendChild(option);
    }
}


const updateNavigationButtons = () => {
    // page navigation: calls getMonthFromUrlParam() and updates the navigation buttons
    // get current month from url param
    const month = getMonthFromUrlParam();

    const prev = document.getElementById('paginationPrev');
    const curr = document.getElementById('paginationCurr');
    const next = document.getElementById('paginationNext');

    const prevChild = document.getElementById('paginationPrevChild');
    const currChild = document.getElementById('paginationCurrChild');
    const nextChild = document.getElementById('paginationNextChild');


    // update current page buttons
    prevChild.setAttribute('href', `?month=${month - 1}`);
    currChild.innerHTML = month;
    nextChild.setAttribute('href', `?month=${month + 1}`);

    // update disabled buttons
    if (month == 0) {
        next.classList.add('disabled');
    } else {
        next.classList.remove('disabled');
    }

}


inp_price.addEventListener('input', () => {
    update();
    checkSubmit();
});

inp_ratio.addEventListener('input', () => {
    lbl_percent.innerHTML = inp_ratio.value + '%';
    update();
});

inp_price_me.addEventListener('input', () => {
    checkSubmit();

    // change value of inp_price_other accordingly
    inp_price_other.value = (inp_price.value - inp_price_me.value).toFixed(2);

    //update slider
    inp_ratio.value = (inp_price_me.value / inp_price.value * 100).toFixed(0);
    lbl_percent.innerHTML = inp_ratio.value + '%';
});

inp_price_other.addEventListener('input', () => {
    checkSubmit();

    // change value of inp_price_me accordingly
    inp_price_me.value = (inp_price.value - inp_price_other.value).toFixed(2);

    //update slider
    inp_ratio.value = (inp_price_me.value / inp_price.value * 100).toFixed(0);
    lbl_percent.innerHTML = inp_ratio.value + '%';
});
