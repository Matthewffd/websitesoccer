
import React, { useEffect, useState } from "react";
import {
    LayoutDashboard,
    CalendarDays,
    Trophy,
    Users,
    BarChart3,
    Settings,
    Search,
    Bell,
    Clock,
    Goal,
    TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

const demoMatches = [
    { home: "Real Madrid", away: "Liverpool", score: "2 - 1", date: "Nov 1, 2026" },
    { home: "Barcelona", away: "Bayern Munich", score: "3 - 2", date: "Oct 31, 2026" },
    { home: "Arsenal", away: "PSG", score: "1 - 1", date: "Oct 30, 2026" },
    { home: "Inter Milan", away: "Manchester City", score: "0 - 2", date: "Oct 29, 2026" },
    { home: "Dortmund", away: "Juventus", score: "2 - 0", date: "Oct 28, 2026" },
];

const demoPlayers = [
    { name: "Kylian Mbappé", club: "Real Madrid", goals: 8, assists: 3 },
    { name: "Erling Haaland", club: "Manchester City", goals: 7, assists: 2 },
    { name: "Harry Kane", club: "Bayern Munich", goals: 6, assists: 3 },
    { name: "Lamine Yamal", club: "Barcelona", goals: 5, assists: 4 },
    { name: "Mohamed Salah", club: "Liverpool", goals: 5, assists: 2 },
];

function Dashboard() {
    const [matches, setMatches] = useState(demoMatches);
    const [players, setPlayers] = useState(demoPlayers);
    const [databaseConnected, setDatabaseConnected] = useState(false);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            fetch("http://localhost:8000/api/health").then((response) => {
                if (!response.ok) throw new Error("API unavailable");
                return response.json();
            }),
            fetch("http://localhost:8000/api/v1/matches?limit=5").then((response) => {
                if (!response.ok) throw new Error("Match query failed");
                return response.json();
            }),
            fetch("http://localhost:8000/api/v1/players/top?limit=5").then((response) => {
                if (!response.ok) throw new Error("Player query failed");
                return response.json();
            }),
        ]).then(([, apiMatches, apiPlayers]) => {
            if (cancelled) return;
            if (apiMatches.length) setMatches(apiMatches.map((match) => ({
                home: match.home, away: match.away,
                score: match.home_score == null ? "—" : (match.home_score + " - " + match.away_score),
                date: new Date(match.kickoff_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric"
                }),
            })));
            if (apiPlayers.length) setPlayers(apiPlayers);
            setDatabaseConnected(true);
        }).catch(() => {
            if (!cancelled) setDatabaseConnected(false);
        });
        return () => { cancelled = true; };
    }, []);
    const goalRows = matches.map((match) => {
        const scores = String(match.score).match(/\d+/g) || [];
        return {
            ...match,
            goals: scores.length === 2 ? Number(scores[0]) + Number(scores[1]) : null,
        };
    }).filter((match) => match.goals !== null);
    const peakGoals = Math.max(1, ...goalRows.map((match) => match.goals));
    const totalRecentGoals = goalRows.reduce((sum, match) => sum + match.goals, 0);
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="logo">
                    <Trophy size={27} />
                    <span>UCL <strong>INSIGHT</strong></span>
                </div>

                <p className="sidebar-label">MENU</p>

                <Link to="/" className="nav-item active">
                    <LayoutDashboard size={19} /> Dashboard
                </Link>

                <Link to="/matches" className="nav-item">
                    <CalendarDays size={19} /> Matches
                </Link>

                <a href="#players" className="nav-item">
                    <Users size={19} /> Players
                </a>

                <a href="#analytics" className="nav-item">
                    <BarChart3 size={19} /> Analytics
                </a>

                <div className="sidebar-bottom">
                    <a href="#settings" className="nav-item">
                        <Settings size={19} /> Settings
                    </a>
                    <p>UEFA Champions League</p>
                    <small>2026 / 2027 Season</small>
                </div>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <div>
                        <h2>Dashboard</h2>
                        <p>Champions League statistics and insights</p>
                    </div>

                    <div className="topbar-actions">
                        <button className="icon-button"><Search size={19} /></button>
                        <button className="icon-button"><Bell size={19} /></button>
                        <div className="avatar">U</div>
                    </div>
                </header>

                <section className="welcome-section">
                    <div>
                        <span className="eyebrow">2026 / 2027 SEASON</span>
                        <h1>Champions League Overview</h1>
                        <p>Follow the latest matches, players and performance statistics.</p>
                    </div>
                    <div className="season-badge"><Trophy size={20} /> UEFA Champions League</div>
                </section>

                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon"><Goal size={22} /></div>
                        <p>Total Goals</p>
                        <h2>248</h2>
                        <span>Demo statistics</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon"><Users size={22} /></div>
                        <p>Teams</p>
                        <h2>36</h2>
                        <span>League phase</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon"><CalendarDays size={22} /></div>
                        <p>Matches Played</p>
                        <h2>72</h2>
                        <span>Demo statistics</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon"><TrendingUp size={22} /></div>
                        <p>Goals per Match</p>
                        <h2>3.44</h2>
                        <span>Demo statistics</span>
                    </div>
                </section>

                <section className="content-grid">
                    <div className="panel">
                        <div className="panel-header">
                            <div>
                                <h2>Recent Matches</h2>
                                <p>Latest match results</p>
                            </div>
                            <Link to="/matches" className="view-link">View all →</Link>
                        </div>

                        <div className="match-list">
                            {matches.map((match, index) => (
                                <div className="match-row" key={index}>
                                    <div className="match-teams">
                                        <strong>{match.home}</strong>
                                        <span>vs</span>
                                        <strong>{match.away}</strong>
                                    </div>
                                    <div className="match-result">{match.score}</div>
                                    <div className="match-date">{match.date}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="panel" id="players">
                        <div className="panel-header">
                            <div>
                                <h2>Top 5 Players</h2>
                                <p>Goals and assists leaders</p>
                            </div>
                            <Trophy size={20} />
                        </div>

                        <div className="player-list">
                            {players.map((player, index) => (
                                <div className="player-row" key={player.name}>
                                    <div className="player-rank">{index + 1}</div>
                                    <div className="player-info">
                                        <strong>{player.name}</strong>
                                        <span>{player.club}</span>
                                    </div>
                                    <div className="player-stats">
                                        <strong>{player.goals} G</strong>
                                        <span>{player.assists} A</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="panel bottom-panel" id="analytics">
                    <div className="panel-header">
                        <div>
                            <h2>Performance Analytics</h2>
                            <p>Goals scored across the latest results</p>
                        </div>
                        <BarChart3 size={22} />
                    </div>
                    <div className="goal-insights">
                        <div className="goal-insights-summary">
                            <div>
                                <span className="goal-insights-label">TOTAL GOALS</span>
                                <strong>{totalRecentGoals}</strong>
                            </div>
                            <span className="goal-insights-chip">LAST {goalRows.length} MATCHES</span>
                        </div>
                        <div className="goal-bars">
                            {goalRows.map((match) => (
                                <div className="goal-bar-row" key={match.home + "-" + match.away}>
                                    <div className="goal-bar-heading">
                                        <span><b>{match.home}</b><i>vs</i><b>{match.away}</b></span>
                                        <strong>{match.goals}</strong>
                                    </div>
                                    <div className="goal-bar-track">
                                        <span style={{ width: ((match.goals / peakGoals) * 100) + "%" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <footer className="footer">
                    <Clock size={14} />
                    {databaseConnected ? "Database connected" : "Demo data"} · Sample data only · Not verified match results
                </footer>
            </main>
        </div>
    );
}

export default Dashboard;



