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


const FABIAN = 'Fabian';
const ELISA = 'Elisa';

const data = {
  price: 0,
  ratio: 100,
  category: '',
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
  options.headers = { 'Authorization': 'Basic ' + btoa(getKey()) }
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

const updateDebts = () => {
  const fullUrl = `${url}/get_debts`;
  betterFetch(fullUrl)
    .then(response => response.json())
    .then(data => {
      fabian = data.fabian; // eg: +14.00
      elisa = data.elisa; // eg: +12.00
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
    })
    .catch(e => handleError(e))
}

const listExpensesSummarized = () => {
  const fullUrl = `${url}/get_expenses?name=${getName()}`;
  betterFetch(fullUrl)
    .then(response => response.json())
    .then(data => {
      data = data.expenses;
      console.log(data);

      const tbl_expenses = document.getElementById('tbl_expenses');
      data.forEach(expense => {
        date = expense.date;
        price = expense.price;
        category = expense.category;
        subcategory = expense.subcategory;
        description = expense.description;
        id = expense.id;

        console.log("**", subcategory);

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

const listExpensesAll = () => {
  const fullUrl = `${url}/get_expenses_all`;
  betterFetch(fullUrl)
    .then(response => response.json())
    .then(data => {
      data = data.expenses;
      console.log(data);

      const tbl_expenses = document.getElementById('tbl_expenses_all');
      data.forEach(expense => {
        // const date = expense.date; // eg: dd-mm
        // convert to dd/mm
        const date = expense.date.split('-').reverse().join('/');
        // convert to dd
        // const date = expense.date.split('-')[0];
        const priceFabian = expense.price_fabian;
        const priceElisa = expense.price_elisa;
        // const category = expense.category;
        // max 20 chars
        const category = expense.category.length > 5 ? expense.category.substring(0, 5) + '.' : expense.category;
        const subcategory = expense.subcategory;
        const description = expense.description;
        const paidBy = (expense.paid_by).charAt(0).toUpperCase();
        const id = expense.id;

        tbl_expenses.innerHTML +=
        // <td>${paidBy}</td> 
          `<tr>
            <td> <span class="badge rounded-pill bg-${paidBy.toLowerCase() == "f" ? "primary" : "warning"}">${paidBy}</span> </td>
            <td>${date}</td> <td>€ ${priceFabian}</td> <td>€  ${priceElisa}</td> <td>${category}</td> <td>${subcategory == null ? '' : subcategory}</td> <td>${description == null ? '' : description}</td>
            <td><button onclick="deleteExpense(${id})">x</button></td>
          </tr>
          `
        // `<li id="${id}">
        // <span>${date}</span> <span>${priceFabian}</span> <span>${priceElisa}</span> <span>${category}</span> <span>${subcategory == null ? '' : subcategory}</span> <span>${description == null ? '' : description}</span>
        // <button onclick="deleteExpense(${id})">Delete</button>
        // </li>
        // `

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
  console.log(btn_submit.disabled);
}

const chooseCategory = (button, category) => {
  // clear all other buttons back to original and set this button to active (#034286;)
  // buttons in div: div_categories
  const buttons = document.querySelectorAll('#div_categories button');

  buttons.forEach((btn) => {
    btn.style.backgroundColor = '#8ac3ff';
  });

  button.style.backgroundColor = '#034286';

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
  const description = null;

  const fullUrl = `${url}/add_expense?price_fabian=${price_fabian}&price_elisa=${price_elisa}&paid_by=${paidBy}&category=${category}&subcategory=${subcategory}&description=${description}`;

  betterFetch(fullUrl)
    .then(response => response.json())
    .then(data => {
      // console.log(data);
      // alert(data.message);
      location.reload();
    })
    .catch(e => handleError(e))

  // url: 
  console.log(data);
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
