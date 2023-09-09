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
    conn = sqlite3.connect(f"{ROOT}/expenses.db")
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
    conn = sqlite3.connect(f"{ROOT}/expenses.db")
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


def get_expenses(name, grouped):
    assert (name in ["fabian", "elisa"] and grouped) or (name is None and not grouped)

    # Connect to the SQLite database
    conn = sqlite3.connect(f"{ROOT}/expenses.db")
    cursor = conn.cursor()

    query_group = f"""
            SELECT max(id) as id, date, sum(price_{name}) as price, sum(price_{name}) as price2, sum(price_{name}) as price3, category, group_concat(subcategory, ', ') as subcategories, group_concat(description, ', ') as descriptions
            FROM expenses
            WHERE price_{name} > 0 AND price_{name} IS NOT NULL
            group by date, category
            ORDER by date DESC"""

    query_indiv = """
            SELECT id, date, price_fabian, price_elisa, paid_by, category, subcategory, description
            FROM expenses
            ORDER by date DESC"""

    cursor.execute(
        query_group if grouped else query_indiv,
        (),  # (name,),
    )
    rows = cursor.fetchall()

    # Perform expense calculations based on fetched data
    data = []
    for row in rows:
        id, date, price_person, price_other, paid_by, category, subcategories, descriptions = row

        if grouped:
            # remove 'null, ' from subcategories and descriptions
            subcategories = subcategories.replace("null, ", "")
            descriptions = descriptions.replace("null, ", "")
            subcategories = subcategories.replace("null", "")
            descriptions = descriptions.replace("null", "")

            individual_cost = {
                "id": id,
                "date": datetime.strptime(date, "%Y-%m-%d").strftime("%d-%m"),
                "price": price_person,
                "category": category,
                "description": descriptions,
                "subcategory": subcategories,
            }
        else:
            category = category.replace("null", "")
            subcategories = subcategories.replace("null", "")
            descriptions = descriptions.replace("null", "")
            
            individual_cost = {
                "id": id,
                "date": datetime.strptime(date, "%Y-%m-%d").strftime("%d-%m"),
                "price_fabian": price_person,
                "price_elisa": price_other,
                "paid_by": paid_by,
                "category": category,
                "subcategory": subcategories,
                "description": descriptions,
            }

        data.append(individual_cost)
    conn.close()

    # Group expenses by category and date
    data = data[:100]  # only show the most recent entries

    return data


def delete_expense(id):
    # Connect to the SQLite database
    conn = sqlite3.connect(f"{ROOT}/expenses.db")
    cursor = conn.cursor()

    # group: id: take the maximum
    cursor.execute(
        """
        DELETE FROM expenses
        WHERE id = ?
        """,
        (id,),
    )

    conn.commit()
    conn.close()

    return True
