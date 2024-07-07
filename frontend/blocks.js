class Block {
    constructor(render_function) {
        const content = render_function();
        const container = document.createElement('div');
        container.innerHTML = content;
        document.getElementById('main').appendChild(container);
    }


}

class NewExpenseBlock extends Block {
    constructor() {
        super(NewExpenseBlock.render);
    }

    static render() {
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
        </div>`
    }

}