const parseASTToMQL = (ast) => {
  if (!ast || !ast.select || ast.select.length === 0) {
      throw new Error("Invalid AST: No valid SELECT fields found.");
  }

  let pipeline = [];

  // 🔹 Handle projection ($project)
  const projectionStage = {};
  ast.select.forEach(({ aqlPath, alias }) => {
      if (aqlPath && alias) {
          projectionStage[alias] = convertAqlPathToMql(aqlPath);
      }
  });

  if (Object.keys(projectionStage).length > 0) {
      pipeline.push({ $project: projectionStage });
  }

  // 🔹 Handle filtering ($match)
  if (ast.where && ast.where.length > 0) {
      const matchStage = {};
      ast.where.forEach(({ path, operator, value }) => {
          if (path && operator && value) {
              matchStage[path] = { [`$${operator}`]: value };
          }
      });

      if (Object.keys(matchStage).length > 0) {
          pipeline.push({ $match: matchStage });
      }
  }

  return pipeline;

};


  // 🔹 Helper: Convert AQL paths to MongoDB format
  const convertAqlPathToMql = (aqlPath, registry) => {
    // Split the path and determine if it is a partial path that needs expansion.
    const pathSegments = aqlPath.split("/").filter(segment => segment);
    // For example, suppose the archetype id is embedded in one of the segments
    // e.g., "c/items[openEHR-EHR-CLUSTER.test_request_screen.v0]"
    // Extract the archetype id:
    const archetypeMatch = aqlPath.match(/\[([^\]]+)\]/);
    if (!archetypeMatch) {
      // Fallback conversion:
      return "$" + aqlPath.split("/").join(".");
    }
    const archetypeId = archetypeMatch[1];
    // Use the registry to expand the partial path:
    const absolutePaths = expandPartialPath(registry, archetypeId, aqlPath);
    // If there are multiple matches, you might need to generate an $or clause.
    if (absolutePaths.length === 1) {
      return "$" + absolutePaths[0].split("/").join(".");
    } else if (absolutePaths.length > 1) {
      // For example, return a structure that requires an $or over the fields.
      return { $or: absolutePaths.map(path => ({ [path.split("/").join(".")]: { $exists: true } })) };
    }
    // If nothing was found, return a fallback conversion.
    return "$" + aqlPath.split("/").join(".");
  };
  
  
  export { parseASTToMQL };