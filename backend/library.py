import json
import matplotlib.pyplot as plt
from root import ROOT
import os
from openpyxl import Workbook, load_workbook


def param(name):
    with open(ROOT + "params.json") as f:
        data = json.load(f)
        return data[name]


def append_expense(price, ratio, category, now):
    # append to csv
    with open(ROOT + "/expenses.csv", "a") as f:
        f.write(f"{now},{price},{ratio},{category}\n")


def append_expense_excel(price, ratio, category, name, now):
    # save columns: date, price, ratio, category, name

    ROOT = os.path.dirname(
        os.path.abspath(__file__)
    )  # Get the root directory of the script
    excel_file_path = os.path.join(ROOT, "expenses.xlsx")

    if not os.path.exists(excel_file_path):
        wb = Workbook()
        ws = wb.active
        ws.append(["Date", "Price", "Ratio", "Category", "Name"])
        wb.save(excel_file_path)

    wb = load_workbook(excel_file_path)
    ws = wb.active

    ws.append([now, price, ratio, category, name])
    wb.save(excel_file_path)


def get_debt_per_person():
    # Get the debt for Fabian and Elisa

    ROOT = os.path.dirname(
        os.path.abspath(__file__)
    )  # Get the root directory of the script
    excel_file_path = os.path.join(ROOT, "expenses.xlsx")

    if not os.path.exists(excel_file_path):
        wb = Workbook()
        ws = wb.active
        ws.append(["Date", "Price", "Ratio", "Category", "Name"])
        wb.save(excel_file_path)

    wb = load_workbook(excel_file_path)
    ws = wb.active

    # get list of expenses
    expenses = []
    ratios = []
    payed_by_name = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        expense = row[1]
        ratio = row[2]
        payed_by = row[4]
        if expense is None:
            continue

        print(expense, ratio, payed_by)
        expenses.append(expense)
        ratios.append(ratio)
        payed_by_name.append(payed_by)

    # eg: Fabian paid 40 EUR with ratio 60% so he payed 40 * (1 - 0.6) = 16 EUR for Elisa
    amt_fabian_payed_for_elisa = sum(
        [
            expenses[i] * (1 - ratios[i] / 100)
            for i in range(len(expenses))
            if payed_by_name[i].lower() == "fabian"
        ]
    )

    amt_elisa_payed_for_fabian = sum(
        [
            expenses[i] * (1 - ratios[i] / 100)
            for i in range(len(expenses))
            if payed_by_name[i].lower() == "elisa"
        ]
    )

    fabian = amt_fabian_payed_for_elisa - amt_elisa_payed_for_fabian
    elisa = -fabian

    return fabian, elisa


def get_expenses(name):
    # Get the expenses for `name`

    ROOT = os.path.dirname(
        os.path.abspath(__file__)
    )  # Get the root directory of the script
    excel_file_path = os.path.join(ROOT, "expenses.xlsx")

    if not os.path.exists(excel_file_path):
        wb = Workbook()
        ws = wb.active
        ws.append(["Date", "Price", "Ratio", "Category", "Name"])
        wb.save(excel_file_path)

    wb = load_workbook(excel_file_path)
    ws = wb.active

    # Get list of costs for `name`
    data = []

    for row in ws.iter_rows(min_row=2, values_only=True):
        date = row[0]
        expense = row[1]
        ratio = row[2]
        category = row[3]
        payed_by = row[4]

        if expense is None:
            continue

        individual_cost = {
            "date": date.strftime("%d-%m"),
            "price": 0,
            "category": category,
        }
        # if payed_by.lower() == name.lower():
        individual_cost["price"] = (
            expense * (ratio / 100)
            if payed_by.lower() == name.lower()
            else expense * (1 - ratio / 100)
        )

        # round to 2 decimals
        individual_cost["price"] = round(individual_cost["price"], 2)

        if individual_cost["price"] > 0:
            data.append(individual_cost)

    # reverse order
    data = data[::-1]

    # only first 25 entries
    data = data[:25]

    return data
