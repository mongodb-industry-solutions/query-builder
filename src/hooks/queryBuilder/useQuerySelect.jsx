// useQuerySelect.jsx
"use client";

import { useCallback, useMemo } from 'react';

export const useQuerySelect = (queryState, setQueryState) => {
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
  }, [setQueryState]);

  const removeSelectNode = useCallback((index) => {
    setQueryState((prev) => ({
      ...prev,
      select: prev.select.filter((_, i) => i !== index)
    }));
  }, [setQueryState]);

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
  }, [setQueryState]);

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
  }, [setQueryState]);

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
  }, [setQueryState]);

  return {
    addSelectNode,
    removeSelectNode,
    updateSelectAlias,
    addFunction,
    addLiteral,
    getContainmentVariables
  };
};