from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path
import sqlite3

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

DB_PATH = Path(__file__).with_name("ucl_insights.db")


def connect():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


def init_db():
    with connect() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS competitions (
                id INTEGER PRIMARY KEY, name TEXT NOT NULL, season TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS teams (
                id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, short_name TEXT
            );
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY, team_id INTEGER REFERENCES teams(id),
                name TEXT NOT NULL, nationality TEXT, position TEXT
            );
            CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY, competition_id INTEGER NOT NULL REFERENCES competitions(id),
                home_team_id INTEGER NOT NULL REFERENCES teams(id),
                away_team_id INTEGER NOT NULL REFERENCES teams(id),
                kickoff_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'finished',
                home_score INTEGER, away_score INTEGER, matchday INTEGER
            );
            CREATE TABLE IF NOT EXISTS player_match_stats (
                id INTEGER PRIMARY KEY, match_id INTEGER NOT NULL REFERENCES matches(id),
                player_id INTEGER NOT NULL REFERENCES players(id),
                goals INTEGER NOT NULL DEFAULT 0, assists INTEGER NOT NULL DEFAULT 0,
                rating REAL, UNIQUE(match_id, player_id)
            );
        """)
        if db.execute("SELECT COUNT(*) FROM competitions").fetchone()[0]:
            return
        db.execute("INSERT INTO competitions(name, season) VALUES (?, ?)",
                   ("UEFA Champions League", "2026/27"))
        competition_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        clubs = [
            ("Real Madrid", "RMA"), ("Liverpool", "LIV"),
            ("Barcelona", "BAR"), ("Bayern Munich", "BAY"),
            ("Arsenal", "ARS"), ("PSG", "PSG"),
            ("Inter Milan", "INT"), ("Manchester City", "MCI"),
            ("Dortmund", "BVB"), ("Juventus", "JUV"),
        ]
        db.executemany("INSERT INTO teams(name, short_name) VALUES (?, ?)", clubs)
        team_ids = {r["name"]: r["id"] for r in db.execute("SELECT id, name FROM teams")}
        fixtures = [
            ("Real Madrid", "Liverpool", "2026-11-01T20:00:00-04:00", 2, 1),
            ("Barcelona", "Bayern Munich", "2026-10-31T20:00:00-04:00", 3, 2),
            ("Arsenal", "PSG", "2026-10-30T20:00:00-04:00", 1, 1),
            ("Inter Milan", "Manchester City", "2026-10-29T20:00:00-04:00", 0, 2),
            ("Dortmund", "Juventus", "2026-10-28T20:00:00-04:00", 2, 0),
        ]
        db.executemany(
            """INSERT INTO matches(competition_id, home_team_id, away_team_id, kickoff_at,
               status, home_score, away_score, matchday) VALUES (?, ?, ?, ?, 'finished', ?, ?, 3)""",
            [(competition_id, team_ids[h], team_ids[a], kickoff, hs, aws)
             for h, a, kickoff, hs, aws in fixtures],
        )
        players = [
            ("Kylian Mbappé", "Real Madrid", "French", "Forward", 9.24, 8, 3),
            ("Erling Haaland", "Manchester City", "Norwegian", "Forward", 9.08, 7, 2),
            ("Harry Kane", "Bayern Munich", "English", "Forward", 8.96, 6, 3),
            ("Lamine Yamal", "Barcelona", "Spanish", "Forward", 8.84, 5, 4),
            ("Mohamed Salah", "Liverpool", "Egyptian", "Forward", 8.72, 5, 2),
        ]
        for name, club, nation, position, rating, goals, assists in players:
            db.execute("INSERT INTO players(team_id, name, nationality, position) VALUES (?, ?, ?, ?)",
                       (team_ids[club], name, nation, position))
            player_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
            match_id = db.execute("SELECT id FROM matches ORDER BY id LIMIT 1").fetchone()[0]
            db.execute(
                """INSERT INTO player_match_stats(match_id, player_id, goals, assists, rating)
                   VALUES (?, ?, ?, ?, ?)""",
                (match_id, player_id, goals, assists, rating),
            )


@asynccontextmanager
async def lifespan(_app):
    init_db()
    yield


app = FastAPI(title="WebSitesoccer API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Champions League API is running!", "status": "success"}


@app.get("/api/health")
@app.get("/health")
def health_check():
    with connect() as db:
        db.execute("SELECT 1").fetchone()
    return {"status": "healthy", "database": "connected", "engine": "sqlite"}


@app.get("/api/v1/matches")
def list_matches(limit: int = Query(default=10, ge=1, le=100),
                 team_id: int | None = None, date_from: date | None = None,
                 date_to: date | None = None):
    sql = """SELECT m.id, c.name AS competition, c.season, m.matchday, m.kickoff_at,
                    m.status, h.name AS home, h.short_name AS home_code,
                    a.name AS away, a.short_name AS away_code,
                    m.home_score, m.away_score
             FROM matches m JOIN competitions c ON c.id=m.competition_id
             JOIN teams h ON h.id=m.home_team_id JOIN teams a ON a.id=m.away_team_id"""
    clauses, values = [], []
    if team_id is not None:
        clauses.append("(m.home_team_id=? OR m.away_team_id=?)")
        values.extend([team_id, team_id])
    if date_from is not None:
        clauses.append("date(m.kickoff_at) >= ?")
        values.append(date_from.isoformat())
    if date_to is not None:
        clauses.append("date(m.kickoff_at) <= ?")
        values.append(date_to.isoformat())
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += " ORDER BY m.kickoff_at DESC LIMIT ?"
    values.append(limit)
    with connect() as db:
        return [dict(r) for r in db.execute(sql, values).fetchall()]


@app.get("/api/v1/players/top")
def top_players(limit: int = Query(default=5, ge=1, le=50),
                team_id: int | None = None):
    sql = """SELECT p.id, p.name, p.nationality AS country, p.position,
                    t.name AS club, t.short_name AS code,
                    ROUND(AVG(s.rating), 2) AS rating, SUM(s.goals) AS goals,
                    SUM(s.assists) AS assists, COUNT(*) AS appearances
             FROM players p JOIN teams t ON t.id=p.team_id
             JOIN player_match_stats s ON s.player_id=p.id"""
    values = []
    if team_id is not None:
        sql += " WHERE t.id=?"
        values.append(team_id)
    sql += " GROUP BY p.id ORDER BY AVG(s.rating) DESC, SUM(s.goals) DESC LIMIT ?"
    values.append(limit)
    with connect() as db:
        rows = db.execute(sql, values).fetchall()
    return [{**dict(row), "rank": index} for index, row in enumerate(rows, 1)]


@app.get("/api/v1/competitions")
def competitions():
    with connect() as db:
        return [dict(row) for row in db.execute("SELECT * FROM competitions ORDER BY season DESC")]


@app.get("/api/v1/players/{player_id}/stats")
def player_stats(player_id: int, season: str | None = None):
    with connect() as db:
        player = db.execute("SELECT id, name FROM players WHERE id=?", (player_id,)).fetchone()
        if player is None:
            return {"player_id": player_id, "stats": []}
        rows = db.execute(
            """SELECT s.* FROM player_match_stats s
               JOIN matches m ON m.id=s.match_id
               JOIN competitions c ON c.id=m.competition_id
               WHERE s.player_id=? AND (? IS NULL OR c.season=?)
               ORDER BY m.kickoff_at DESC""",
            (player_id, season, season),
        ).fetchall()
    return {"player_id": player_id, "player": player["name"],
            "season": season, "stats": [dict(row) for row in rows]}
