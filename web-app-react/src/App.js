import React, { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import "./App.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const PAGE_SIZE = 20;
const COLORS = [
  "#6c63ff","#a78bfa","#f472b6","#fb923c","#facc15",
  "#4ade80","#22d3ee","#60a5fa","#e879f9","#f87171",
  "#34d399","#fbbf24","#818cf8","#fb7185","#a3e635",
];

function App() {
  const [allGames, setAllGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchId, setSearchId] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const tableRef = useRef(null);

  // Cargar datos de Firestore
  useEffect(() => {
    async function loadData() {
      try {
        const snapshot = await getDocs(collection(db, "videogames"));
        const games = [];
        snapshot.forEach((docSnap) => {
          games.push({ id: docSnap.id, ...docSnap.data() });
        });
        games.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        setAllGames(games);
        setFilteredGames(games);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Generos unicos
  const genres = [...new Set(allGames.map((g) => g.genre).filter(Boolean))].sort();

  // Stats
  const totalGames = allGames.length;
  const totalGenres = genres.length;
  const scores = allGames.map((g) => g.critic_score).filter((s) => s > 0);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
  const maxSales = allGames.length > 0 ? Math.max(...allGames.map((g) => g.total_sales || 0)).toFixed(2) : 0;

  // Chart data - ventas por genero
  const genreSales = {};
  allGames.forEach((g) => {
    if (g.genre) genreSales[g.genre] = (genreSales[g.genre] || 0) + (g.total_sales || 0);
  });
  const sortedGenres = Object.entries(genreSales).sort((a, b) => b[1] - a[1]);

  const doughnutData = {
    labels: sortedGenres.map((e) => e[0]),
    datasets: [{
      data: sortedGenres.map((e) => parseFloat(e[1].toFixed(2))),
      backgroundColor: COLORS,
      borderColor: "#0f0f23",
      borderWidth: 2,
    }],
  };

  // Chart data - top 10
  const top10 = [...allGames].sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0)).slice(0, 10);

  const barData = {
    labels: top10.map((g) => g.title ? g.title.substring(0, 25) : "N/A"),
    datasets: [{
      label: "Ventas (Millones)",
      data: top10.map((g) => g.total_sales || 0),
      backgroundColor: "#6c63ff",
      borderRadius: 6,
    }],
  };

  const barOptions = {
    responsive: true,
    indexAxis: "y",
    scales: {
      x: { ticks: { color: "#8888aa" }, grid: { color: "#1f1f3a" } },
      y: { ticks: { color: "#a0a0c0", font: { size: 11 } }, grid: { display: false } },
    },
    plugins: { legend: { display: false } },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: "right", labels: { color: "#a0a0c0", font: { size: 11 } } },
    },
  };

  // Buscar
  const handleSearch = useCallback(async () => {
    if (searchId.trim()) {
      try {
        const docSnap = await getDoc(doc(db, "videogames", searchId.trim()));
        if (docSnap.exists()) {
          setFilteredGames([{ id: docSnap.id, ...docSnap.data() }]);
        } else {
          setFilteredGames([]);
        }
      } catch (err) {
        console.error("Error buscando por ID:", err);
      }
      setCurrentPage(1);
      tableRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    let results = [...allGames];
    if (searchTitle.trim()) {
      const term = searchTitle.toLowerCase();
      results = results.filter((g) => g.title && g.title.toLowerCase().includes(term));
    }
    if (filterGenre) {
      results = results.filter((g) => g.genre === filterGenre);
    }
    setFilteredGames(results);
    setCurrentPage(1);
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [searchId, searchTitle, filterGenre, allGames]);

  const resetSearch = () => {
    setSearchId("");
    setSearchTitle("");
    setFilterGenre("");
    setFilteredGames(allGames);
    setCurrentPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // Paginacion
  const totalPages = Math.ceil(filteredGames.length / PAGE_SIZE) || 1;
  const pageData = filteredGames.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const maxSalesValue = allGames.length > 0 ? Math.max(...allGames.map((g) => g.total_sales || 0), 1) : 1;

  const getScoreClass = (score) => {
    if (score >= 8) return "score-high";
    if (score < 5) return "score-low";
    return "score-mid";
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div>Cargando datos desde Firestore...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading" style={{ color: "#f87171" }}>
        Error al cargar datos: {error}
      </div>
    );
  }

  return (
    <>
      <header>
        <h1><span>🎮</span> Video Games Sales Dashboard</h1>
        <p>Base de datos serverless con Firebase Firestore | Dataset de Kaggle</p>
      </header>

      <div className="container">
        {/* Search */}
        <div className="search-section">
          <h2>Buscar Videojuegos</h2>
          <div className="search-row">
            <div className="search-group">
              <label>Buscar por ID</label>
              <input
                type="number"
                placeholder="Ej: 1, 50, 100..."
                min="1"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="search-group">
              <label>Buscar por Titulo</label>
              <input
                type="text"
                placeholder="Ej: Grand Theft Auto, Halo..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="search-group">
              <label>Filtrar por Genero</label>
              <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
                <option value="">Todos los generos</option>
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleSearch}>Buscar</button>
            <button className="btn btn-secondary" onClick={resetSearch}>Limpiar</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{totalGames.toLocaleString()}</div>
            <div className="stat-label">Total Videojuegos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalGenres}</div>
            <div className="stat-label">Generos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{avgScore}</div>
            <div className="stat-label">Promedio Critic Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{maxSales}</div>
            <div className="stat-label">Max Ventas (M)</div>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-row">
          <div className="chart-card">
            <h3>Ventas por Genero</h3>
            {sortedGenres.length > 0 && <Doughnut data={doughnutData} options={doughnutOptions} />}
          </div>
          <div className="chart-card">
            <h3>Top 10 Juegos mas Vendidos</h3>
            {top10.length > 0 && <Bar data={barData} options={barOptions} />}
          </div>
        </div>

        {/* Table */}
        <div className="table-section" ref={tableRef}>
          <div className="table-header">
            <h2>Listado de Videojuegos</h2>
            <span className="result-count">{filteredGames.length} resultado(s) encontrado(s)</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Titulo</th>
                <th>Consola</th>
                <th>Genero</th>
                <th>Publisher</th>
                <th>Developer</th>
                <th>Critic Score</th>
                <th>Ventas (M)</th>
                <th>Ano</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-results">No se encontraron resultados</td>
                </tr>
              ) : (
                pageData.map((g) => {
                  const score = g.critic_score || 0;
                  const barWidth = ((g.total_sales || 0) / maxSalesValue) * 100;
                  return (
                    <tr key={g.id}>
                      <td>{g.id}</td>
                      <td><strong>{g.title || "N/A"}</strong></td>
                      <td>{g.console || "N/A"}</td>
                      <td>{g.genre || "N/A"}</td>
                      <td>{g.publisher || "N/A"}</td>
                      <td>{g.developer || "N/A"}</td>
                      <td><span className={`score-badge ${getScoreClass(score)}`}>{score}</span></td>
                      <td>
                        <div className="sales-bar">
                          <div className="sales-bar-fill" style={{ width: `${barWidth}%`, minWidth: "4px" }}></div>
                          <span>{(g.total_sales || 0).toFixed(2)}</span>
                        </div>
                      </td>
                      <td>{g.release_year || "N/A"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {filteredGames.length > PAGE_SIZE && (
            <div className="pagination">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Anterior</button>
              <span>Pagina {currentPage} de {totalPages}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Siguiente</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
