from flask import Flask, render_template, request, session, jsonify, send_file, redirect, url_for
import sqlite3
import json
import os

app = Flask(__name__)
app.secret_key = 'super_secret_cave_key_change_in_production'


def get_db():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/')
def index():
    return render_template('loading.html')


@app.route('/login', methods=['GET', 'POST'])
def login():

    if request.method == 'POST':

        username = request.form['username']
        password = request.form['password']

        db = get_db()

        user = db.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,)
        ).fetchone()

        if not user:

            db.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                (username, password)
            )
            db.commit()

            user = db.execute(
                "SELECT * FROM users WHERE username = ?",
                (username,)
            ).fetchone()

        session['username'] = user['username']
        session['rooms_solved'] = json.loads(user['rooms_solved'])

        return redirect(url_for('rooms'))

    return render_template('login.html')


@app.route('/rooms')
def rooms():

    if 'username' not in session:
        return redirect(url_for('login'))

    return render_template(
        'rooms.html',
        solved=session.get('rooms_solved', [])
    )


# ---------------- ROOMS ----------------

@app.route('/room/1')
def room1():

    if 'username' not in session:
        return redirect(url_for('login'))

    return render_template('room1.html')


@app.route('/room/2')
def room2():

    if 'username' not in session:
        return redirect(url_for('login'))

    if 'room1' not in session.get('rooms_solved', []):
        return redirect(url_for('rooms'))

    return render_template('room2.html')


@app.route('/room/3')
def room3():

    if 'username' not in session:
        return redirect(url_for('login'))

    if 'room1' not in session.get('rooms_solved', []):
        return redirect(url_for('rooms'))

    return render_template('room3.html')


@app.route('/room/4')
def room4():

    if 'username' not in session:
        return redirect(url_for('login'))

    solved = session.get('rooms_solved', [])

    if 'room2' not in solved or 'room3' not in solved:
        return redirect(url_for('rooms'))

    return render_template('room4.html')


# ---------------- PCAP & XLSX DOWNLOAD ----------------

@app.route('/download/pcap')
def download_pcap():

    if 'username' not in session:
        return redirect(url_for('login'))

    filepath = 'cave_data/packets_capture.pcap'

    if not os.path.exists(filepath):
        return "PCAP file not found", 404

    return send_file(
        filepath,
        as_attachment=True
    )


@app.route('/download/xlsx')
def download_xlsx():

    if 'username' not in session:
        return redirect(url_for('login'))

    filepath = 'cave_data/data_analysis.xlsx'

    if not os.path.exists(filepath):
        return "Excel file not found", 404

    return send_file(
        filepath,
        as_attachment=True
    )


# ---------------- FLAG VALIDATION ----------------

@app.route('/api/submit_flag', methods=['POST'])
def submit_flag():

    if 'username' not in session:
        return jsonify({'status': 'error', 'msg': 'Unauthorized'})

    data = request.json

    room_id = data.get('room_id')
    submitted_flag = data.get('flag')

    db = get_db()

    correct_flag = db.execute(
        "SELECT * FROM flags WHERE room_id = ?",
        (room_id,)
    ).fetchone()

    if correct_flag and correct_flag['flag_value'] == submitted_flag:

        if room_id in session.get('rooms_solved', []):
            return jsonify({'status': 'already_solved'})

        solves = db.execute(
            "SELECT COUNT(*) as count FROM solves WHERE room_id = ?",
            (room_id,)
        ).fetchone()['count']

        points_to_award = max(
            50,
            correct_flag['base_points'] - (solves * 10)
        )

        username = session['username']

        db.execute(
            "INSERT INTO solves (room_id, username, solve_order) VALUES (?, ?, ?)",
            (room_id, username, solves + 1)
        )

        user = db.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,)
        ).fetchone()

        solved_list = json.loads(user['rooms_solved'])
        solved_list.append(room_id)

        db.execute(
            "UPDATE users SET points = points + ?, rooms_solved = ? WHERE username = ?",
            (points_to_award, json.dumps(solved_list), username)
        )

        db.commit()

        session['rooms_solved'] = solved_list

        return jsonify({
            'status': 'success',
            'points': points_to_award
        })

    return jsonify({
        'status': 'error',
        'msg': 'Incorrect Flag'
    })


# ---------------- SQLi ROOM ----------------

@app.route('/api/room4_login', methods=['POST'])
def room4_login():

    data = request.json

    username = data.get('username', '')
    password = data.get('password', '')

    sqli_payloads = [
        "' OR '1'='1",
        "' OR 1=1",
        "' OR 'a'='a",
        '" OR "1"="1'
    ]

    is_bypassed = any(
        payload in username or payload in password
        for payload in sqli_payloads
    )

    if is_bypassed or username == "admin' --":

        db = get_db()

        flag = db.execute(
            "SELECT flag_value FROM flags WHERE room_id='room4'"
        ).fetchone()['flag_value']

        return jsonify({
            'status': 'success',
            'msg': 'Bypass successful. Welcome, Admin.',
            'flag': flag
        })

    return jsonify({
        'status': 'error',
        'msg': 'Invalid credentials. Access Denied.'
    })


# ---------------- LEADERBOARD ----------------

@app.route('/leaderboard')
def leaderboard():

    db = get_db()

    users = db.execute(
        "SELECT username, points, rooms_solved FROM users ORDER BY points DESC"
    ).fetchall()

    leaderboard_data = []

    for user in users:

        solved_list = json.loads(user['rooms_solved'])

        leaderboard_data.append({
            'username': user['username'],
            'points': user['points'],
            'rooms_count': len(solved_list)
        })

    return render_template(
        'leaderboard.html',
        players=leaderboard_data
    )


# ---------------- WINNERS ----------------

@app.route('/winners')
def winners():

    if 'username' not in session:
        return redirect(url_for('login'))

    solved = session.get('rooms_solved', [])

    required_rooms = ['room1', 'room2', 'room3', 'room4']

    if not all(r in solved for r in required_rooms):
        return redirect(url_for('rooms'))

    db = get_db()

    top_players = db.execute(
        "SELECT username, points FROM users ORDER BY points DESC LIMIT 3"
    ).fetchall()

    return render_template(
        'winners.html',
        top_players=top_players
    )


if __name__ == '__main__':
    app.run(port=5000, debug=True)