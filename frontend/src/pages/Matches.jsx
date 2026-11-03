
import { useState } from "react";
import { Search, CalendarDays, Trophy, ArrowLeft } from "lucide-react";

const matchData = [
    { date: "2026-10-28", home: "Real Madrid", away: "Liverpool", homeScore: 2, awayScore: 1 },
    { date: "2026-10-28", home: "Barcelona", away: "Bayern Munich", homeScore: 3, awayScore: 2 },
    { date: "2026-10-29", home: "PSG", away: "Arsenal", homeScore: 1, awayScore: 1 },
    { date: "2026-10-29", home: "Manchester City", away: "Inter", homeScore: 2, awayScore: 0 },
    { date: "2026-10-30", home: "AC Milan", away: "Dortmund", homeScore: 1, awayScore: 2 },
    { date: "2026-10-30", home: "Chelsea", away: "Juventus", homeScore: 2, awayScore: 2 },
    { date: "2026-10-31", home: "Benfica", away: "Atletico Madrid", homeScore: 0, awayScore: 1 },
    { date: "2026-10-31", home: "Ajax", away: "Napoli", homeScore: 1, awayScore: 3 },
    { date: "2026-11-01", home: "Porto", away: "PSV", homeScore: 2, awayScore: 0 },
    { date: "2026-11-01", home: "Tottenham", away: "Inter", homeScore: 1, awayScore: 1 },
];

export default function Matches() {
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    const filteredMatches = matchData.filter((match) => {
        const searchMatch =
            match.home.toLowerCase().includes(search.toLowerCase()) ||
            match.away.toLowerCase().includes(search.toLowerCase());

        const dateMatch = !dateFilter || match.date === dateFilter;

        return searchMatch && dateMatch;
    });

    return (
        <div className="matches-page">
            <header className="matches-header">
                <div>
                    <span className="breadcrumb">UCL / MATCHES</span>
                    <h1>Champions League Matches</h1>
                    <p>Explore match results and team performances.</p>
                </div>
                <Trophy size={45} color="#a78bfa" />
            </header>

            <div className="match-filters">
                <div className="search-box">
                    <Search size={18}/>
                    <input
                        placeholder="Search club..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="date-box">
                    <CalendarDays size={18}/>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                </div>

                <button onClick={() => {
                    setSearch("");
                    setDateFilter("");
                }}>
                    Clear filters
                </button>
            </div>

            <div className="matches-summary">
                <h3>Match results</h3>
                <span>{filteredMatches.length} matches found</span>
            </div>

            <div className="matches-list">
                {filteredMatches.length > 0 ? (
                    filteredMatches.map((match, index) => (
                        <div className="match-card" key={index}>
                            <div className="match-date">
                                {new Date(match.date + "T12:00:00").toLocaleDateString("en-US", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric"
                                })}
                            </div>

                            <div className="club home-club">{match.home}</div>

                            <div className="match-score">
                                {match.homeScore} : {match.awayScore}
                                <span>FINISHED</span>
                            </div>

                            <div className="club away-club">{match.away}</div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        No matches found. Try another search.
                    </div>
                )}
            </div>

            <a href="/" className="back-link">
                <ArrowLeft size={16}/> Back to Dashboard
            </a>

            <p className="demo-note">
                Demo match data for development purposes. Not verified official UCL results.
            </p>
        </div>
    );
}
