
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Matches from "./pages/Matches";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/matches" element={<Matches />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
