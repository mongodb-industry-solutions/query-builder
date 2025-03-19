// templateRegistry.js
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useUnifiedTopology: true });

/**
 * Recursively traverses a template tree node to record absolute paths.
 * @param {Object} node - The current node in the template tree.
 * @param {string} currentPath - The accumulated absolute path.
 * @param {Object} registry - The registry object mapping archetype IDs to an array of absolute paths.
 */
function traverseTemplate(node, currentPath, registry) {
  if (!node) return;
  // If the node has an archetype_id, record its full path.
  if (node.archetype_id) {
    if (!registry[node.archetype_id]) {
      registry[node.archetype_id] = [];
    }
    registry[node.archetype_id].push(currentPath);
  }
  // If the node has children, recursively traverse them.
  if (Array.isArray(node.children)) {
    node.children.forEach((child, index) => {
      // Use a property (like node.name) if available or fallback to index.
      const childIdentifier = child.name || child.node_id || `child${index}`;
      // Append the child identifier to the current path.
      const childPath = `${currentPath}/${childIdentifier}`;
      traverseTemplate(child, childPath, registry);
    });
  }
}

/**
 * Builds the in-memory registry by retrieving all templates from MongoDB.
 * Assumes that each template document has a field `webTemplate.tree` containing the tree.
 * @returns {Promise<Object>} A promise that resolves to the registry object.
 */
async function buildTemplateRegistry() {
  const registry = {};

  try {
    await client.connect();
    const db = client.db("hc-QueryBuilder");
    const templatesCollection = db.collection("user-templates");
    // Adjust the query if you need to filter by user, etc.
    const templates = await templatesCollection.find({}).toArray();

    templates.forEach((template) => {
      // Assume the template tree is in template.webTemplate.tree.
      const tree = template.webTemplate && template.webTemplate.tree;
      if (tree) {
        // Start the traversal at the root. Here, use the template name or a default root.
        const rootPath = template.name || "templateRoot";
        traverseTemplate(tree, rootPath, registry);
      }
    });
  } catch (error) {
    console.error("Error building template registry:", error);
  } finally {
    await client.close();
  }

  console.log("Template registry built:", JSON.stringify(registry, null, 2));
  return registry;
}

/**
 * Given an archetype ID and an optional partial path, returns all matching absolute paths.
 * If a partial path is provided, only returns those absolute paths that include the partial string.
 * @param {Object} registry - The in-memory registry of absolute paths.
 * @param {string} archetypeId - The archetype ID to search for.
 * @param {string} [partialPath] - Optional partial path filter.
 * @returns {string[]} Array of matching absolute paths.
 */
function expandPartialPath(registry, archetypeId, partialPath = "") {
  if (!registry[archetypeId]) {
    return [];
  }
  if (partialPath) {
    return registry[archetypeId].filter((absPath) =>
      absPath.includes(partialPath)
    );
  }
  return registry[archetypeId];
}

// Export functions so that your AQL-to-MQL translator can import them.
module.exports = {
  buildTemplateRegistry,
  expandPartialPath,
};