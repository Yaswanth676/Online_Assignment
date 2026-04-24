const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/bfhl', (req, res) => {
  try {
    const data = req.body.data;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "'data' must be an array" });
    }

    const invalid_entries = [];
    const duplicate_edges_set = new Set();
    const seenEdges = new Set();
    const edges = [];
    const parentOf = {};
    const childrenOf = {};
    const nodes = new Set();

    for (const rawEntry of data) {
      if (typeof rawEntry !== 'string') {
        invalid_entries.push(String(rawEntry));
        continue;
      }
      
      const entry = rawEntry.trim();
      if (!/^[A-Z]->[A-Z]$/.test(entry)) {
        invalid_entries.push(rawEntry);
        continue;
      }

      if (seenEdges.has(entry)) {
        duplicate_edges_set.add(entry);
        continue;
      }
      seenEdges.add(entry);

      const [p, c] = entry.split('->');
      
      if (parentOf[c]) {
        // Silently discard subsequent parent edges
        continue;
      }

      parentOf[c] = p;
      if (!childrenOf[p]) childrenOf[p] = [];
      childrenOf[p].push(c);
      nodes.add(p);
      nodes.add(c);
      edges.push({ p, c });
    }

    // Build connected components
    const adjUndirected = {};
    for (const n of nodes) adjUndirected[n] = [];
    for (const { p, c } of edges) {
      adjUndirected[p].push(c);
      adjUndirected[c].push(p);
    }

    const visited = new Set();
    const components = [];
    for (const n of nodes) {
      if (!visited.has(n)) {
        const comp = [];
        const q = [n];
        visited.add(n);
        while (q.length > 0) {
          const curr = q.shift();
          comp.push(curr);
          for (const neighbor of adjUndirected[curr]) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              q.push(neighbor);
            }
          }
        }
        components.push(comp);
      }
    }

    const hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;
    let max_depth = 0;
    let largest_tree_root = null;

    function buildTree(node) {
      const obj = {};
      if (childrenOf[node]) {
        childrenOf[node].sort(); // Optional: deterministic order
        for (const child of childrenOf[node]) {
          obj[child] = buildTree(child);
        }
      }
      return obj;
    }

    function getDepth(node) {
      if (!childrenOf[node] || childrenOf[node].length === 0) return 1;
      let md = 0;
      for (const child of childrenOf[node]) {
        md = Math.max(md, getDepth(child));
      }
      return md + 1;
    }

    for (const comp of components) {
      const roots = comp.filter(n => !parentOf[n]);

      if (roots.length === 0) {
        // Cycle detected
        total_cycles++;
        comp.sort();
        const root = comp[0];
        hierarchies.push({
          root,
          tree: {},
          has_cycle: true
        });
      } else {
        // Valid tree (1 root)
        total_trees++;
        const root = roots[0];
        const treeObj = {};
        treeObj[root] = buildTree(root);
        const depth = getDepth(root);
        
        hierarchies.push({
          root,
          tree: treeObj,
          depth
        });

        if (depth > max_depth) {
          max_depth = depth;
          largest_tree_root = root;
        } else if (depth === max_depth && max_depth > 0) {
          if (!largest_tree_root || root < largest_tree_root) {
            largest_tree_root = root;
          }
        }
      }
    }

    const duplicate_edges = Array.from(duplicate_edges_set);

    res.json({
      user_id: "yaswanthkumar_29082005",
      email_id: "yaswathkumar_kuruva@srmapedu.in",
      college_roll_number: "AP23110011229",
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root
      }
    });

  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
