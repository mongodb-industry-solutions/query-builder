//useTemplates.jsx
"use client";

import { useCallback } from 'react';

export const useTemplates = (activeTemplates, setActiveTemplates, setQueryState) => {
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
  }, [setActiveTemplates, setQueryState]);

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
  }, [setActiveTemplates, setQueryState]);

  return {
    addTemplate,
    removeTemplate
  };
};