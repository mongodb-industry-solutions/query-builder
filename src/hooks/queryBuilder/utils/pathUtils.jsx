"use client";

/**
 * Utility functions for handling AQL paths and containment relationships
 */

/**
 * Cleans up AQL paths by simplifying common patterns
 * @param {String} path - The AQL path to clean
 * @returns {String} - Cleaned path
 */
 export const cleanupPath = (path) => {
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
};


/**
 * Builds a node path for use in AQL queries, finding appropriate variables
 * @param {String} templateName - Template name
 * @param {Object} node - Node object from the template
 * @param {Array} containmentVariables - Array of available variables
 * @returns {String} - Properly formatted AQL path
 */
 export const buildNodePath = (templateName, node, containmentVariables) => {
  if (!node) return "";
  
  // 1. Check if this exact node has a variable in the containment hierarchy
  const exactMatch = containmentVariables?.find(item => 
    item.template === templateName && 
    (item.node.nodeId === node.nodeId || 
    (node.uniquePath && item.node.uniquePath === node.uniquePath))
  );
  
  if (exactMatch && exactMatch.alias) {
    return exactMatch.alias;
  }
  
  // 2. Look for a suitable parent node to build the path from
  const parentCandidates = containmentVariables
    ?.filter(item => item.template === templateName && item.alias)
    .sort((a, b) => {
      // Sort by specificity - we want the most specific (longest) matching path first
      const aPath = a.node.aqlPath || '';
      const bPath = b.node.aqlPath || '';
      return bPath.length - aPath.length;
    }) || [];
  
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
  
  // 3. If no parent found, build a standalone path
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
};

export const isChildPath = (potentialParentPath, childPath) => {
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
};

/**
 * Builds paths for WHERE clause
 * @param {String} templateName - Template name
 * @param {Object} node - Node object
 * @param {Array} containmentVariables - Array of available variables
 * @returns {String} - Path formatted for WHERE clause
 */
export const buildWhereNodePath = (templateName, node, containmentVariables) => {
  // WHERE paths often need to use the same format as SELECT paths
  return buildNodePath(templateName, node, containmentVariables);
};

/**
 * Builds the full containment hierarchy for the FROM clause with proper nesting
 * @param {Array} containmentNodes - Array of containment node objects
 * @returns {String} - Formatted containment hierarchy string
 */
export const buildContainmentHierarchy = (containmentNodes) => {
  if (!containmentNodes || containmentNodes.length === 0) {
    return "";
  }
  
  // Find root nodes (those with isRoot=true or without a parentIndex)
  const rootNodes = containmentNodes.filter(node => 
    node.isRoot || node.parentIndex === null || node.parentIndex === undefined
  );
  
  let hierarchy = "";
  
  // Start with EHR if it exists
  const ehrNode = rootNodes.find(node => node.node.rmType === "EHR");
  if (ehrNode) {
    hierarchy += `EHR ${ehrNode.alias || 'e'}`;
    
    // Add EHR ID predicate for specific EHR queries (not for population queries)
    if (ehrNode.ehrIdValue && ehrNode.ehrIdValue.trim() !== '') {
      hierarchy += `[ehr_id/value=${ehrNode.ehrIdValue}]`;
    }
    
    // Find root compositions (directly under EHR)
    const rootCompositions = rootNodes.filter(node => 
      node.node.rmType === "COMPOSITION" && node !== ehrNode
    );
    
    // Process each composition with its children
    rootCompositions.forEach((comp, index) => {
      const compAlias = comp.alias || '_';
      const compNodeId = comp.node.nodeId || '';
      
      // Add logical operator for multiple compositions
      if (index === 0) {
        hierarchy += "\nCONTAINS";
      } else {
        hierarchy += `\n${comp.logicalOperator || 'AND'}`;
      }
      
      // Add the composition node
      hierarchy += ` COMPOSITION ${compAlias}`;
      if (compNodeId) {
        hierarchy += `[${compNodeId}]`;
      }
      
      // Process children of this composition
      const compIndex = containmentNodes.indexOf(comp);
      const childNodes = containmentNodes.filter(node => node.parentIndex === compIndex);
      
      // Build child containment hierarchy
      if (childNodes.length > 0) {
        // Determine if we need parentheses for OR grouping
        const hasOrOperator = childNodes.some((node, idx) => 
          idx > 0 && node.logicalOperator === 'OR'
        );
        
        if (hasOrOperator) {
          hierarchy += "\n    CONTAINS (";
          
          // Process child nodes with logical operators
          childNodes.forEach((child, childIdx) => {
            const childAlias = child.alias || '_';
            const childNodeId = child.node.nodeId || '';
            
            if (childIdx > 0) {
              hierarchy += `\n    ${child.logicalOperator || 'AND'} `;
            }
            
            hierarchy += `${child.node.rmType} ${childAlias}`;
            if (childNodeId) {
              hierarchy += `[${childNodeId}]`;
            }
            
            // Process any deeper children recursively
            const childIndex = containmentNodes.indexOf(child);
            const deeperNodes = containmentNodes.filter(node => node.parentIndex === childIndex);
            
            if (deeperNodes.length > 0) {
              hierarchy += buildDeeperContainment(containmentNodes, childIndex, 3);
            }
          });
          
          hierarchy += "\n    )";
        } else {
          // No OR operators, simpler format
          childNodes.forEach((child, childIdx) => {
            const childAlias = child.alias || '_';
            const childNodeId = child.node.nodeId || '';
            
            hierarchy += `\n    CONTAINS ${child.node.rmType} ${childAlias}`;
            if (childNodeId) {
              hierarchy += `[${childNodeId}]`;
            }
            
            // Process any deeper children recursively
            const childIndex = containmentNodes.indexOf(child);
            const deeperNodes = containmentNodes.filter(node => node.parentIndex === childIndex);
            
            if (deeperNodes.length > 0) {
              hierarchy += buildDeeperContainment(containmentNodes, childIndex, 3);
            }
          });
        }
      }
    });
  } else {
    // Handle non-EHR roots (direct compositions without EHR)
    rootNodes.forEach((rootNode, index) => {
      if (index > 0) hierarchy += " AND ";
      
      hierarchy += `${rootNode.node.rmType} ${rootNode.alias || '_'}`;
      
      if (rootNode.node.nodeId) {
        hierarchy += `[${rootNode.node.nodeId}]`;
      }
      
      // Process children recursively
      const rootIndex = containmentNodes.indexOf(rootNode);
      const children = containmentNodes.filter(node => node.parentIndex === rootIndex);
      
      if (children.length > 0) {
        hierarchy += buildDeeperContainment(containmentNodes, rootIndex, 1);
      }
    });
  }
  
  return hierarchy;
};

/**
 * Helper function to recursively build deeper containment levels
 * @param {Array} containmentNodes - All containment nodes
 * @param {Number} parentIndex - Index of parent node
 * @param {Number} level - Indentation level
 * @returns {String} - Formatted containment string for this level
 */
function buildDeeperContainment(containmentNodes, parentIndex, level) {
  // Find direct children of this parent
  const children = containmentNodes.filter(node => 
    node.parentIndex === parentIndex
  );
  
  if (children.length === 0) return '';
  
  const indent = '    '.repeat(level);
  let result = '';
  
  // Determine if we need parentheses for OR grouping
  const hasOrOperator = children.some((node, idx) => 
    idx > 0 && node.logicalOperator === 'OR'
  );
  
  if (hasOrOperator) {
    result += `\n${indent}CONTAINS (`;
    
    // Process each child with its logical operator
    children.forEach((child, idx) => {
      const childAlias = child.alias || '_';
      const childNodeId = child.node.nodeId || '';
      
      if (idx > 0) {
        result += `\n${indent}${child.logicalOperator || 'AND'} `;
      }
      
      result += `${child.node.rmType} ${childAlias}`;
      if (childNodeId) {
        result += `[${childNodeId}]`;
      }
      
      // Process any deeper children recursively
      const childIndex = containmentNodes.indexOf(child);
      const deeperNodes = containmentNodes.filter(node => node.parentIndex === childIndex);
      
      if (deeperNodes.length > 0) {
        result += buildDeeperContainment(containmentNodes, childIndex, level + 1);
      }
    });
    
    result += `\n${indent})`;
  } else {
    // No OR operators, simpler format
    children.forEach((child) => {
      const childAlias = child.alias || '_';
      const childNodeId = child.node.nodeId || '';
      
      result += `\n${indent}CONTAINS ${child.node.rmType} ${childAlias}`;
      if (childNodeId) {
        result += `[${childNodeId}]`;
      }
      
      // Process any deeper children recursively
      const childIndex = containmentNodes.indexOf(child);
      const deeperNodes = containmentNodes.filter(node => node.parentIndex === childIndex);
      
      if (deeperNodes.length > 0) {
        result += buildDeeperContainment(containmentNodes, childIndex, level + 1);
      }
    });
  }
  
  return result;
}