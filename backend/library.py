import json
import sqlite3
from datetime import datetime
from root import ROOT


def param(name):
    with open(f"{ROOT}params.json") as f:
        data = json.load(f)
        return data[name]


def append_expense(
    price_fabian, price_elisa, paid_by, category, description, subcategory, now
):
    # Connect to the SQLite database
    conn = sqlite3.connect("expenses.db")
    cursor = conn.cursor()

    # Insert the expense into the expenses table
    cursor.execute(
        """
        INSERT INTO expenses (date, price_fabian, price_elisa, paid_by, category, description, subcategory)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            now.strftime("%Y-%m-%d"),
            price_fabian,
            price_elisa,
            paid_by.lower(),
            category,
            description,
            subcategory,
        ),
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


def get_expenses(name):
    # Connect to the SQLite database
    conn = sqlite3.connect("expenses.db")
    cursor = conn.cursor()

    # Query the expenses for the specified person, group by date and category.
    # The price is summed up for each date and category.
    # the subcategories are all appended in a single column/string
    cursor.execute(
        f"""
        SELECT date,  sum(price_{name.lower()}) as price, category, group_concat(subcategory, ', ') as subcategories, group_concat(description, ', ') as descriptions
        WHERE price_{name.lower()} > 0 AND price_{name.lower()} IS NOT NULL
        group by date, category
        ORDER by date DESC
        """,
        (),  # (name,),
    )
    rows = cursor.fetchall()

    # Perform expense calculations based on fetched data
    data = []
    for row in rows:
        date, price_person, category, subcategories, descriptions = row
        individual_cost = {
            "date": datetime.strptime(date, "%Y-%m-%d").strftime("%d-%m"),
            "price": price_person,
            "category": category,
            "description": descriptions,
            "subcategory": subcategories,
        }
        data.append(individual_cost)

    conn.close()

    # Group expenses by category and date
    # TODO
    # data = group_expenses_by_category_and_date(data)

    return data
