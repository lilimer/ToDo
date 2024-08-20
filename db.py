import sqlite3


def get_db():
    conn = sqlite3.connect('tasks.db', check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task TEXT NOT NULL,
            done BOOLEAN NOT NULL,
            user_id INTEGER NOT NULL,
            expires TEXT NOT NULL
        )
    """)
    db.commit()
    db.close()