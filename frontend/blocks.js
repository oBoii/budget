class UrlArgsService {
    static getMonth() {
        const urlParams = new URLSearchParams(window.location.search);
        const month = parseInt(urlParams.get('month'));
        return isNaN(month) ? 0 : month;
    }

    static getTrip() {
        const urlParams = new URLSearchParams(window.location.search);
        const trip = parseInt(urlParams.get('trip'));
        return isNaN(trip) ? 0 : trip;
    }
}


class Block {
    constructor(render_function) {
        const content = render_function();
        const container = document.createElement('div');
        container.innerHTML = content;
        document.getElementById('main').appendChild(container);
    }


}

class MainBlock extends Block {
    constructor() {
        super(MainBlock.render);
    }

    static render() {
        return `
        ${new DebtHeaderBlock().html()}
        ${new NewExpenseBlock().html()}
        ${new GraphsBlock().html()}
        ${new ExpenseHistoryBlock().html()}`
    }
}

class NewExpenseBlock {
    html() {
        return `
        <div id="div_price" class="margin">
            <!-- round up to 2 decimals -->
            <span>€</span> <input type="number" name="inp_price" id="inp_price" autofocus placeholder="0,00"
                                  class="form-control">
        </div>

        <div class="margin">
            <div class="put_slider_and_label_side_by_side vert-margin-sm">
                <span id="lbl_percent" style="vertical-align: top">##</span> &nbsp;
                <input type="range" name="inp_ratio" id="inp_ratio" min="0" max="100" value="100" step="10">
            </div>

            <div class="put_textsboxes_side_by_side vert-margin-sm">
                <input type="number" name="inp_price_me" id="inp_price_me" min="0" placeholder="Me"
                       class="form-control">
                &nbsp;
                <input type="number" name="inp_price_other" id="inp_price_other" min="0" placeholder="Other"
                       class="form-control">
            </div>
        </div>

        <!--Categories-->
        <div id="div_categories" class="margin">
            <div class="put_selects_side_by_side vert-margin-sm">
                <!-- USE HTML SELECT-TAG INSTEAD (A select tag for \`Basics\`, \`Fun\` and \`Infrequent\`) all items automatically added to the list using javascript -->
                <!-- Basics -->
                <select class="form-select" id="lst_categories_basics" style="width: 33%;"
                        onchange="NewExpense.chooseCategory(this)">
                    <option selected disabled>🍎 Basics</option>
                </select>

                <!-- Fun -->
                <select class="form-select" id="lst_categories_fun" style="width: 33%"
                        onchange="NewExpense.chooseCategory(this)">
                    <option selected disabled>🎉 Fun</option>
                </select>

                <!-- Infrequent -->
                <select class="form-select" id="lst_categories_infreq" style="width: 33%"
                        onchange="NewExpense.chooseCategory(this)">
                    <option selected disabled>📎 Infreq</option>
                </select>
            </div>

            <div class="vert-margin-sm">
                <input list="descriptions" name="inp_description" id="inp_description" placeholder="Beschrijving"
                       class="form-select">
                <!--filled using javascript-->
                <datalist id="descriptions"></datalist>
            </div>

        </div>


        <div id="div_submit" class="margin">
            <button name="btn_submit" id="btn_submit" onclick="NewExpense.submit()">Submit</button>
        </div>
        
        <div id="profile_name" class="margin" style="text-align: left;">
            Betaald door <span id="lbl_name" onclick="Auth.editName()">##</span>.
        </div>`
    }

}

class DebtHeaderBlock { //extends Block {
    html() {
        return `
        <div id="div_debts" class="side-by-side">
        <div class="left-div" style="width: 100%">
            <!-- Shows debt for Fabian and Elisa  -->
            <span id="lbl_name_has_debt">##</span> moet <span id="lbl_name_no_debt">##</span> <span
                id="lbl_debt">##</span>
            EUR.
        </div>
        <div class="middle-div">
            <button class="bg-darkgray" data-toggle="modal" data-target="#myModal">
                ☰
            </button>
        </div>

        <!-- The Modal -->
        <div class="modal" id="myModal">
            <div class="modal-dialog">
                <div class="modal-content">

                    <!-- Modal Header -->
                    <div class="modal-header">
                        <h4 class="modal-title">Previous trips</h4>
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                    </div>

                    <!-- Modal body -->
                    <div class="modal-body" style="text-align: left">
                        <ul class="expenseHistory" id="ul_trips_all">
                            <li class="expenseItem">
                                <span class="leftSpan">
                                <span class="expenseItemTop expenseItemDay">Jul</span> <br>
                                <span class="expenseItemBot">2024</span>
                                </span>
                                <span class="centerSpan">
                                    <span class="expenseItemTop">Oostenrijk</span> <br>
                                </span>
                                <span class="rightSpan">
                                    <span class="expenseItemTop blue" style="font-size: 0.9em;">40.30</span> <br>
                                    <span class="expenseItemBot"></span>
                                </span>
                            </li>
                        </ul>
                    </div>

                    <!-- Modal footer -->
                    <div class="modal-footer" style="text-align: left; padding-left: 0;">
                        <!--Descrip-->
                        <input id="inp_trip_description" type="text" placeholder="Add a new trip" class="form-control">
                        <!--Date-->
                        <input id="inp_trip_date" type="date" class="form-control">
                        <button onclick="TripsHistoryListComponent.addTrip()">Submit</button>
                    </div>

                </div>
            </div>
        </div>
    </div>`
    }
}

class GraphsBlock {
    html() {
        return `
        <div id="div_statistics" class="margin">
            <div class="swiper-container">
                <div class="swiper-wrapper">
                    <div class="swiper-slide">
                        <div style="margin-bottom: -4em; position: relative; top: -3em;">
                            <canvas id="donutChart"></canvas>
                        </div>
                    </div>
                    <div class="swiper-slide">
                        <div id="savings_per_month">
                            <canvas id="savingsChart"></canvas>
                        </div>
                        <div>
                            Average: <sup><span id="real_avg" style="color: #4BC0C0;">##</span></sup>&frasl;<sub><span
                                id="target_avg"
                                style="color: #FF6384;">##</span></sub>, Total: <span id="real_total"
                                                                                      style="color: #4BC0C0;">##k</span>
                        </div>
                    </div>
                </div>
            </div>
    
            <div id="div_budget_statistics" style="margin-bottom: 0.5em;">
                <!-- 💲2730 =  🍞750 + 🏠550 + ✈️1000 +  💸1200 -->
                💲<span id="lbl_income">##</span> = 🍞<span id="lbl_cap"></span> + 🏠<span id="lbl_rent">##</span> +
                ✈️<span id="lbl_longterm_savings">##</span> + 💸<span id="lbl_invest">##</span>
            </div>
            <div>
                <canvas id="barChart"></canvas>
            </div>
        </div>`
    }
}

class ExpenseHistoryNavigationButtonsBlock { //extends Block {
    html() {
        return `
        <div class="side-by-side margin-side">
            <div class="left-div" style="font-size: 1.1em;">
            </div>
            <div class="middle-div">
            
                <div style="position: relative; top: 8px;">
                    <nav aria-label="Page navigation example">
                        <ul class="pagination justify-content-center pagination">
            
                            <li class="page-item">
                                <a class="page-link" onclick="ExpensesListComponent.showOnlyPaidByMe()">
                                    <i class="fa" style="color: #3e3e3e; font-weight: lighter">&#xf0b0;</i>
                                </a>
                            </li>
            
                            <li class="page-item"> <!-- remove filters on expense list -->
                                <a class="page-link" onclick="ExpensesListComponent.clearExpensesFilter()">
                                    <i class="fa" style="color: #3e3e3e; font-weight: lighter">&#xf0c9;</i>
                                </a>
                            </li>
                            <li id="paginationPrev" class="page-item">
                                <a id="paginationPrevChild" class="page-link">&laquo;</a>
                            </li>
                            <li id="paginationCurr" class="page-item active">
                                <a id="paginationCurrChild" class="page-link">##</a>
                            </li>
                            <li id="paginationNext" class="page-item disabled"><a id="paginationNextChild"
                                                                                  class="page-link">&raquo;</a></li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
        `
    }
}

class ExpenseHistoryBlock { //extends Block {

    html() {
        return `
        ${new ExpenseHistoryNavigationButtonsBlock().html()}

        <div id="div_expenses">
            <ul id="ul_expenses_all" class="expenseHistory">
            </ul>
        </div>`
    }
}