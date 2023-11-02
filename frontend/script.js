// const url = "http://127.0.0.1:5000"
const url = "http://ofabian.pythonanywhere.com"
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
    price: 0,
    ratio: 100,
    category: '',
    description: '',
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

const updateDebtsAndExpensesAll = (maxTrials = 3) => {
    const nbMonthsAgo = getMonthFromUrlParam();

    const fullUrl = `${url}?month=${nbMonthsAgo}`;
    betterFetch(fullUrl)
        .then(response => response.json())
        .then(data => {
            const fabian = data.fabian; // eg: +14.00
            const elisa = data.elisa; // eg: +12.00
            const expenses = data.expenses;
            const groupedExenses = data.grouped_expenses;
            updateDebts(fabian, elisa);
            updateExpensesAll(expenses);

            updateDonut(groupedExenses);
            updateBar(groupedExenses, expenses);

            ALL_EXPENSES = expenses;
        })
        .catch(e => {
            if (maxTrials > 0)
                updateDebtsAndExpensesAll(maxTrials - 1)
            else
                handleError(e)
        })
}

const printCurrentDayAndMonth = () => {
    const date = new Date();
    const day = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();


    const lbl_day = document.getElementById('lbl_day');
    const lbl_month = document.getElementById('lbl_month');

    lbl_day.innerHTML = day;
    lbl_month.innerHTML = daysInMonth;
}

const getExpenesPerMainCategory = (expenses) => {
    // expense: eg [{category: "Groceries", price_fabian: 10, price_elisa: 20}, ... ]

    let expensesBasics = 0;
    let expensesFun = 0;
    let expensesInfreq = 0;

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

    const leftOver = 1000 - expensesBasics - expensesFun - expensesInfreq;

    return [expensesBasics, expensesFun, expensesInfreq, leftOver];
}

const updateBar = (groupedExenses, indivualExpenses) => {
    // groupedExenses:
    // eg [{category: "Groceries", price_fabian: 10, price_elisa: 20}, ... ]
    const ctx = document.getElementById('barChart');

    // const labels = groupedExenses.map(expense => expense.category);
    // substring
    const labels = groupedExenses.map(expense => expense.category.length > 10 ? expense.category.substring(0, 10) + '...' : expense.category);
    const prices = groupedExenses.map(expense => getName() == FABIAN ? expense.price_fabian : expense.price_elisa);

    ctx.height = 350;

    const statistics = {
        labels: labels,
        datasets: [
            {
                label: 'Expenses per category, current month',
                data: prices,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(0, 122, 251, 0.5)',
                    'rgba(255, 205, 86, 0.5)',
                ],
            }
        ]
    };


    let clicked = new Map();

    const config = {
        type: 'bar',
        data: statistics,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',

            plugins: {
                legend: {},
                title: {},
                labels: {
                    render: 'label+value',
                    fontSize: 14,
                    position: 'border', // outside, border
                    fontColor: '#FFFFFF',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const price = context.dataset.data[context.dataIndex];
                            const category = context.label;
                            const expenses = indivualExpenses.filter(expense => expense.category == category);

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

const updateDonut = (groupedExenses) => {
    // eg prices = [400, 300, 700, 500]
    const prices = getExpenesPerMainCategory(groupedExenses)
    const ctx = document.getElementById('donutChart');


    const statistics = {
        labels: [
            `🍎 €${prices[0].toFixed(2)}`,
            `🎉 €${prices[1].toFixed(2)}`,
            `📎 €${prices[2].toFixed(2)}`,
            `⬜ €${prices[3].toFixed(2)}`
        ],
        datasets: [
            {
                data: prices,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(0, 122, 251, 0.5)',
                    'rgba(255, 205, 86, 0.5)',
                    'rgba(240, 240, 240, 0.5)',
                ],
            }
        ]
    };

    const plugin = {
        id: 'my-plugin',
        beforeDraw: (chart, args, options) => {
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
        type: 'doughnut',
        data: statistics,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 10,
                    }
                },
                title: {},
                labels: {
                    render: 'label+value',
                    fontSize: 14,
                    position: 'border', // outside, border
                    fontColor: '#FFFFFF',
                },
            }
        },
        plugins: [plugin]
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
    confirm(`Delete expense with id ${id}?`) ? deleteExpense(id) : null;
}

const getExepenseListItem = (id, day, monthNumeric, category, description, myPrice, priceBoth) => {
    const month = monthNumeric == '01' ? 'Jan' : monthNumeric == '02' ? 'Feb' : monthNumeric == '03' ? 'Mar' : monthNumeric == '04' ? 'Apr' : monthNumeric == '05' ? 'May' : monthNumeric == '06' ? 'Jun' : monthNumeric == '07' ? 'Jul' : monthNumeric == '08' ? 'Aug' : monthNumeric == '09' ? 'Sep' : monthNumeric == '10' ? 'Oct' : monthNumeric == '11' ? 'Nov' : 'Dec';

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
        ${getPriceText(myPrice, priceBoth)}
      </span>
    </li>
    `

}

const getPriceText = (myPrice, total) => {
    if (myPrice == total) {
        return `<span class="expenseItemTop blue" style="font-size: 0.9em;">${myPrice}</span> <br>
    <span class="expenseItemBot"></span>`
        // return `<span class="blue" style="font-size: 0.8em;">${myPrice} <br> </span>`;
    } else if (myPrice == 0) {
        return `&frasl;`;
    }
    return `<span style="font-size: 1.2em; position: relative; top: 10px;">
  <sup><span class="blue">${myPrice}</span></sup>&frasl;<sub><span class="expenseTotal">${total}</span></sub>
  </span>`
}


const updateExpensesAll = (expenses) => {
    const lst_expenses = document.getElementById('ul_expenses_all');
    lst_expenses.innerHTML = '';

    expenses.forEach(expense => {
        // const date = expense.date; // eg: dd-mm
        // convert to dd/mm
        const date = expense.date.split('-').reverse().join('/');
        const priceFabian = expense.price_fabian;
        const priceElisa = expense.price_elisa;
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


const listExpensesSummarized = () => {
    const fullUrl = `${url}/get_expenses?name=${getName()}`;
    betterFetch(fullUrl)
        .then(response => response.json())
        .then(data => {
            data = data.expenses;

            const tbl_expenses = document.getElementById('tbl_expenses');
            data.forEach(expense => {
                date = expense.date;
                price = expense.price;
                category = expense.category;
                subcategory = expense.subcategory;
                description = expense.description;
                id = expense.id;


                // final row is subcategories, if subcategories is null, set to empty string
                tbl_expenses.innerHTML +=
                    `<li id="${id}">
          <span>${date}</span> <span>${price}</span> <span>${category}</span> <span>${subcategory == null ? '' : subcategory}</span> <span>${description == null ? '' : description}</span>  
          </li>
        `
            });
        })
        .catch(e => handleError(e))
}


const checkSubmit = () => {
    if (inp_price.value != '' && inp_price.value != 0 && data.category != '') {
        btn_submit.disabled = false;
    } else {
        btn_submit.disabled = true;
    }
}

const chooseCategory = (button, category) => {
    // clear all other buttons back to original and set this button to active (#034286;)
    // buttons in div: div_categories
    const buttons = document.querySelectorAll('#div_categories a');

    buttons.forEach((btn) => {
        btn.style.backgroundColor = '#FFFFFF';
    });

    button.style.backgroundColor = '#8ac3ff';

    data.category = category;
    checkSubmit();
}

const submit = () => {
    // send data to server
    const price_me = inp_price_me.value;
    const price_other = inp_price_other.value;

    const price_fabian = getName() == FABIAN ? price_me : price_other;
    const price_elisa = getName() == FABIAN ? price_other : price_me;
    const paidBy = getName().toLowerCase();
    const category = data.category;
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
