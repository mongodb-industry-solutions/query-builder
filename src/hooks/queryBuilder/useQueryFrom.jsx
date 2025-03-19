// useQueryFrom.jsx - Updated implementation
"use client";

import { useState, useCallback } from "react";
import { VALID_CONTAINMENT } from './utils/constants';

export const useQueryFrom = (queryState, setQueryState) => {
  const [fromError, setFromError] = useState(null);

  // Add a template to the FROM clause
  const addFromTemplate = useCallback((templateId, alias) => {
    setQueryState(prevState => {
      if (prevState.from.find(f => f.templateId === templateId)) {
        setFromError(`Template "${templateId}" already in FROM clause.`);
        return prevState;
      }

      const newFrom = { templateId: templateId, alias: alias };
      return {
        ...prevState,
        from: [...prevState.from, newFrom],
        contains: [] // Clear CONTAINS when FROM changes
      };
    });
    setFromError(null); // Reset error after successful addition
  }, [setQueryState]);

  // Remove a template from the FROM clause
  const removeFromTemplate = useCallback((templateId) => {
    setQueryState(prevState => ({
      ...prevState,
      from: prevState.from.filter(f => f.templateId !== templateId),
      contains: prevState.contains.filter(c => c.template !== templateId) // Remove associated CONTAINS
    }));
  }, [setQueryState]);

  // Add a CONTAINS clause - keeping for backward compatibility
  const addContains = useCallback((template, nodeId, rmType, archetypeId, alias, aqlPath, isRoot = false) => {
    setQueryState(prevState => {
      const templateObj = {
        template: template,
        nodeId: nodeId,
        rmType: rmType,
        archetypeId: archetypeId,
        alias: alias,
        aqlPath: aqlPath,
        isRoot: isRoot
      };

      // Check if the RM Type can be contained in the previous level
      if (prevState.contains.length > 0) {
        const lastContained = prevState.contains[prevState.contains.length - 1];
        if (!VALID_CONTAINMENT[lastContained.rmType] || !VALID_CONTAINMENT[lastContained.rmType].includes(rmType)) {
          console.error(`RM Type "${rmType}" cannot be contained in "${lastContained.rmType}".`);
          return prevState; // Don't update state if invalid
        }
      } else {
        if (prevState.from.length === 0 && rmType !== 'COMPOSITION') {
          console.error(`RM Type "${rmType}" cannot be contained if no FROM clause has been defined.`);
          return prevState;
        }
        if (prevState.from.length > 0 && rmType === 'COMPOSITION') {
          console.error(`RM Type "${rmType}" cannot be contained in this FROM clause.`);
          return prevState;
        }
        if (prevState.from.length > 0 && rmType !== 'COMPOSITION' && !VALID_CONTAINMENT['COMPOSITION'].includes(rmType)) {
          console.error(`RM Type "${rmType}" cannot be contained in COMPOSITION.`);
          return prevState;
        }
      }

      return {
        ...prevState,
        contains: [...prevState.contains, templateObj]
      };
    });
  }, [setQueryState]);

  // Remove a CONTAINS clause - keeping for backward compatibility
  const removeContains = useCallback((template, nodeId) => {
    setQueryState(prevState => ({
      ...prevState,
      contains: prevState.contains.filter(c => !(c.template === template && c.nodeId === nodeId))
    }));
  }, [setQueryState]);

  // Update an existing CONTAINS clause - keeping for backward compatibility
  const updateContains = useCallback((template, nodeId, updates) => {
    setQueryState(prevState => ({
      ...prevState,
      contains: prevState.contains.map(c => {
        if (c.template === template && c.nodeId === nodeId) {
          return { ...c, ...updates };
        }
        return c;
      })
    }));
  }, [setQueryState]);

  // Add an EHR root node (for population or specific EHR queries)
  const addEhrRoot = useCallback((ehrType, ehrIdValue) => {
    setQueryState((prev) => {
      // Check if we already have an EHR root
      const hasEhrRoot = prev.contains.some(item => item.isEhrRoot);
      
      // If population query, ensure ehrIdValue is empty
      const finalEhrIdValue = ehrType === "population" ? "" : ehrIdValue;
      
      if (hasEhrRoot) {
        // Update the existing EHR root instead of adding a new one
        return {
          ...prev,
          ehrFilterType: ehrType,
          contains: prev.contains.map(item => {
            if (item.isEhrRoot) {
              return {
                ...item,
                ehrIdValue: finalEhrIdValue
              };
            }
            return item;
          })
        };
      }

      // Add a new EHR root node
      return {
        ...prev,
        ehrFilterType: ehrType,
        contains: [
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
            ehrIdValue: finalEhrIdValue
          },
          ...prev.contains
        ]
      };
    });
  }, []);

  // Remove the EHR root node
  const removeEhrRoot = useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      contains: prev.contains.filter(item => !item.isEhrRoot)
    }));
  }, []);

  // Update the EHR ID value
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

  // Helper function to check valid containment relationships
  const isValidContainment = (parentNode, childNode) => {
    if (!parentNode || !childNode) return false;
    
    const parentType = parentNode.rmType?.toUpperCase();
    const childType = childNode.rmType?.toUpperCase();
    
    if (!parentType || !childType) return false;
    
    // Special case for EHR root (allows COMPOSITION)
    if (parentType === 'EHR') return childType === 'COMPOSITION';
    
    // Otherwise check VALID_CONTAINMENT
    return VALID_CONTAINMENT[parentType] && VALID_CONTAINMENT[parentType].includes(childType);
  };

  // Find the best parent for a node based on the OpenEHR hierarchy
  const findBestParent = useCallback((containsArray, nodeType, templateName) => {
    if (!nodeType) return null;
    
    // If node is COMPOSITION, it should be under EHR
    if (nodeType.toUpperCase() === 'COMPOSITION') {
      const ehrRoot = containsArray.findIndex(item => item.isEhrRoot);
      return ehrRoot !== -1 ? ehrRoot : null;
    }
    
    // Try to find a parent of the same template first
    for (let i = containsArray.length - 1; i >= 0; i--) {
      const item = containsArray[i];
      if (item.template === templateName && 
          VALID_CONTAINMENT[item.node.rmType?.toUpperCase()] && 
          VALID_CONTAINMENT[item.node.rmType?.toUpperCase()].includes(nodeType.toUpperCase())) {
        return i;
      }
    }
    
    // If no same-template parent, try any valid parent
    for (let i = containsArray.length - 1; i >= 0; i--) {
      const item = containsArray[i];
      if (VALID_CONTAINMENT[item.node.rmType?.toUpperCase()] && 
          VALID_CONTAINMENT[item.node.rmType?.toUpperCase()].includes(nodeType.toUpperCase())) {
        return i;
      }
    }
    
    // Fallback to EHR root
    const ehrRoot = containsArray.findIndex(item => item.isEhrRoot);
    return ehrRoot !== -1 ? ehrRoot : null;
  }, []);

  // Add a containment node with proper hierarchy management
  const addContainsNode = useCallback((templateName, node, parentIndex, containmentType = 'simple') => {
    setQueryState((prev) => {
      const uniquePath = node.aqlPath || node.nodeId || node.name || '';
      
      // Check if this exact node is already in contains array
      const existingNodeIndex = prev.contains.findIndex(item =>
        item.template === templateName &&
        ((item.node.aqlPath || item.node.nodeId || item.node.name) === uniquePath)
      );

      // If already exists, don't add again
      if (existingNodeIndex !== -1) {
        console.log("Node already exists in the hierarchy, not adding duplicate");
        return prev;
      }

      // Determine appropriate parent
      let actualParentIndex = parentIndex;

      // If EHR root is specified as parent but node is not COMPOSITION, find a better parent
      if (parentIndex !== null && prev.contains[parentIndex]?.isEhrRoot && 
          node.rmType?.toUpperCase() !== 'COMPOSITION') {
        actualParentIndex = findBestParent(prev.contains, node.rmType, templateName);
      }
      // If no valid parent found or parentIndex is null, find one
      else if (parentIndex === null || !prev.contains[parentIndex]) {
        actualParentIndex = findBestParent(prev.contains, node.rmType, templateName);
      }

      // Check valid containment relationship if there is a parent
      if (actualParentIndex !== null) {
        const parentNode = prev.contains[actualParentIndex]?.node;

        if (!isValidContainment(parentNode, node)) {
          console.warn(`Invalid containment relationship: ${parentNode?.rmType} cannot contain ${node.rmType}`);
          
          // Try to find a better parent
          actualParentIndex = findBestParent(prev.contains, node.rmType, templateName);
          
          // If still invalid, don't add
          if (actualParentIndex === null || !isValidContainment(prev.contains[actualParentIndex]?.node, node)) {
            return prev;
          }
        }
      }

      // Map containment type to actual operator
      let containmentOperator = "CONTAINS";
      if (containmentType === "not") {
        containmentOperator = "NOT CONTAINS";
      }

      // Determine logical operator
      let logicalOperator = null;
      if (actualParentIndex !== null) {
        // Look for siblings at the same level with same rmType
        const siblings = prev.contains.filter(item => 
          item.parentIndex === actualParentIndex && 
          item.node.rmType?.toUpperCase() === node.rmType?.toUpperCase()
        );
        
        if (siblings.length > 0) {
          logicalOperator = containmentType === "or" ? "OR" : "AND";
        }
      }

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
        const existingCount = prev.contains.filter(
          item => item.node.rmType === node.rmType
        ).length;
        
        alias = existingCount === 0 ? typePrefix : `${typePrefix}${existingCount + 1}`;
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
            parentIndex: actualParentIndex,
            isRoot: actualParentIndex === prev.contains.findIndex(item => item.isEhrRoot),
            containmentOperator: containmentOperator,
            logicalOperator: logicalOperator
          }
        ]
      };
    });
  }, [findBestParent, isValidContainment]);

  // Remove a node from the containment hierarchy with proper cleanup
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

  // Update a containment node's alias
  const updateContainsAlias = useCallback((index, alias) => {
    setQueryState((prev) => ({
      ...prev,
      contains: prev.contains.map((item, i) =>
        i === index ? { ...item, alias } : item
      )
    }));
  }, []);

  // Update a node's logical operator
  const updateLogicalOperator = useCallback((index, operator) => {
    setQueryState((prev) => ({
      ...prev,
      contains: prev.contains.map((item, i) =>
        i === index ? { ...item, logicalOperator: operator } : item
      )
    }));
  }, []);

  return {
    fromError,
    addFromTemplate,
    removeFromTemplate,
    addContains,
    removeContains,
    updateContains,
    addEhrRoot,
    removeEhrRoot,
    updateEhrId,
    addContainsNode,
    removeContainsNode,
    updateContainsAlias,
    updateLogicalOperator
  };
};