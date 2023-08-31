import json
from datetime import datetime
import seaborn as sns
from flask_httpauth import HTTPBasicAuth
from flask import Flask, request
from flask_cors import CORS
from library import append_expense, get_debt_per_person, get_expenses, param


sns.set_theme()


app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})
auth = HTTPBasicAuth()


@auth.verify_password
def verify_password(username, password):
    if username == "fabian" and password == "cool":
        return username


@app.route("/get_debts")
@auth.login_required
def page_index():
    # get debt per person
    fabian, elisa = get_debt_per_person()
    # round to 2 decimals
    fabian = round(fabian, 2)
    elisa = round(elisa, 2)

    return json.dumps({"fabian": fabian, "elisa": elisa})


@app.route("/get_expenses")
@auth.login_required
def page_get_expenses():
    name = request.args.get("name")
    expenses = get_expenses(name)
    return json.dumps({"expenses": expenses})


@auth.login_required
@app.route("/add_expense")
def page_add_expense():
    # retrieve params: price, ratio, category
    r = request
    price_fabian = float(r.args.get("price_fabian"))
    price_elisa = float(r.args.get("price_elisa"))
    paid_by = r.args.get("paid_by")
    category = r.args.get("category")
    subcategory = r.args.get("subcategory")
    description = r.args.get("description")
    now = datetime.now()

    append_expense(
        price_fabian, price_elisa, paid_by, category, description, subcategory, now
    )
    return json.dumps({"message": "Expense added"})


if not (param("isServer")):
    app.run()
