// useQueryBuilder.jsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useTemplates } from './useTemplates';
import { useQuerySelect } from './useQuerySelect';
import { useQueryFrom } from './useQueryFrom';
import { useQueryWhere } from './useQueryWhere';
import { useQueryOrderBy } from './useQueryOrderBy';
import { useQueryReturn } from './useQueryReturn';
import { useQueryValidation } from './useQueryValidation';
import { generateQueryString } from './useQueryGeneration';
import { buildNodePath, buildContainmentHierarchy } from './utils/pathUtils';
import { buildContainsClause, createUpdateLogicalOperator } from './utils/logicalOperator'; 
import { RM_TYPES } from './utils/constants';

export const useQueryBuilder = () => {
  // Core state
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
  const [useDistinct, setUseDistinct] = useState(false);

  // Compose with feature-specific hooks
  const templateOperations = useTemplates(activeTemplates, setActiveTemplates, setQueryState);
  const selectOperations = useQuerySelect(queryState, setQueryState);
  const fromOperations = useQueryFrom(queryState, setQueryState);
  const whereOperations = useQueryWhere(queryState, setQueryState);
  const orderByOperations = useQueryOrderBy(queryState, setQueryState);
  const returnOperations = useQueryReturn(queryState, setQueryState);
  const validationOperations = useQueryValidation(queryState, activeTemplates);
  const updateLogicalOperator = createUpdateLogicalOperator(setQueryState);
  const availableRMTypes = useMemo(() => RM_TYPES, []);

  // Section expansion toggle
  const toggleSection = useCallback((section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Query generation wrapper
  const generateQuery = useCallback(() => {
    return generateQueryString(queryState, activeTemplates, useDistinct);
  }, [queryState, activeTemplates, useDistinct]);

  // Return combined API
  return {
    // Core state
    activeTemplates,
    queryState,
    setQueryState,
    expandedSections,
    useDistinct,
    setUseDistinct,
    cachedTemplates,
    setCachedTemplates,
    toggleSection,
    buildNodePath,
    availableRMTypes,

    // Template operations
    ...templateOperations,

    // Select operations
    ...selectOperations,

    // From/Contains operations
    ...fromOperations,

    // Where operations
    ...whereOperations,

    // OrderBy operations
    ...orderByOperations,

    // Return options operations
    ...returnOperations,

    // Validation operations
    ...validationOperations,

    // Query generation
    generateQuery
  };
};
