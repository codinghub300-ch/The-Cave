import sqlite3

def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()

    # Users Table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        points INTEGER DEFAULT 0,
        rooms_solved TEXT DEFAULT '[]',
        time_finished DATETIME
    )''')

    # Flags Table (Backend Only)
    c.execute('''CREATE TABLE IF NOT EXISTS flags (
        room_id TEXT PRIMARY KEY,
        flag_value TEXT,
        base_points INTEGER
    )''')

    # Solves Table (To calculate decreasing points)
    c.execute('''CREATE TABLE IF NOT EXISTS solves (
        room_id TEXT,
        username TEXT,
        solve_order INTEGER
    )''')

    # Insert secure flags
    flags = [
        ('room1', 'CAVE{2025-03-15-North}', 25),
        ('room2', 'CAVE{protocol_decoder}', 25),
        ('room3', 'CAVE{N3TW0RK_DR1FT}', 50),
        ('room4', 'CAVE{sql_escape}', 50),
        
    ]
    c.executemany('INSERT OR IGNORE INTO flags VALUES (?, ?, ?)', flags)

    conn.commit()
    conn.close()
    print("Database initialized securely.")

if __name__ == '__main__':
    init_db()