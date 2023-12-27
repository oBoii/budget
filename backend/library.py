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


def get_total_expenses_grouped_by_category(nb_months_ago, monthly=False):  # eg -1 = last month
    # Connect to the SQLite database
    conn = sqlite3.connect(f"{ROOT}/expenses.db")
    cursor = conn.cursor()

    # Query the expenses for calculations
    if not monthly:
        cursor.execute(f"""
            SELECT category, sum(price_fabian), sum(price_elisa) FROM expenses
            WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '{nb_months_ago} months')
            GROUP BY category
            """)
    else:
        cursor.execute(f"""
            SELECT category, sum(price_fabian), sum(price_elisa) FROM monthly_expenses
            WHERE strftime('%Y-%m', start_date) <= strftime('%Y-%m', 'now', '{nb_months_ago} months') and
            (strftime('%Y-%m', end_date) >= strftime('%Y-%m', 'now', '{nb_months_ago} months') OR end_date IS NULL OR end_date = '')
            GROUP BY category
            """)
    rows = cursor.fetchall()

    # Perform debt calculations based on fetched data
    data = []
    for row in rows:
        category, price_fabian, price_elisa = row
        data.append(
            {
                "category": category,
                "price_fabian": price_fabian,
                "price_elisa": price_elisa,
            }
        )

    conn.close()
    return data


def get_expenses(nb_months_ago, monthly=False):  # nb_months_ago: 0 = current month, -1 = last month, etc.
    # Connect to the SQLite database
    conn = sqlite3.connect(f"{ROOT}/expenses.db")
    cursor = conn.cursor()

    if not monthly:
        # Expenses of `nb_months_ago` months ago
        query_indiv = f"""
                SELECT id, date, price_fabian, price_elisa, paid_by, category, subcategory, description
                FROM expenses
                WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '{nb_months_ago} months')
                ORDER by date DESC, id DESC
                """
    else:
        # Expenses of `nb_months_ago` months ago. (records don't have date, but instead start_date and end_date)
        query_indiv = f"""
                SELECT id, null as date, price_fabian, price_elisa, paid_by, category, subcategory, description
                FROM monthly_expenses
                WHERE strftime('%Y-%m', start_date) <= strftime('%Y-%m', 'now', '{nb_months_ago} months') and
                (strftime('%Y-%m', end_date) >= strftime('%Y-%m', 'now', '{nb_months_ago} months') OR end_date IS NULL OR end_date = '')
                ORDER by start_date DESC, id DESC
                """

    cursor.execute(query_indiv, ())
    rows = cursor.fetchall()

    # Perform expense calculations based on fetched data
    data = []
    for row in rows:
        (id, date, price_person, price_other, paid_by, category, subcategories, descriptions) = row

        category = category.replace("null", "")
        subcategories = subcategories.replace("null", "") if subcategories else ""
        descriptions = descriptions.replace("null", "")

        individual_cost = {
            "id": id,
            "date": datetime.strptime(date, "%Y-%m-%d").strftime("%d-%m") if date else "00-00",
            "price_fabian": price_person,
            "price_elisa": price_other,
            "paid_by": paid_by,
            "category": category,
            "subcategory": subcategories,
            "description": descriptions,
        }

        data.append(individual_cost)
    conn.close()

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


def get_historic_descriptions():
    # Connect to the SQLite database
    conn = sqlite3.connect(f"{ROOT}/expenses.db")
    cursor = conn.cursor()

    # Query the UNIQ list
    cursor.execute(
        """
        SELECT DISTINCT description FROM expenses
        WHERE description IS NOT NULL
        """
    )
    rows = cursor.fetchall()
    categories = [row[0] for row in rows]
    # remove `null` from the list
    categories = [c for c in categories if c != "null"]
    return categories
