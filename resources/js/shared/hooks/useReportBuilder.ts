import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useMemoizedCallback } from '@/shared/hooks';

/**
 * Report Builder Management Hook
 * Performance-optimized state management for drag-and-drop report builder
 */

export interface ReportWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text' | 'image';
  title: string;
  config: any;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  widgets: ReportWidget[];
  settings: {
    title: string;
    description: string;
    layout: {
      cols: { lg: number; md: number; sm: number; xs: number; xxs: number };
      rowHeight: number;
      margin: [number, number];
    };
  };
}

export interface UseReportBuilderOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  maxHistory?: number;
  onSave?: (report: ReportTemplate) => Promise<void>;
  onLoad?: (reportId: string) => Promise<ReportTemplate>;
}

export interface UseReportBuilderReturn {
  // Current report state
  report: ReportTemplate | null;
  widgets: ReportWidget[];
  selectedWidget: ReportWidget | null;
  
  // Report management
  createReport: (template?: Partial<ReportTemplate>) => void;
  loadReport: (reportId: string) => Promise<void>;
  saveReport: () => Promise<void>;
  exportReport: (format: 'json' | 'pdf' | 'png') => Promise<void>;
  
  // Widget management
  addWidget: (widget: Omit<ReportWidget, 'id'>) => void;
  updateWidget: (widgetId: string, updates: Partial<ReportWidget>) => void;
  removeWidget: (widgetId: string) => void;
  selectWidget: (widget: ReportWidget | null) => void;
  updateWidgets: (widgets: ReportWidget[]) => void;
  
  // History management
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // State management
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  lastSaved: Date | null;
}

export function useReportBuilder(
  options: UseReportBuilderOptions = {}
): UseReportBuilderReturn {
  const {
    autoSave = false,
    autoSaveInterval = 30000, // 30 seconds
    maxHistory = 50,
    onSave,
    onLoad,
  } = options;

  // State
  const [report, setReport] = useState<ReportTemplate | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<ReportWidget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // History management
  const [history, setHistory] = useState<ReportTemplate[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized widgets from current report
  const widgets = useMemo(() => {
    return report?.widgets || [];
  }, [report?.widgets]);

  // Memoized history state
  const canUndo = useMemo(() => historyIndex > 0, [historyIndex]);
  const canRedo = useMemo(() => historyIndex < history.length - 1, [historyIndex, history.length]);

  // Add to history
  const addToHistory = useMemoizedCallback((newReport: ReportTemplate) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ ...newReport });
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      } else {
        setHistoryIndex(prev => prev + 1);
      }
      
      return newHistory;
    });
  }, [historyIndex, maxHistory]);

  // Update report with history tracking
  const updateReport = useMemoizedCallback((updater: (prev: ReportTemplate | null) => ReportTemplate | null) => {
    setReport(prev => {
      const newReport = updater(prev);
      
      if (newReport && prev) {
        addToHistory(prev); // Add previous state to history
        setIsDirty(true);
        
        // Schedule auto-save
        if (autoSave && onSave) {
          if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
          }
          autoSaveTimeoutRef.current = setTimeout(() => {
            onSave(newReport).catch(console.error);
          }, autoSaveInterval);
        }
      }
      
      return newReport;
    });
  }, [addToHistory, autoSave, onSave, autoSaveInterval]);

  // Create new report
  const createReport = useMemoizedCallback((template: Partial<ReportTemplate> = {}) => {
    const newReport: ReportTemplate = {
      id: template.id || `report-${Date.now()}`,
      name: template.name || 'Untitled Report',
      description: template.description || '',
      category: template.category || 'custom',
      widgets: template.widgets || [],
      settings: {
        title: template.settings?.title || 'New Report',
        description: template.settings?.description || '',
        layout: {
          cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
          rowHeight: 60,
          margin: [10, 10],
          ...template.settings?.layout,
        },
      },
    };

    setReport(newReport);
    setHistory([newReport]);
    setHistoryIndex(0);
    setSelectedWidget(null);
    setIsDirty(false);
    setError(null);
  }, []);

  // Load report
  const loadReport = useMemoizedCallback(async (reportId: string): Promise<void> => {
    if (!onLoad) {
      setError('Load function not provided');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const loadedReport = await onLoad(reportId);
      
      setReport(loadedReport);
      setHistory([loadedReport]);
      setHistoryIndex(0);
      setSelectedWidget(null);
      setIsDirty(false);
      setLastSaved(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load report';
      setError(errorMessage);
      console.error('Report load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onLoad]);

  // Save report
  const saveReport = useMemoizedCallback(async (): Promise<void> => {
    if (!report || !onSave) {
      setError('No report to save or save function not provided');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await onSave(report);
      
      setIsDirty(false);
      setLastSaved(new Date());
      
      // Clear auto-save timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save report';
      setError(errorMessage);
      console.error('Report save error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [report, onSave]);

  // Export report
  const exportReport = useMemoizedCallback(async (format: 'json' | 'pdf' | 'png'): Promise<void> => {
    if (!report) {
      setError('No report to export');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      switch (format) {
        case 'json':
          // Export as JSON
          const jsonData = JSON.stringify(report, null, 2);
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${report.name}.json`;
          a.click();
          URL.revokeObjectURL(url);
          break;
          
        case 'pdf':
        case 'png':
          // These would require additional libraries like html2canvas, jsPDF
          console.log(`Export as ${format} not implemented yet`);
          break;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMessage);
      console.error('Report export error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [report]);

  // Add widget
  const addWidget = useMemoizedCallback((widget: Omit<ReportWidget, 'id'>) => {
    const newWidget: ReportWidget = {
      ...widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    updateReport(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: [...prev.widgets, newWidget],
      };
    });
  }, [updateReport]);

  // Update widget
  const updateWidget = useMemoizedCallback((widgetId: string, updates: Partial<ReportWidget>) => {
    updateReport(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: prev.widgets.map(widget =>
          widget.id === widgetId ? { ...widget, ...updates } : widget
        ),
      };
    });
  }, [updateReport]);

  // Remove widget
  const removeWidget = useMemoizedCallback((widgetId: string) => {
    updateReport(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: prev.widgets.filter(widget => widget.id !== widgetId),
      };
    });

    // Clear selection if removed widget was selected
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null);
    }
  }, [updateReport, selectedWidget]);

  // Select widget
  const selectWidget = useMemoizedCallback((widget: ReportWidget | null) => {
    setSelectedWidget(widget);
  }, []);

  // Update widgets (for drag-and-drop layout changes)
  const updateWidgets = useMemoizedCallback((newWidgets: ReportWidget[]) => {
    updateReport(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: newWidgets,
      };
    });
  }, [updateReport]);

  // Undo
  const undo = useMemoizedCallback(() => {
    if (canUndo) {
      const prevReport = history[historyIndex - 1];
      setReport(prevReport);
      setHistoryIndex(prev => prev - 1);
      setIsDirty(true);
    }
  }, [canUndo, history, historyIndex]);

  // Redo
  const redo = useMemoizedCallback(() => {
    if (canRedo) {
      const nextReport = history[historyIndex + 1];
      setReport(nextReport);
      setHistoryIndex(prev => prev + 1);
      setIsDirty(true);
    }
  }, [canRedo, history, historyIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Current report state
    report,
    widgets,
    selectedWidget,
    
    // Report management
    createReport,
    loadReport,
    saveReport,
    exportReport,
    
    // Widget management
    addWidget,
    updateWidget,
    removeWidget,
    selectWidget,
    updateWidgets,
    
    // History management
    undo,
    redo,
    canUndo,
    canRedo,
    
    // State management
    isDirty,
    isLoading,
    error,
    lastSaved,
  };
}

export default useReportBuilder;
