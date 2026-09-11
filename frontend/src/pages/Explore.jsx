import { useState, useEffect } from "react";
import { supabase, getAllProjects } from "../lib/supabase";
import { Search, Loader2, Coins } from "lucide-react";

export default function Explore() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load projects from Supabase
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
      // Fallback to empty array
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="explore-page">
      <div className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <Loader2 size={32} className="spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <Coins size={48} className="icon-dim" />
          <h2>No Projects Found</h2>
          <p>Be the first to create a transparent ecosystem fund!</p>
          <a href="/create" className="btn btn-primary" style={{ marginTop: 16 }}>
            Create Project
          </a>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              {project.logo_url && (
                <img src={project.logo_url} alt={project.name} className="project-logo" />
              )}
              <h3>{project.name}</h3>
              <p className="project-desc">{project.description?.slice(0, 100)}...</p>
              <div className="project-meta">
                <span className="creator">Creator: {project.creator_address?.slice(0, 6)}...{project.creator_address?.slice(-4)}</span>
                <span className="chain">Chain: {project.chain_id}</span>
              </div>
              <a href={`/project/${project.id}`} className="btn btn-outline btn-small">
                View Details
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
