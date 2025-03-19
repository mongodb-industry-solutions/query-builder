"use client";

/**
 * Generates the final AQL query string based on the current query state
 * @param {Object} queryState - The current state of the query
 * @param {Array} activeTemplates - List of active templates
 * @param {Boolean} useDistinct - Whether to use DISTINCT in SELECT
 */
export const generateQueryString = (queryState, activeTemplates, useDistinct = false) => {
  if (!activeTemplates.length) {
    return '';
  }

  const parts = [];

  // SELECT clause
  if (queryState.select.length > 0) {
    let selectClause = "SELECT";

    // Add DISTINCT if enabled
    if (useDistinct) {
      selectClause += " DISTINCT";
    }

    const selectItems = queryState.select.map((item) => {
      if (item.type === 'function') {
        // Functions like COUNT(*) or MIN(path)
        const functionCall = item.argument
          ? `${item.functionType}(${item.argument})`
          : `${item.functionType}()`;

        return item.alias ? `${functionCall} AS ${item.alias}` : functionCall;
      } else if (item.type === 'variable') {
        // Variable references like 'o' for whole objects
        return item.alias ? `${item.variable} AS ${item.alias}` : item.variable;
      } else if (item.type === 'literal') {
        // Literal values
        return item.alias ? `${item.value} AS ${item.alias}` : item.value;
      } else {
        // Regular paths
        const path = buildNodePath(queryState, item.template, item.node);

        // Additional cleanup to handle any paths that might still have name references
        const cleanPath = cleanupPath(path);

        return item.alias ? `${cleanPath} AS ${item.alias}` : cleanPath;
      }
    });

    parts.push(`${selectClause}\n    ${selectItems.join(",\n    ")}`);
  } else {
    // If no select items, still add a basic SELECT
    parts.push("SELECT *");
  }

  // FROM with CONTAINS
  if (queryState.contains && queryState.contains.length > 0) {
    const ehrRoot = queryState.contains.find(item => item.isEhrRoot);
    
    let fromClause = "";
    if (ehrRoot) {
      // Start with EHR
      fromClause = `FROM EHR ${ehrRoot.alias || 'e'}`;
      
      // Add EHR ID for specific queries
      if (ehrRoot.ehrIdValue && ehrRoot.ehrIdValue.trim() !== "") {
        fromClause += ` [ehr_id/value=${ehrRoot.ehrIdValue}]`;
      }
      
      // Find direct children of EHR (usually compositions)
      const compositions = queryState.contains.filter(
        item => item.parentIndex === queryState.contains.indexOf(ehrRoot)
      );
      
      // Process each composition with its containment hierarchy
      compositions.forEach((comp, idx) => {
        fromClause += "\n    CONTAINS";
        fromClause += ` COMPOSITION ${comp.alias || 'c'}`;
        
        if (comp.node.nodeId) {
          fromClause += `[${comp.node.nodeId}]`;
        }
        
        // Process deeper containment
        const compIndex = queryState.contains.indexOf(comp);
        const children = queryState.contains.filter(
          item => item.parentIndex === compIndex
        );
        
        if (children.length > 0) {
          children.forEach((child, childIdx) => {
            // Add appropriate operator between siblings
            if (childIdx > 0) {
              fromClause += `\n    ${child.logicalOperator || 'AND'}`;
            } else {
              fromClause += "\n        CONTAINS";
            }
            
            fromClause += ` ${child.node.rmType} ${child.alias || '_'}`;
            
            if (child.node.nodeId) {
              fromClause += `[${child.node.nodeId}]`;
            }
            
            // Handle deeper nesting if needed
            // ... (additional code for deeper levels)
          });
        }
      });
    } else if (queryState.from.length > 0) {
      // ... handle case without EHR root ...
    }
    
    parts.push(fromClause);
  } else if (activeTemplates.length > 0) {
    // No explicit containment
    parts.push(`FROM ${activeTemplates[0]}`);
  }

  // WHERE
  if (queryState.where.length > 0) {
    const whereParts = buildWhereClause(queryState);
    if (whereParts.length > 0) {
      parts.push(`WHERE ${whereParts.join(" AND\n    ")}`);
    }
  }

  // ORDER BY
  if (queryState.orderBy.length > 0) {
    const orderItems = queryState.orderBy.map(item => {
      const path = buildNodePath(queryState, item.template, item.node);
      const cleanPath = cleanupPath(path);
      return `${cleanPath} ${item.direction}`;
    });

    parts.push(`ORDER BY ${orderItems.join(",\n    ")}`);
  }

  // LIMIT and OFFSET
  if (queryState.limit) {
    parts.push(`LIMIT ${queryState.limit}`);
  }
  if (queryState.offset) {
    parts.push(`OFFSET ${queryState.offset}`);
  }

  return parts.join("\n");
};

/**
 * Builds the FROM clause with proper CONTAINS hierarchies
 */
function buildFromClause(queryState, activeTemplates) {
  // Determine if we're using a specific EHR or population query
  const ehrRoot = queryState.contains.find(item => item.isEhrRoot === true);
  const isPopulationQuery = ehrRoot && (!ehrRoot.ehrIdValue || ehrRoot.ehrIdValue.trim() === "");
  
  // Root-level nodes (excluding EHR)
  const rootNodes = queryState.contains.filter(
    item => item.isRoot && !item.isEhrRoot
  );

  let fromClause = "";

  // Start with the EHR if it exists
  if (ehrRoot) {
    // Start with "FROM EHR e" (or using the alias for EHR)
    fromClause = `FROM EHR ${ehrRoot.alias || 'e'}`;

    // Add EHR ID predicate only if it's a specific EHR query
    if (!isPopulationQuery && ehrRoot.ehrIdValue && ehrRoot.ehrIdValue.trim() !== "") {
      fromClause += ` [ehr_id/value=${ehrRoot.ehrIdValue}]`;
    }

    // Build CONTAINS clauses for root nodes
    if (rootNodes.length > 0) {
      fromClause += buildContainmentHierarchy(queryState, rootNodes);
    }
  } else if (rootNodes.length > 0) {
    // No EHR root, use root archetypes directly in FROM
    const fromParts = rootNodes.map(node => {
      const alias = node.alias || "_";
      const nodeId = node.node.nodeId || "";
      
      // Format the archetype node with nodeId if available
      let archetype = nodeId ? 
        `${node.node.rmType} ${alias}[${nodeId}]` : 
        `${node.template} ${alias}`;
      
      // Add child containment hierarchies
      const nodeIndex = queryState.contains.indexOf(node);
      const childNodes = queryState.contains.filter(item => item.parentIndex === nodeIndex);
      
      if (childNodes.length > 0) {
        archetype += buildContainmentHierarchy(queryState, childNodes);
      }
      
      return archetype;
    });
    
    fromClause = `FROM ${fromParts.join(",\n    ")}`;
  } else if (activeTemplates.length > 0) {
    // Fallback to first template if no hierarchy defined
    fromClause = `FROM ${activeTemplates[0]}`;
  }

  return fromClause;
}

/**
 * Recursively builds the containment hierarchy for a set of nodes
 */
function buildContainmentHierarchy(queryState, nodes) {
  if (!nodes || nodes.length === 0) {
    return "";
  }

  let hierarchy = "";
  
  // Group nodes by their parent for proper indentation and grouping
  const groupedByParent = {};
  
  nodes.forEach(node => {
    const parentKey = node.parentIndex ?? 'root';
    if (!groupedByParent[parentKey]) {
      groupedByParent[parentKey] = [];
    }
    groupedByParent[parentKey].push(node);
  });
  
  // Process each group of siblings
  Object.entries(groupedByParent).forEach(([parentKey, siblings]) => {
    // For each sibling in this group
    siblings.forEach((node, idx) => {
      const nodeIndex = queryState.contains.indexOf(node);
      const alias = node.alias || "_";
      const nodeId = node.node.nodeId || "";
      
      // Start with logical operator if not the first sibling
      if (idx > 0) {
        const logicalOp = node.logicalOperator || 'AND';
        hierarchy += `\n    ${logicalOp}`;
      } else {
        hierarchy += "\n    CONTAINS";
      }
      
      // Add the node specification
      hierarchy += ` ${node.node.rmType} ${alias}`;
      if (nodeId) {
        hierarchy += `[${nodeId}]`;
      }
      
      // Find children of this node
      const childNodes = queryState.contains.filter(item => item.parentIndex === nodeIndex);
      
      // Add sub-hierarchy for children
      if (childNodes.length > 0) {
        // Add children with increased indentation
        const childHierarchy = buildChildContainment(queryState, childNodes, 2);
        hierarchy += childHierarchy;
      }
    });
  });
  
  return hierarchy;
}

/**
 * Helper function for building child containment with correct indentation
 */
function buildChildContainment(queryState, nodes, indentLevel) {
  if (!nodes || nodes.length === 0) {
    return "";
  }
  
  const indent = "    ".repeat(indentLevel);
  let hierarchy = "";
  
  // Determine if logical grouping is needed
  const usesOrOperator = nodes.some(node => node.logicalOperator === 'OR');
  const needsParentheses = nodes.length > 1 && usesOrOperator;
  
  // Open parentheses if needed
  if (needsParentheses) {
    hierarchy += `\n${indent}(`;
  }
  
  // Process each node
  nodes.forEach((node, idx) => {
    const nodeIndex = queryState.contains.indexOf(node);
    const alias = node.alias || "_";
    const nodeId = node.node.nodeId || "";
    
    // Add appropriate indentation and CONTAINS or logical operator
    if (idx === 0 && !needsParentheses) {
      hierarchy += `\n${indent}CONTAINS`;
    } else if (idx > 0) {
      const logicalOp = node.logicalOperator || 'AND';
      hierarchy += `\n${indent}${logicalOp}`;
    }
    
    // Add the node specification
    hierarchy += ` ${node.node.rmType} ${alias}`;
    if (nodeId) {
      hierarchy += `[${nodeId}]`;
    }
    
    // Find children of this node
    const childNodes = queryState.contains.filter(item => item.parentIndex === nodeIndex);
    
    // Add sub-hierarchy for children
    if (childNodes.length > 0) {
      // Add children with increased indentation
      const childHierarchy = buildChildContainment(queryState, childNodes, indentLevel + 1);
      hierarchy += childHierarchy;
    }
  });
  
  // Close parentheses if needed
  if (needsParentheses) {
    hierarchy += `\n${indent})`;
  }
  
  return hierarchy;
}

/**
 * Builds the WHERE clause
 */
function buildWhereClause(queryState) {
  const buildConditionString = (condition) => {
    if (condition.type === 'exists') {
      return `${condition.not ? 'NOT ' : ''}EXISTS ${condition.path}`;
    } else if (condition.type === 'parameter') {
      return condition.name;
    } else {
      const path = buildNodePath(queryState, condition.template, condition.node);
      const cleanPath = cleanupPath(path);
      return `${cleanPath} ${condition.operator} ${condition.value}`;
    }
  };

  // Group conditions by groupId
  const groupedConditions = {};
  const nonGroupedConditions = [];

  queryState.where.forEach(condition => {
    if (condition.groupId) {
      if (!groupedConditions[condition.groupId]) {
        groupedConditions[condition.groupId] = {
          logic: condition.groupLogic || 'AND',
          conditions: []
        };
      }
      groupedConditions[condition.groupId].conditions.push(condition);
    } else {
      nonGroupedConditions.push(condition);
    }
  });

  // Build WHERE clause parts
  let whereParts = [];

  // Add non-grouped conditions
  nonGroupedConditions.forEach(condition => {
    whereParts.push(buildConditionString(condition));
  });

  // Add grouped conditions
  Object.values(groupedConditions).forEach(group => {
    if (group.conditions.length > 0) {
      const groupConditions = group.conditions.map(buildConditionString);
      const groupString = `(${groupConditions.join(` ${group.logic} `)})`;
      whereParts.push(groupString);
    }
  });

  return whereParts;
}

/**
 * Builds a node path for use in AQL queries
 */
function buildNodePath(queryState, templateName, node) {
  if (!node) return "";
  
  // Check if this exact node has a variable in the containment hierarchy
  const exactMatch = queryState.contains.find(item => 
    item.template === templateName && 
    item.node && (item.node.nodeId === node.nodeId || 
    (node.uniquePath && item.node.uniquePath === node.uniquePath)) &&
    item.alias
  );
  
  if (exactMatch && exactMatch.alias) {
    return exactMatch.alias;
  }
  
  // Look for a suitable parent node to build the path from
  const parentCandidates = queryState.contains
    .filter(item => item.template === templateName && item.alias && item.node)
    .sort((a, b) => {
      // Sort by specificity - we want the most specific (longest) matching path first
      const aPath = a.node.aqlPath || '';
      const bPath = b.node.aqlPath || '';
      return bPath.length - aPath.length;
    });
  
  for (const parent of parentCandidates) {
    // Check if node is a child of this parent
    if (node.aqlPath && isChildPath(parent.node.aqlPath, node.aqlPath)) {
      // Get the relative path - the part after the parent path
      let relativePath = node.aqlPath;
      if (parent.node.aqlPath && relativePath.includes(parent.node.aqlPath)) {
        relativePath = relativePath.substring(relativePath.indexOf(parent.node.aqlPath) + parent.node.aqlPath.length);
        // Remove leading slash if present
        if (relativePath.startsWith('/')) {
          relativePath = relativePath.substring(1);
        }
      }
      
      return cleanupPath(`${parent.alias}/${relativePath}`);
    }
  }
  
  // If no parent found, build a standalone path
  if (node.aqlPath) {
    // If node has a complete AQL path, use it
    return cleanupPath(node.aqlPath);
  } else if (node.nodeId) {
    // Use nodeId if available - wrap in template if template exists
    return templateName ? `${templateName}[${node.nodeId}]` : node.nodeId;
  } else {
    // Fallback to name
    return templateName ? `${templateName}/${node.name}` : node.name;
  }
}

/**
 * Determines if a path is a child of another path
 */
function isChildPath(potentialParentPath, childPath) {
  if (!potentialParentPath || !childPath) return false;
  
  // Normalize paths for comparison
  const normalizedParent = potentialParentPath.endsWith('/') 
    ? potentialParentPath.slice(0, -1) 
    : potentialParentPath;
    
  const normalizedChild = childPath.startsWith('/') 
    ? childPath.substring(1) 
    : childPath;
  
  // Check if child starts with parent path
  return normalizedChild.startsWith(normalizedParent);
}

/**
 * Cleans up AQL paths by simplifying common patterns
 */
function cleanupPath(path) {
  if (!path) return '';
  
  // Replace patterns like [nodeId,'Name'] with just [nodeId]
  let cleanedPath = path.replace(/\[([^,\]]+),'[^']*'\]/g, '[$1]');
  
  // Remove any double slashes that might occur during concatenation
  cleanedPath = cleanedPath.replace(/\/\//g, '/');
  
  // Remove trailing slash if present
  if (cleanedPath.endsWith('/')) {
    cleanedPath = cleanedPath.substring(0, cleanedPath.length - 1);
  }
  
  return cleanedPath;
}