import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

const TreeNode = ({ nodeName, childrenObj }) => {
  const childKeys = Object.keys(childrenObj);

  return (
    <li>
      <div className="node-label">{nodeName}</div>
      {childKeys.length > 0 && (
        <ul>
          {childKeys.map(child => (
            <TreeNode key={child} nodeName={child} childrenObj={childrenObj[child]} />
          ))}
        </ul>
      )}
    </li>
  );
};

const App = () => {
  const [input, setInput] = useState('["A->B", "A->C", "B->D", "C->E", "E->F", "X->Y", "Y->Z", "Z->X", "P->Q", "Q->R", "G->H", "G->H", "G->I", "hello", "1->2", "A->"]');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    let parsedData = [];
    try {
      parsedData = JSON.parse(input);
      if (!Array.isArray(parsedData)) {
        throw new Error("Input must be a valid JSON array of strings.");
      }
    } catch (err) {
      setError("Invalid JSON format. Please provide a valid JSON array.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`https://online-assignment-q270.onrender.com/bfhl`, { data: parsedData });
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch from API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Hierarchy Analyzer</h1>
      </header>

      <div className="card">
        <div className="input-group">
          <label className="input-label">Enter Node Relationships (JSON Array)</label>
          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder='["A->B", "A->C", ...]'
          />
          <button className="btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Analyze Data'}
          </button>
        </div>
        {error && <div className="error-msg" style={{marginTop: '1rem'}}>{error}</div>}
      </div>

      {response && (
        <div className="card response-container">
          <div className="user-info">
            <span><strong>User:</strong> {response.user_id}</span>
            <span><strong>Email:</strong> {response.email_id}</span>
            <span><strong>Roll No:</strong> {response.college_roll_number}</span>
          </div>

          <div className="summary-grid">
            <div className="summary-item">
              <h3>Total Trees</h3>
              <p>{response.summary.total_trees}</p>
            </div>
            <div className="summary-item">
              <h3>Total Cycles</h3>
              <p>{response.summary.total_cycles}</p>
            </div>
            <div className="summary-item">
              <h3>Largest Tree Root</h3>
              <p>{response.summary.largest_tree_root || 'N/A'}</p>
            </div>
          </div>

          {response.invalid_entries?.length > 0 && (
            <div>
              <h2 className="section-title">Invalid Entries</h2>
              <div className="list-items">
                {response.invalid_entries.map((item, idx) => (
                  <span key={idx} className="list-item badge-cycle">{item}</span>
                ))}
              </div>
            </div>
          )}

          {response.duplicate_edges?.length > 0 && (
            <div>
              <h2 className="section-title">Duplicate Edges</h2>
              <div className="list-items">
                {response.duplicate_edges.map((item, idx) => (
                  <span key={idx} className="list-item badge-cycle">{item}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="section-title">Hierarchies</h2>
            {response.hierarchies.map((h, idx) => (
              <div key={idx} className="hierarchy-card">
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Root: {h.root}</strong>
                  {h.has_cycle ? (
                    <span className="badge badge-cycle">Cycle Detected</span>
                  ) : (
                    <span className="badge badge-depth">Depth: {h.depth}</span>
                  )}
                </div>
                {!h.has_cycle && (
                  <div className="tree-container">
                    <ul className="tree">
                      <TreeNode nodeName={h.root} childrenObj={h.tree[h.root] || {}} />
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {response.hierarchies.length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>No valid hierarchies found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
