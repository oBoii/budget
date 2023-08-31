import sqlite3

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
