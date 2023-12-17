import sqlite3


def create_expenses_table():
    # Connect to or create an SQLite database
    conn = sqlite3.connect("expenses.db")
    cursor = conn.cursor()

    # Create a table to store expenses
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY,
            date date NOT NULL,
            price_fabian REAL,
            price_elisa REAL,
            paid_by TEXT, -- either "fabian" or "elisa"
            category TEXT,
            description TEXT DEFAULT NULL,
            subcategory TEXT DEFAULT NULL
        )
    """
    )

    # Commit the changes and close the connection
    conn.commit()
    conn.close()


def create_monthly_expenses_table():
    # Connect to or create an SQLite database
    conn = sqlite3.connect("expenses.db")
    cursor = conn.cursor()

    # Create a table to store monthly expenses
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS monthly_expenses (
            id INTEGER PRIMARY KEY,
            start_date date NOT NULL,
            end_date date DEFAULT NULL, -- optional end date
            price_fabian REAL,
            price_elisa REAL,
            paid_by TEXT, -- either "fabian" or "elisa"
            category TEXT,
            description TEXT DEFAULT NULL,
            subcategory TEXT DEFAULT NULL
        )
    """
    )

    # Commit the changes and close the connection
    conn.commit()
    conn.close()


if __name__ == "__main__":
    create_monthly_expenses_table()