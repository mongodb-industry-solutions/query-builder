// src/components/queryBuilder/QueryBuilder.jsx

"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { useQueryBuilder } from '@/hooks/queryBuilder/useQueryBuilder';
import { 
  Loader2,
  Server,
  FolderTree,
  Code,
  Tag,
  Database,
  Settings
} from 'lucide-react';

// Import components
import TemplateManagement from '../components/templateManagement/TemplateManagement';
import SelectBuilder from '../components/queryBuilder/QueryInterface/SelectBuilder';
import WhereBuilder from '../components/queryBuilder/QueryInterface/WhereBuilder';
import OrderByBuilder from '../components/queryBuilder/QueryInterface/OrderByBuilder';
import ReturnOptions from '../components/queryBuilder/QueryInterface/ReturnOptions';
import QueryDisplay from '../components/queryBuilder/QueryInterface/QueryDisplay';
import TemplateSelector from '../components/queryBuilder/QueryInterface/TemplateSelector';
import FromBuilder from '../components/queryBuilder/QueryInterface/FromBuilder';
import MainMQLPanel from '../components/LabPanel/LabPanel';
import AQLQueryManagement from '../components/AQLQueryManagement/AQLQueryManagement';
import OpenEHRAnalyticsPanel from '../components/openEhrAnalytics/OpenEhrAnalyticsPanel';

// Optional: Import the API Docs component if available
let APIDocs;
try {
  APIDocs = require('../components/common/swagger-api-docs').default;
} catch (e) {
  // Create a placeholder component if the import fails
  APIDocs = () => (
    <div className="p-8 bg-slate-800 rounded-lg">
      <h2 className="text-xl font-semibold text-slate-200 mb-4">API Documentation</h2>
      <p className="text-slate-300 mb-4">
        This page will contain interactive API documentation and testing tools. Coming soon!
      </p>
    </div>
  );
}

const QueryBuilder = () => {
  const {
    activeTemplates,
    queryState,
    expandedSections,
    addTemplate,
    removeTemplate,
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
    addOrderByItem,
    removeOrderByItem,
    updateOrderDirection,
    updateLimit,
    updateOffset,
    toggleSection,
    addContainsNode,
    removeContainsNode,
    updateContainsAlias,
    addFromTemplate,
    removeFromTemplate,
    addContains,
    removeContains,
    updateContains,
    fromError,
    buildNodePath,
    updateLogicalOperator,
    addEhrRoot,
    removeEhrRoot,
    updateEhrId,
    generateQuery,
    validateQuery,
    cachedTemplates,
    setCachedTemplates,
    isVariableNameValid,
    validationErrors,
    availableRMTypes,
    setQueryState
  } = useQueryBuilder();

  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSectionCollapsed, setTemplateSectionCollapsed] = useState(false);
  const builderContentRef = useRef(null);
  const [validationVisible, setValidationVisible] = useState(false);
  const [fetchTried, setFetchTried] = useState(false); // Track if we've tried fetching

  // Implement the fetchTemplates function
  const fetchTemplates = useCallback(async () => {
    // Don't try to fetch if we're already loading
    if (loadingTemplates) return;

    try {
      setLoadingTemplates(true);
      const response = await fetch('/api/internal/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates. Please check your VPN connection or network.');
      }
      const data = await response.json();
      const templateMap = {};
      data.forEach(t => {
        templateMap[t.name] = {
          ...t,
          tree: t.tree || (t.webTemplate && t.webTemplate.tree)
        };
      });
      setCachedTemplates(templateMap);
    } catch (err) {
      console.error("Error in fetchTemplates:", err);
    } finally {
      setLoadingTemplates(false);
      setFetchTried(true); // Mark that we've tried fetching, regardless of outcome
    }
  }, [setCachedTemplates, loadingTemplates]);

  useEffect(() => {
    // Only fetch if we haven't tried yet and don't have any cached templates
    if (!fetchTried && Object.keys(cachedTemplates).length === 0) {
      fetchTemplates();
    }
  }, [fetchTemplates, cachedTemplates, fetchTried]);

  // Validate on query state changes
  useEffect(() => {
    validateQuery();
  }, [queryState, validateQuery]);

  // Scroll handler for collapsing template section
  useEffect(() => {
    const handleScroll = () => {
      if (builderContentRef.current) {
        const scrollTop = builderContentRef.current.scrollTop;
        // Collapse when scrolled down past a threshold
        if (scrollTop > 100 && !templateSectionCollapsed) {
          setTemplateSectionCollapsed(true);
        } else if (scrollTop < 50 && templateSectionCollapsed) {
          setTemplateSectionCollapsed(false);
        }
      }
    };

    const builderContent = builderContentRef.current;
    if (builderContent) {
      builderContent.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (builderContent) {
        builderContent.removeEventListener('scroll', handleScroll);
      }
    };
  }, [templateSectionCollapsed]);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-white text-center">
          MongoDB OpenEHR Playground
        </h1>

        <Tabs.Root defaultValue="builder" className="w-full">
          <Tabs.List className="flex border-b border-slate-700 mb-4">
            <Tabs.Trigger
              value="templates"
              className={cn(
                "px-4 py-2 -mb-px text-sm font-medium text-slate-400",
                "hover:text-slate-300 focus:outline-none",
                "data-[state=active]:text-blue-400 data-[state=active]:border-b-2",
                "data-[state=active]:border-blue-400"
              )}
            >
              <div className="flex items-center gap-2">
                <FolderTree size={16} />
                Templates
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="builder"
              className={cn(
                "px-4 py-2 -mb-px text-sm font-medium text-slate-400",
                "hover:text-slate-300 focus:outline-none",
                "data-[state=active]:text-blue-400 data-[state=active]:border-b-2",
                "data-[state=active]:border-blue-400"
              )}
            >
              <div className="flex items-center gap-2">
                <Code size={16} />
                AQL Builder
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="queryManagement"
              className={cn(
                "px-4 py-2 -mb-px text-sm font-medium text-slate-400",
                "hover:text-slate-300 focus:outline-none",
                "data-[state=active]:text-blue-400 data-[state=active]:border-b-2",
                "data-[state=active]:border-blue-400"
              )}
            >
              <div className="flex items-center gap-2">
                <Tag size={16} />
                Query Management
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="convert"
              className={cn(
                "px-4 py-2 -mb-px text-sm font-medium text-slate-400",
                "hover:text-slate-300 focus:outline-none",
                "data-[state=active]:text-blue-400 data-[state=active]:border-b-2",
                "data-[state=active]:border-blue-400"
              )}
            >
              <div className="flex items-center gap-2">
                <Database size={16} />
                The Lab: AQL to MQL
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="analytics"
              className={cn(
                "px-4 py-2 -mb-px text-sm font-medium text-slate-400",
                "hover:text-slate-300 focus:outline-none",
                "data-[state=active]:text-blue-400 data-[state=active]:border-b-2",
                "data-[state=active]:border-blue-400"
              )}
            >
              <div className="flex items-center gap-2">
                <Settings size={16} />
                OpenEHR Analytics
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="apiTesting"
              className={cn(
                "px-4 py-2 -mb-px text-sm font-medium text-slate-400",
                "hover:text-slate-300 focus:outline-none",
                "data-[state=active]:text-blue-400 data-[state=active]:border-b-2",
                "data-[state=active]:border-blue-400"
              )}
            >
              <div className="flex items-center gap-2">
                <Server size={16} />
                API Testing
              </div>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="templates" className="space-y-6">
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-slate-300" size={32} />
                <span className="ml-2 text-slate-300">Loading templates...</span>
              </div>
            ) : (
              <TemplateManagement
                templates={Object.values(cachedTemplates) || []}
                reloadTemplates={fetchTemplates}
              />
            )}
          </Tabs.Content>

          <Tabs.Content value="builder" className="h-full">
            <div className="space-y-4">
              {/* Template Selector with collapsible control */}
              <div className={`transition-all duration-300 ${templateSectionCollapsed ? 'max-h-12 overflow-hidden' : ''}`}>
                <TemplateSelector
                  activeTemplates={activeTemplates}
                  onAddTemplate={addTemplate}
                  onRemoveTemplate={removeTemplate}
                />
              </div>

              {/* Builder Content with Scrollable Area */}
              {activeTemplates.length > 0 && (
                <div
                  ref={builderContentRef}
                  className="space-y-4 overflow-y-auto pb-80 hide-scrollbar"
                  style={{ maxHeight: 'calc(100vh - 250px)' }}
                >
                  <FromBuilder
                    templates={cachedTemplates}
                    activeTemplates={activeTemplates}
                    contains={queryState.contains}
                    onAddContainsNode={addContainsNode}
                    onRemoveContainsNode={removeContainsNode}
                    onUpdateContainsAlias={updateContainsAlias}
                    updateLogicalOperator={updateLogicalOperator}
                    addEhrRoot={addEhrRoot}
                    removeEhrRoot={removeEhrRoot}
                    updateEhrId={updateEhrId}
                    buildNodePath={buildNodePath}
                    isVariableValid={isVariableNameValid}
                  />
                  <SelectBuilder
                    templates={cachedTemplates}
                    activeTemplates={activeTemplates}
                    queryParts={queryState.select}
                    onAddNode={addSelectNode}
                    onRemoveNode={removeSelectNode}
                    onUpdateAlias={updateSelectAlias}
                    isExpanded={expandedSections.select}
                    onToggleExpand={() => toggleSection('select')}
                    buildNodePath={buildNodePath}
                    containmentVariables={queryState.contains}
                    useDistinct={useDistinct}
                    setUseDistinct={setUseDistinct}
                    onAddFunction={addFunction}
                    onAddLiteral={addLiteral}
                  />
                  <WhereBuilder
                    templates={cachedTemplates}
                    activeTemplates={activeTemplates}
                    conditions={queryState.where}
                    onAddCondition={addWhereCondition}
                    onRemoveCondition={removeWhereCondition}
                    onUpdateCondition={updateWhereCondition}
                    isExpanded={expandedSections.where}
                    onToggleExpand={() => toggleSection('where')}
                    buildNodePath={buildNodePath}
                    containmentVariables={queryState.contains}
                  />
                  <OrderByBuilder
                    templates={cachedTemplates}
                    activeTemplates={activeTemplates}
                    orderByItems={queryState.orderBy}
                    onAddOrderBy={addOrderByItem}
                    onRemoveOrderBy={removeOrderByItem}
                    onUpdateDirection={updateOrderDirection}
                    isExpanded={expandedSections.orderBy}
                    onToggleExpand={() => toggleSection('orderBy')}
                    buildNodePath={buildNodePath}
                    containmentVariables={queryState.contains}
                  />
                  <ReturnOptions
                    limit={queryState.limit}
                    offset={queryState.offset}
                    onUpdateLimit={updateLimit}
                    onUpdateOffset={updateOffset}
                    isExpanded={expandedSections.returnOptions}
                    onToggleExpand={() => toggleSection('returnOptions')}
                  />
                </div>
              )}

              {/* Fixed Query Display at Bottom */}
              {activeTemplates.length > 0 && (
                <QueryDisplay query={generateQuery()} />
              )}
            </div>
          </Tabs.Content>
          <Tabs.Content value="queryManagement" className="space-y-6">
            <AQLQueryManagement />
          </Tabs.Content>

          <Tabs.Content value="convert" className="space-y-6">
            <MainMQLPanel />
          </Tabs.Content>

          <Tabs.Content value="analytics" className="space-y-6">
            <OpenEHRAnalyticsPanel />
          </Tabs.Content>
          
          <Tabs.Content value="apiTesting" className="space-y-6">
            <APIDocs />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
};

export default QueryBuilder;