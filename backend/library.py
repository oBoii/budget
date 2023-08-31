import json
import sqlite3
from datetime import datetime
from root import ROOT


def param(name):
    with open(f"{ROOT}params.json") as f:
        data = json.load(f)
        return data[name]


def append_expense(price_fabian, price_elisa, paid_by, category, description, subcategory, now):
    # Connect to the SQLite database
    conn = sqlite3.connect("expenses.db")
    cursor = conn.cursor()

    # Insert the expense into the expenses table
    cursor.execute(
        """
        INSERT INTO expenses (date, price_fabian, price_elisa, paid_by, category, description, subcategory)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (now.strftime("%Y-%m-%d"), price_fabian, price_elisa, paid_by.lower(), category, description, subcategory),
    )

    # Commit the changes and close the connection
    conn.commit()
    conn.close()


def get_debt_per_person():
    # Connect to the SQLite database
    conn = sqlite3.connect("expenses.db")
    cursor = conn.cursor()

    # Query the expenses for calculations
    cursor.execute(
        """
        SELECT price_fabian, price_elisa, paid_by FROM expenses
        """
    )
    rows = cursor.fetchall()

    # Perform debt calculations based on fetched data
    fabian = 0
    elisa = 0
    for row in rows:
        price_fabian, price_elisa, paid_by = row
        if paid_by.lower() == "fabian":
            # fabian paid `price_elisa` for elisa so Elisa has debt
            elisa += price_elisa
        elif paid_by.lower() == "elisa":
            fabian += price_fabian
        else:
            raise ValueError("Invalid value for `paid_by`")

    conn.close()
    return fabian, elisa


def group_expenses_by_category_and_date(data):
    # list of dicts
    data_grouped_by_category_and_date = []

    # the categories that are already used for a given date. If a category is already used for a given date, we need to add the price to the existing entry
    occupied_categories = []
    current_date = None
    for entry in data:
        category = entry["category"]
        date = entry["date"]

        if date != current_date:
            # new entry
            data_grouped_by_category_and_date.append(entry)
            current_date = date
            occupied_categories = [category]
        else:
            if category in occupied_categories:
                # add to existing entry

                # iterate over all entries in reverse order
                for i in range(len(data_grouped_by_category_and_date) - 1, -1, -1):
                    if (
                        data_grouped_by_category_and_date[i]["category"] == category
                        and data_grouped_by_category_and_date[i]["date"] == date
                    ):
                        # add price to this entry
                        data_grouped_by_category_and_date[i]["price"] += entry["price"]
                        break

            else:
                # create new entry
                data_grouped_by_category_and_date.append(entry)
                occupied_categories.append(category)

    return data_grouped_by_category_and_date

def get_expenses(name):
    # Connect to the SQLite database
    conn = sqlite3.connect("expenses.db")
    cursor = conn.cursor()

    # Query the expenses for the specified person
    cursor.execute(
        f"""
        SELECT date, price_{name.lower()} as price, category, description, subcategory FROM expenses
        WHERE price_{name.lower()} > 0 AND price_{name.lower()} IS NOT NULL
        ORDER by date DESC
        """,
        (), # (name,),
    )
    rows = cursor.fetchall()

    # Perform expense calculations based on fetched data
    data = []
    for row in rows:
        date, price_person, category, description, subcategory = row
        individual_cost = {
            "date": datetime.strptime(date, "%Y-%m-%d").strftime("%d-%m"),
            "price": price_person,
            "category": category,
            "description": description,
            "subcategory": subcategory,
        }
        data.append(individual_cost)

    conn.close()

    # Group expenses by category and date
    # TODO
    # data = group_expenses_by_category_and_date(data)

    return data
