"use client";

import { useState, useCallback, useMemo } from "react";

export const useQueryBuilder = () => {
  const [activeTemplates, setActiveTemplates] = useState([]);
  const [queryState, setQueryState] = useState({
    select: [],
    from: [],
    contains: [],
    where: [],
    orderBy: [],
    limit: "",
    offset: ""
  });
  const [expandedSections, setExpandedSections] = useState({
    from: true,
    select: false,
    where: false,
    orderBy: false,
    returnOptions: false,
  });
  const [cachedTemplates, setCachedTemplates] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [useDistinct, setUseDistinct] = useState(false);

  const addTemplate = useCallback((templateName) => {
    setActiveTemplates((prev) => {
      if (!prev.includes(templateName)) {
        return [...prev, templateName];
      }
      return prev;
    });
    setQueryState((prev) => ({
      ...prev,
      from: [...prev.from, templateName]
    }));
  }, []);

  const removeTemplate = useCallback((templateName) => {
    setActiveTemplates((prev) => prev.filter((t) => t !== templateName));
    setQueryState((prev) => ({
      ...prev,
      from: prev.from.filter((t) => t !== templateName),
      contains: prev.contains.filter((c) => c.template !== templateName),
      select: prev.select.filter((s) => s.template !== templateName),
      where: prev.where.filter((w) => w.template !== templateName),
      orderBy: prev.orderBy.filter((o) => o.template !== templateName)
    }));
  }, []);

  // Memoize variable names for validation
  const variableNameMap = useMemo(() => {
    const map = new Map();
    queryState.contains.forEach(item => {
      if (item.alias) {
        if (map.has(item.alias)) {
          map.set(item.alias, map.get(item.alias) + 1);
        } else {
          map.set(item.alias, 1);
        }
      }
    });
    return map;
  }, [queryState.contains]);

  // Check if a variable name is valid
  const isVariableNameValid = useCallback((name) => {
    if (!name) return false;

    // Must start with a letter and contain only letters, numbers, and underscores
    const validPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;

    // Must not be an AQL reserved word
    const reservedWords = [
      'SELECT', 'AS', 'FROM', 'CONTAINS', 'WHERE',
      'ORDER', 'BY', 'LIMIT', 'OFFSET', 'DISTINCT',
      'AND', 'OR', 'NOT', 'EXISTS', 'TOP'
    ];

    return validPattern.test(name) && !reservedWords.includes(name.toUpperCase());
  }, []);

  const isVariableReferenced = useCallback((containsItem) => {
    if (!containsItem || !containsItem.alias) return false;

    const variableName = containsItem.alias;

    // Check if variable is used in SELECT
    const usedInSelect = queryState.select.some(item => {
      if (item.type === 'variable') {
        return item.variable === variableName;
      } else if (item.type === 'path') {
        const path = buildNodePath(item.template, item.node);
        return path.startsWith(variableName);
      }
      return false;
    });

    // Check if variable is used in WHERE
    const usedInWhere = queryState.where.some(condition => {
      if (condition.type === 'exists') {
        return condition.path.startsWith(variableName);
      } else if (condition.type !== 'parameter') {
        const path = buildNodePath(condition.template, condition.node);
        return path.startsWith(variableName);
      }
      return false;
    });

    // Check if variable is used in ORDER BY
    const usedInOrderBy = queryState.orderBy.some(item => {
      const path = buildNodePath(item.template, item.node);
      return path.startsWith(variableName);
    });

    return usedInSelect || usedInWhere || usedInOrderBy;
  }, [queryState.select, queryState.where, queryState.orderBy, buildNodePath]);

  // Add the missing validateQuery function
  const validateQuery = useCallback(() => {
    const errors = {};

    // Check for duplicate variables in CONTAINS clauses
    const variableNames = new Map();
    queryState.contains.forEach((item, index) => {
      if (item.alias) {
        if (variableNames.has(item.alias)) {
          errors[`contains_${index}`] = `Duplicate variable name '${item.alias}' used in CONTAINS clause`;
        } else {
          variableNames.set(item.alias, index);
        }
      }
    });

    queryState.contains.forEach((item, index) => {
      if (item.alias && !isVariableNameValid(item.alias)) {
        errors[`contains_alias_${index}`] = `Invalid variable name '${item.alias}' - must start with a letter and contain only letters, numbers, and underscores`;
      }
    });

    // Check for missing required variables (only if referenced elsewhere)
    queryState.contains.forEach((item, index) => {
      if (!item.alias && isVariableReferenced(item)) {
        errors[`contains_required_${index}`] = `Variable name is required for this node because it's referenced in other parts of the query`;
      }
    });

    // Check for empty SELECT clause
    if (activeTemplates.length > 0 && queryState.select.length === 0) {
      errors['select_empty'] = 'SELECT clause is empty - must select at least one item';
    }

    // Check for invalid containment relationships
    queryState.contains.forEach((item, index) => {
      if (item.parentIndex !== null && item.parentIndex !== undefined) {
        const parentNode = queryState.contains[item.parentIndex]?.node;
        const childNode = item.node;

        if (parentNode && childNode) {
          const parentType = parentNode.rmType?.toUpperCase();
          const childType = childNode.rmType?.toUpperCase();

          if (!isValidContainment(parentNode, childNode)) {
            errors[`contains_invalid_${index}`] = `Invalid containment relationship: ${parentType} cannot contain ${childType} according to openEHR reference model`;
          }
        }
      }
    });

    // Check for invalid WHERE conditions
    queryState.where.forEach((condition, index) => {
      if (condition.type !== 'exists' && condition.type !== 'parameter') {
        if (!condition.operator) {
          errors[`where_${index}_operator`] = 'WHERE condition is missing an operator';
        }

        if (condition.value === '' && !['IS NULL', 'IS NOT NULL'].includes(condition.operator)) {
          errors[`where_${index}_value`] = 'WHERE condition is missing a value';
        }
      }
    });

    // Check for invalid LIMIT and OFFSET values
    if (queryState.limit && !/^\d+$/.test(queryState.limit)) {
      errors['limit'] = 'LIMIT must be a positive integer';
    }

    if (queryState.offset && !/^\d+$/.test(queryState.offset)) {
      errors['offset'] = 'OFFSET must be a positive integer';
    }

    // Special check for missing variable when referenced in path
    queryState.select.forEach((item, index) => {
      if (item.type === 'path') {
        const path = buildNodePath(item.template, item.node);
        const variablePart = path.split('/')[0];

        // If path starts with a variable name
        if (variablePart && !path.startsWith('/')) {
          // Check if this variable exists in contains
          const variableExists = queryState.contains.some(
            containsItem => containsItem.alias === variablePart
          );

          if (!variableExists) {
            errors[`select_${index}_missing_variable`] = `Path '${path}' references undefined variable '${variablePart}'`;
          }
        }
      }
    });

    // Similar checks for WHERE and ORDER BY clauses that reference variables
    queryState.where.forEach((condition, index) => {
      if (condition.type !== 'exists' && condition.type !== 'parameter') {
        const path = buildNodePath(condition.template, condition.node);
        const variablePart = path.split('/')[0];

        if (variablePart && !path.startsWith('/')) {
          const variableExists = queryState.contains.some(
            containsItem => containsItem.alias === variablePart
          );

          if (!variableExists) {
            errors[`where_${index}_missing_variable`] = `Path '${path}' references undefined variable '${variablePart}'`;
          }
        }
      }
    });

    queryState.orderBy.forEach((item, index) => {
      const path = buildNodePath(item.template, item.node);
      const variablePart = path.split('/')[0];

      if (variablePart && !path.startsWith('/')) {
        const variableExists = queryState.contains.some(
          containsItem => containsItem.alias === variablePart
        );

        if (!variableExists) {
          errors[`orderBy_${index}_missing_variable`] = `Path '${path}' references undefined variable '${variablePart}'`;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [activeTemplates, queryState, isVariableNameValid, isVariableReferenced, buildNodePath]);

  // Enhanced containment validation based on openEHR reference model
  const VALID_CONTAINMENT = {
    "EHR": ["COMPOSITION"],
    "COMPOSITION": ["SECTION", "OBSERVATION", "EVALUATION", "INSTRUCTION", "ACTION", "ADMIN_ENTRY"],
    "SECTION": ["SECTION", "OBSERVATION", "EVALUATION", "INSTRUCTION", "ACTION", "ADMIN_ENTRY"],
    "OBSERVATION": ["CLUSTER"],
    "EVALUATION": ["CLUSTER"],
    "INSTRUCTION": ["CLUSTER"],
    "ACTION": ["CLUSTER"],
    "ADMIN_ENTRY": ["CLUSTER"],
    "CLUSTER": ["CLUSTER"]
  }

  // Function to check if a parent can contain a child according to the reference model
  const isValidContainment = (parentNode, childNode) => {
    if (!parentNode || !childNode) return false;

    const parentType = parentNode.rmType?.toUpperCase();
    const childType = childNode.rmType?.toUpperCase();

    if (!parentType || !childType) return false;

    // Special case for EHR root (allows any root level archetype)
    if (parentType === 'EHR') return true;

    // Check if parent can contain this child type
    return VALID_CONTAINMENT[parentType] && VALID_CONTAINMENT[parentType].includes(childType);
  };

  // Improved version of addContainsNode with containment validation
  const addContainsNode = useCallback((templateName, node, parentIndex, containmentType = 'simple') => {
    setQueryState((prev) => {
      const uniquePath = node.aqlPath || node.nodeId || node.name || '';
      // Check if this exact node is already in contains array
      const existingNodeIndex = prev.contains.findIndex(item =>
        item.template === templateName &&
        ((item.node.aqlPath || item.node.nodeId || item.node.name) === uniquePath)
      );



        // Validate containment relationship
        if (!isValidContainment(parentNode, node)) {
          console.warn(`Invalid containment relationship: ${parentNode?.rmType} cannot contain ${node.rmType}`);
          // Return unchanged state - this prevents invalid containment
          return prev;
        }
      }

      // Map containment type to actual operator
      let containmentOperator = "CONTAINS";
      if (containmentType === "not") {
        containmentOperator = "NOT CONTAINS";
      }
      // AND/OR will be handled at the logical group level

      // Create appropriate alias - now optional unless used elsewhere in the query
      let alias = '';

      // Suggest a default alias based on node type
      if (node.rmType === 'COMPOSITION') {
        const existingCompositions = prev.contains.filter(
          item => item.node.rmType === 'COMPOSITION'
        ).length;

        alias = existingCompositions === 0 ? 'c' : `c${existingCompositions + 1}`;
      } else if (node.rmType === 'CLUSTER') {
        const existingClusters = prev.contains.filter(
          item => item.node.rmType === 'CLUSTER'
        ).length;

        alias = `clu${existingClusters || ''}`;
      } else if (node.rmType) {
        // For other types, use the first three letters
        const typePrefix = node.rmType.substring(0, 3).toLowerCase();
        alias = `${typePrefix}${prev.contains.length + 1}`;
      }

      // Add the node to the contains array
      return {
        ...prev,
        contains: [
          ...prev.contains,
          {
            template: templateName,
            node: {
              ...node,
              uniquePath: uniquePath
            },
            alias,
            parentIndex: parentIndex === null ? null : parentIndex,
            isRoot: parentIndex === null,
            containmentOperator: containmentOperator,
            logicalOperator: containmentType === "and" ? "AND" :
              containmentType === "or" ? "OR" : null
          }
        ]
      };
    });
  }, []);

  const removeContainsNode = useCallback((index) => {
    setQueryState((prev) => {
      // First get the node to be removed
      const nodeToRemove = prev.contains[index];

      // Special handling for EHR root
      if (nodeToRemove.isEhrRoot) {
        // Simply filter out the EHR root
        return {
          ...prev,
          contains: prev.contains.filter((_, i) => i !== index)
        };
      }

      // We need to recursively remove all children of this node
      const nodesToRemove = new Set([index]);

      // Helper function to find all descendants
      const findDescendants = (parentIdx) => {
        prev.contains.forEach((node, idx) => {
          if (node.parentIndex === parentIdx) {
            nodesToRemove.add(idx);
            findDescendants(idx);
          }
        });
      };

      // Find all descendants
      findDescendants(index);

      // Filter out the nodes to remove
      const newContains = prev.contains.filter((_, i) => !nodesToRemove.has(i));

      // Update parentIndex references since indexes will change
      const indexMap = {};
      prev.contains.forEach((_, i) => {
        if (!nodesToRemove.has(i)) {
          // Calculate new index
          const newIndex = prev.contains.slice(0, i).filter((_, j) => !nodesToRemove.has(j)).length;
          indexMap[i] = newIndex;
        }
      });

      // Update parent references
      const updatedContains = newContains.map(node => {
        if (node.parentIndex !== null && node.parentIndex !== undefined) {
          // If parent was removed, this becomes a root node
          if (nodesToRemove.has(node.parentIndex)) {
            return { ...node, parentIndex: null, isRoot: true };
          }
          // Otherwise, update the index
          return { ...node, parentIndex: indexMap[node.parentIndex] };
        }
        return node;
      });

      return {
        ...prev,
        contains: updatedContains
      };
    });
  }, []);

  const updateContainsAlias = useCallback((index, alias) => {
    setQueryState((prev) => ({
      ...prev,
      contains: prev.contains.map((item, i) =>
        i === index ? { ...item, alias } : item
      )
    }));
  }, []);

  const addEhrRoot = useCallback((ehrType, ehrIdValue) => {
    setQueryState((prev) => {
      // Check if we already have an EHR root
      const hasEhrRoot = prev.contains.some(item => item.isEhrRoot);
      if (hasEhrRoot) return prev;

      return {
        ...prev,
        ehrFilterType: ehrType,
        contains: [
          ...prev.contains,
          {
            template: "EHR",
            node: {
              name: "EHR",
              rmType: "EHR",
              nodeId: "", // EHR doesn't have a nodeId
              aqlPath: ""
            },
            alias: "e",
            isRoot: true,
            isEhrRoot: true,
            ehrIdValue: ehrIdValue
          }
        ]
      };
    });
  }, []);

  const removeEhrRoot = useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      contains: prev.contains.filter(item => !item.isEhrRoot)
    }));
  }, []);

  const updateEhrId = useCallback((newIdValue) => {
    setQueryState((prev) => ({
      ...prev,
      contains: prev.contains.map(item => {
        // If this item is the EHR root, update its ehrIdValue
        if (item.isEhrRoot) {
          return {
            ...item,
            ehrIdValue: newIdValue
          };
        }
        return item;
      })
    }));
  }, []);

  const buildNodePath = useCallback((templateName, node) => {
    // Check if node has a proper aqlPath
    const hasValidAqlPath = node.aqlPath !== undefined && node.aqlPath !== null && node.aqlPath !== '';

    // Function to clean up paths - removes name/localizedName portions
    const cleanupPath = (path) => {
      // Replace patterns like [nodeId,'Name'] with just [nodeId]
      return path.replace(/\[([^,\]]+),'[^']*'\]/g, '[$1]');
    };

    // First try to find an exact match for this node in the contains array
    const exactMatch = queryState.contains.find(item =>
      item.template === templateName &&
      item.node.nodeId === node.nodeId &&
      item.alias
    );

    if (exactMatch) {
      // If node has a valid aqlPath, use that with the alias
      if (hasValidAqlPath) {
        // Remove any leading slash to prevent double slashes
        const cleanPath = node.aqlPath.startsWith('/') ? node.aqlPath.substring(1) : node.aqlPath;
        // Remove any name portions from the path
        return cleanupPath(`${exactMatch.alias}/${cleanPath}`);
      }
      // Otherwise just use the alias with node nodeId if available
      return exactMatch.alias + (node.nodeId ? `[${node.nodeId}]` : `/${node.name}`);
    }

    // If no exact match, find the most specific container
    let bestContainer = null;
    let longestMatch = 0;

    for (const container of queryState.contains) {
      if (container.template !== templateName || !container.alias) continue;

      // Check if container has a path and node has a path
      const containerPath = container.node.aqlPath || '';
      const nodePath = node.aqlPath || '';

      if (containerPath && nodePath && nodePath.startsWith(containerPath) && containerPath.length > longestMatch) {
        bestContainer = container;
        longestMatch = containerPath.length;
      }
    }

    if (bestContainer) {
      const containerPath = bestContainer.node.aqlPath || '';
      const nodePath = node.aqlPath || '';

      // Extract the relative path after the container path
      let relativePath = nodePath.substring(containerPath.length);

      // If relative path starts with a slash, remove it
      relativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;

      return cleanupPath(`${bestContainer.alias}/${relativePath}`);
    }

    // Find a root archetype for this template
    const rootArchetype = queryState.contains.find(item =>
      item.template === templateName && item.isRoot && item.alias
    );

    if (rootArchetype) {
      if (hasValidAqlPath) {
        const cleanPath = node.aqlPath.startsWith('/') ? node.aqlPath.substring(1) : node.aqlPath;
        return cleanupPath(`${rootArchetype.alias}/${cleanPath}`);
      }
      return rootArchetype.alias + (node.nodeId ? `[${node.nodeId}]` : `/${node.name}`);
    }

    // Fallback to simple path with nodeId if available
    if (node.nodeId && hasValidAqlPath) {
      const cleanPath = node.aqlPath.startsWith('/') ? node.aqlPath.substring(1) : node.aqlPath;
      return cleanupPath(`${templateName}/${cleanPath}`);
    }

    return node.nodeId ?
      `${templateName}[${node.nodeId}]` :
      `${templateName}/${node.name}`;
  }, [queryState.contains]);

  // SELECT operations 

  const addFunction = useCallback((functionConfig) => {
    const defaultAlias = functionConfig.functionType ?
      `${functionConfig.functionType.toLowerCase()}Result` : "";

    setQueryState((prev) => ({
      ...prev,
      select: [...prev.select, {
        type: 'function',
        functionType: functionConfig.functionType,
        argument: functionConfig.argument,
        alias: functionConfig.alias || defaultAlias
      }]
    }));
  }, []);

  const addLiteral = useCallback((literalConfig) => {
    setQueryState((prev) => ({
      ...prev,
      select: [...prev.select, {
        type: 'literal',
        literalType: literalConfig.literalType,
        value: literalConfig.value,
        alias: literalConfig.alias || ""
      }]
    }));
  }, []);


  const addSelectNode = useCallback((templateName, node, variableName = null) => {
    setQueryState((prev) => {
      if (variableName) {
        // Adding a variable reference
        return {
          ...prev,
          select: [...prev.select, {
            type: 'variable',
            variable: variableName,
            alias: ""
          }]
        };
      } else {
        // Adding a path
        return {
          ...prev,
          select: [...prev.select, {
            template: templateName,
            node,
            alias: "",
            type: 'path'
          }]
        };
      }
    });
  }, []);


  const removeSelectNode = useCallback((index) => {
    setQueryState((prev) => ({
      ...prev,
      select: prev.select.filter((_, i) => i !== index)
    }));
  }, []);

  const getContainmentVariables = useMemo(() => {
    return queryState.contains.map(item => ({
      alias: item.alias,
      rmType: item.node.rmType,
      template: item.template,
      nodeId: item.node.nodeId
    })).filter(item => item.alias); // Only include items with defined aliases
  }, [queryState.contains]);

  const updateSelectAlias = useCallback((index, alias) => {
    setQueryState((prev) => ({
      ...prev,
      select: prev.select.map((item, i) =>
        i === index ? { ...item, alias } : item
      )
    }));
  }, []);

  // WHERE operations
  const addWhereCondition = useCallback((templateName, node, specialConfig = null) => {
    setQueryState((prev) => {
      if (specialConfig) {
        // Adding EXISTS or parameter
        if (specialConfig.type === 'exists') {
          return {
            ...prev,
            where: [
              ...prev.where,
              {
                type: 'exists',
                path: specialConfig.path,
                not: specialConfig.not || false,
                groupId: prev.whereGroupActive ? prev.activeGroupId : null,
                groupLogic: prev.whereGroupActive ? prev.activeGroupLogic : null
              }
            ]
          };
        } else if (specialConfig.type === 'parameter') {
          return {
            ...prev,
            where: [
              ...prev.where,
              {
                type: 'parameter',
                name: specialConfig.name,
                groupId: prev.whereGroupActive ? prev.activeGroupId : null,
                groupLogic: prev.whereGroupActive ? prev.activeGroupLogic : null
              }
            ]
          };
        }
      }

      // Standard condition
      return {
        ...prev,
        where: [
          ...prev.where,
          {
            template: templateName,
            node,
            operator: "=",
            value: "",
            groupId: prev.whereGroupActive ? prev.activeGroupId : null,
            groupLogic: prev.whereGroupActive ? prev.activeGroupLogic : null
          }
        ]
      };
    });
  }, []);

  const removeWhereCondition = useCallback((index) => {
    setQueryState((prev) => ({
      ...prev,
      where: prev.where.filter((_, i) => i !== index)
    }));
  }, []);

  const updateWhereCondition = useCallback((index, updates) => {
    setQueryState((prev) => ({
      ...prev,
      where: prev.where.map((condition, i) =>
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  }, []);

  const addGroup = useCallback((logic) => {
    // Generate a unique group ID
    const groupId = `group_${Date.now()}`;

    setQueryState((prev) => ({
      ...prev,
      whereGroupActive: true,
      activeGroupId: groupId,
      activeGroupLogic: logic
    }));
  }, []);

  const removeGroup = useCallback((groupId) => {
    setQueryState((prev) => {
      // Remove all conditions in the group
      const newConditions = prev.where.filter(condition => condition.groupId !== groupId);

      // If this was the active group, clear the active group
      const newState = {
        ...prev,
        where: newConditions
      };

      if (prev.activeGroupId === groupId) {
        newState.whereGroupActive = false;
        newState.activeGroupId = null;
        newState.activeGroupLogic = null;
      }

      return newState;
    });
  }, []);

  // For updating a logical group
  const updateGroup = useCallback((groupId, updates) => {
    setQueryState((prev) => {
      // Update all conditions in the group
      const newConditions = prev.where.map(condition =>
        condition.groupId === groupId
          ? { ...condition, groupLogic: updates.logic }
          : condition
      );

      return {
        ...prev,
        where: newConditions
      };
    });
  }, []);

  // ORDER BY operations (unchanged)
  const addOrderByItem = useCallback((templateName, node) => {
    setQueryState((prev) => ({
      ...prev,
      orderBy: [
        ...prev.orderBy,
        { template: templateName, node, direction: "ASC" }
      ]
    }));
  }, []);

  const removeOrderByItem = useCallback((index) => {
    setQueryState((prev) => ({
      ...prev,
      orderBy: prev.orderBy.filter((_, i) => i !== index)
    }));
  }, []);

  const updateOrderDirection = useCallback((index, direction) => {
    setQueryState((prev) => ({
      ...prev,
      orderBy: prev.orderBy.map((item, i) =>
        i === index ? { ...item, direction } : item
      )
    }));
  }, []);

  // Return options (unchanged)
  const updateLimit = useCallback((limit) => {
    setQueryState((prev) => ({ ...prev, limit }));
  }, []);

  const updateOffset = useCallback((offset) => {
    setQueryState((prev) => ({ ...prev, offset }));
  }, []);

  // Section expansion 
  const toggleSection = useCallback((section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const buildContainsClause = useCallback((parentIndex, indent = 1) => {
    // Find children that share this parent
    const children = queryState.contains.filter(item =>
      item.parentIndex === parentIndex
    );

    if (children.length === 0) return '';

    // Determine if we need parentheses for logical grouping
    const hasLogicalOps = children.some(child => child.logicalOperator === 'AND' || child.logicalOperator === 'OR');
    const hasOrOps = children.some(child => child.logicalOperator === 'OR');
    const needsGrouping = children.length > 1 && hasLogicalOps;

    let result = '';
    const indentation = '    '.repeat(indent);

    // Open parentheses if needed for logical grouping
    if (needsGrouping) {
      result += `\n${indentation}(`;
    } else {
      result += `\n${indentation}`;
    }

    // Build each child's containment clause
    children.forEach((child, idx) => {
      const alias = child.alias || '_'; // Use underscore as placeholder if no alias
      const nodeId = child.node.nodeId || '';
      const archetype = nodeId || child.template;

      // Handle logical operators between siblings
      if (idx > 0) {
        // Get the logical operator for this child or default
        // Use the previous child's logical operator if it exists, otherwise default to AND
        const prevChildLogicalOp = children[idx - 1].logicalOperator;
        const logicalOp = prevChildLogicalOp || 'AND';

        result += `\n${indentation}${logicalOp} `;
      }

      // Determine containment operator
      const containmentOp = child.containmentOperator || 'CONTAINS';

      // Build the actual clause
      if (nodeId) {
        result += `${containmentOp} ${child.node.rmType} ${alias}[${nodeId}]`;
      } else {
        result += `${containmentOp} ${child.template} ${alias}`;
      }

      // Recursively handle children of this node
      const childIndex = queryState.contains.indexOf(child);
      const nestedClauses = buildContainsClause(childIndex, indent + 1);
      result += nestedClauses;
    });

    // Close parentheses if we opened them
    if (needsGrouping) {
      result += `\n${indentation})`;
    }

    return result;
  }, [queryState.contains]);

  const generateQuery = useCallback(() => {
    if (!activeTemplates.length) {
      return '';
    }

    const parts = [];

    // SELECT
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
          const path = buildNodePath(item.template, item.node);

          // Additional cleanup to handle any paths that might still have name references
          const cleanPath = path.replace(/\[([^,\]]+),'[^']*'\]/g, '[$1]');

          return item.alias ? `${cleanPath} AS ${item.alias}` : cleanPath;
        }
      });

      parts.push(`${selectClause}\n    ${selectItems.join(",\n    ")}`);
    } else {
      // If no select items, still add a basic SELECT
      parts.push("SELECT");
    }

    // FROM with CONTAINS
    if (queryState.contains.length > 0) {
      // Determine if we're using a specific EHR or population query
      const isSpecificEhr = queryState.ehrFilterType === "specific";
      const ehrRoot = queryState.contains.find(item => item.isEhrRoot === true);

      if (ehrRoot) {
        // Start with "FROM EHR e" (e is the default alias for EHR)
        let fromClause = `FROM EHR ${ehrRoot.alias || 'e'}`;

        // Add EHR ID predicate only if specified and it's a specific EHR query
        if (isSpecificEhr && ehrRoot.ehrIdValue && ehrRoot.ehrIdValue.trim() !== "") {
          fromClause += ` [ehr_id/value=${ehrRoot.ehrIdValue}]`;
        }

        // Find root compositions (directly under EHR)
        const rootCompositions = queryState.contains.filter(
          item => item.isRoot && !item.isEhrRoot
        );

        if (rootCompositions.length > 0) {
          fromClause += rootCompositions.map(comp => {
            // Alias is optional - use underscore placeholder if not defined
            const alias = comp.alias || '_';
            const nodeId = comp.node.nodeId || '';

            let containsClause = nodeId ?
              `\n    CONTAINS ${comp.node.rmType} ${alias}[${nodeId}]` :
              `\n    CONTAINS ${comp.template} ${alias}`;

            // Build nested contains clauses
            const compIndex = queryState.contains.indexOf(comp);
            const childrenClauses = buildContainsClause(compIndex, 2);
            containsClause += childrenClauses;

            return containsClause;
          }).join('');
        }

        parts.push(fromClause);
      } else {
        // Population query - find all root archetypes
        const rootArchetypes = queryState.contains.filter(item => item.isRoot);

        if (rootArchetypes.length === 0) {
          // Fallback if no explicit roots
          parts.push(`FROM ${activeTemplates[0]}`);
        } else {
          // Handle multiple root compositions
          const fromClauses = rootArchetypes.map(rootArch => {
            const rootAlias = rootArch.alias || '_';
            const rootNodeId = rootArch.node.nodeId || '';
            let fromClause = '';

            if (rootNodeId) {
              fromClause = `${rootArch.node.rmType} ${rootAlias}[${rootNodeId}]`;
            } else {
              fromClause = `${rootArch.template} ${rootAlias}`;
            }

            const rootIndex = queryState.contains.indexOf(rootArch);
            fromClause += buildContainsClause(rootIndex);
            return fromClause;
          });

          if (fromClauses.length > 1) {
            parts.push(`FROM ${fromClauses.join(",\n    ")}`);
          } else {
            parts.push(`FROM ${fromClauses[0]}`);
          }
        }
      }
    } else if (activeTemplates.length > 0) {
      // No explicit containment, just use the first template
      parts.push(`FROM ${activeTemplates[0]}`);
    }

    // WHERE
    if (queryState.where.length > 0) {
      const buildConditionString = (condition) => {
        if (condition.type === 'exists') {
          return `${condition.not ? 'NOT ' : ''}EXISTS ${condition.path}`;
        } else if (condition.type === 'parameter') {
          return condition.name;
        } else {
          const path = buildNodePath(condition.template, condition.node);
          return `${path} ${condition.operator} ${condition.value}`;
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

      // Combine with AND if there are multiple conditions/groups
      if (whereParts.length > 0) {
        parts.push(`WHERE ${whereParts.join(" AND\n    ")}`);
      }
    }

    // ORDER BY
    if (queryState.orderBy.length > 0) {
      const orderItems = queryState.orderBy.map(item => {
        const path = buildNodePath(item.template, item.node);

        // Use archetype node ID if available
        const nodeName = item.node.nodeId ?
          `[${item.node.nodeId}]` :
          `'${item.node.name}'`;

        // Build correct path with archetype node ID
        const pathWithArchetype = path.includes(nodeName) ?
          path :
          path.replace(/\/([^\/\[]+)$/, `/${nodeName}`);

        return `${pathWithArchetype} ${item.direction}`;
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
  }, [activeTemplates, queryState, buildNodePath, useDistinct, buildContainsClause]);

  return {
    activeTemplates,
    queryState,
    expandedSections,
    addTemplate,
    removeTemplate,
    addContainsNode,
    removeContainsNode,
    updateContainsAlias,
    buildNodePath,
    updateLogicalOperator,
    addEhrRoot,
    removeEhrRoot,
    updateEhrId,
    addSelectNode,
    removeSelectNode,
    updateSelectAlias,
    useDistinct,
    setUseDistinct,
    addFunction,
    addLiteral,
    addWhereCondition,
    removeWhereCondition,
    updateWhereCondition,
    addGroup,
    removeGroup,
    updateGroup,
    addOrderByItem,
    removeOrderByItem,
    updateOrderDirection,
    updateLimit,
    updateOffset,
    toggleSection,
    generateQuery,
    validateQuery,
    cachedTemplates,
    setCachedTemplates,
    isVariableNameValid,
    validationErrors,
    buildContainsClause
  };
};