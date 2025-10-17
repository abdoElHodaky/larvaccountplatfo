/**
 * Mobile-Optimized Dashboard Component
 * Provides touch-friendly interface and mobile-specific optimizations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { DashboardWidget } from '../../services/dashboardRestApi';
import { useRealTimeConnection } from '../../hooks/useRealTimeUpdates';

interface MobileDashboardProps {
  widgets: DashboardWidget[];
  onWidgetUpdate: (widgetId: number, data: any) => void;
  onAddWidget: () => void;
  onEditWidget: (widget: DashboardWidget) => void;
  onDeleteWidget: (widgetId: number) => void;
  onRefresh: () => void;
  onShare: () => void;
  onSettings: () => void;
  isLoading?: boolean;
  className?: string;
}

interface MobileWidgetProps {
  widget: DashboardWidget;
  onEdit: () => void;
  onDelete: () => void;
  isActive: boolean;
  onActivate: () => void;
}

const MobileWidget: React.FC<MobileWidgetProps> = ({
  widget,
  onEdit,
  onDelete,
  isActive,
  onActivate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSwipe = useSwipeable({
    onSwipedLeft: () => setIsExpanded(true),
    onSwipedRight: () => setIsExpanded(false),
    trackMouse: false,
    trackTouch: true,
  });

  return (
    <motion.div
      {...handleSwipe}
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        ${isActive ? 'ring-2 ring-blue-500' : ''}
        overflow-hidden
      `}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileTap={{ scale: 0.98 }}
      onTap={onActivate}
    >
      {/* Widget Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {widget.title}
            </h3>
            {widget.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                {widget.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <span className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${widget.is_active 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }
            `}>
              {widget.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-4">
        <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {widget.widget_type === 'financial_summary' && '$12,345'}
              {widget.widget_type === 'revenue_chart' && '↗ 15%'}
              {widget.widget_type === 'expense_chart' && '↘ 8%'}
              {widget.widget_type === 'cash_flow' && '$5,678'}
              {widget.widget_type === 'budget_overview' && '85%'}
              {widget.widget_type === 'kpi_metrics' && '4.2'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {widget.widget_type.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Action Panel (Swipe to reveal) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute inset-y-0 right-0 w-24 bg-gray-100 dark:bg-gray-700 flex flex-col"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setIsExpanded(false);
              }}
              className="flex-1 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsExpanded(false);
              }}
              className="flex-1 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  widgets,
  onWidgetUpdate,
  onAddWidget,
  onEditWidget,
  onDeleteWidget,
  onRefresh,
  onShare,
  onSettings,
  isLoading = false,
  className = '',
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [activeWidgetId, setActiveWidgetId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Real-time connection
  const { isConnected, isConnecting } = useRealTimeConnection({
    enabled: true,
    autoConnect: true,
  });

  // Pagination
  const widgetsPerPage = 3;
  const totalPages = Math.ceil(widgets.length / widgetsPerPage);
  const currentWidgets = useMemo(() => {
    const start = currentPage * widgetsPerPage;
    return widgets.slice(start, start + widgetsPerPage);
  }, [widgets, currentPage, widgetsPerPage]);

  // Swipe navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      }
    },
    onSwipedRight: () => {
      if (currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  // Handle widget actions
  const handleEditWidget = useCallback((widget: DashboardWidget) => {
    setActiveWidgetId(widget.id);
    onEditWidget(widget);
  }, [onEditWidget]);

  const handleDeleteWidget = useCallback((widgetId: number) => {
    onDeleteWidget(widgetId);
    setActiveWidgetId(null);
  }, [onDeleteWidget]);

  // Auto-refresh on pull down
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handlePullStart = useCallback((event: TouchEvent) => {
    if (window.scrollY === 0) {
      setIsPulling(true);
    }
  }, []);

  const handlePullMove = useCallback((event: TouchEvent) => {
    if (isPulling && window.scrollY === 0) {
      const touch = event.touches[0];
      const distance = Math.max(0, touch.clientY - 100);
      setPullDistance(Math.min(distance, 100));
    }
  }, [isPulling]);

  const handlePullEnd = useCallback(() => {
    if (isPulling && pullDistance > 50) {
      onRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [isPulling, pullDistance, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handlePullStart);
    document.addEventListener('touchmove', handlePullMove);
    document.addEventListener('touchend', handlePullEnd);

    return () => {
      document.removeEventListener('touchstart', handlePullStart);
      document.removeEventListener('touchmove', handlePullMove);
      document.removeEventListener('touchend', handlePullEnd);
    };
  }, [handlePullStart, handlePullMove, handlePullEnd]);

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isConnected ? 'Live' : isConnecting ? 'Connecting' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onShare}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pull to refresh indicator */}
        {isPulling && (
          <div 
            className="absolute top-full left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm"
            style={{ transform: `translateY(-${100 - pullDistance}%)` }}
          >
            {pullDistance > 50 ? 'Release to refresh' : 'Pull to refresh'}
          </div>
        )}
      </div>

      {/* Widget Container */}
      <div {...swipeHandlers} className="px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            {currentWidgets.map((widget) => (
              <MobileWidget
                key={widget.id}
                widget={widget}
                onEdit={() => handleEditWidget(widget)}
                onDelete={() => handleDeleteWidget(widget.id)}
                isActive={activeWidgetId === widget.id}
                onActivate={() => setActiveWidgetId(widget.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <PlusIcon className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No widgets yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Add your first widget to get started
            </p>
            <button
              onClick={onAddWidget}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Widget
            </button>
          </div>
        )}
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center space-x-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentPage 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows */}
      {totalPages > 1 && (
        <>
          {currentPage > 0 && (
            <button
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="fixed left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          
          {currentPage < totalPages - 1 && (
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="fixed right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </>
      )}

      {/* Floating Action Button */}
      <button
        onClick={onAddWidget}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 z-50 shadow-xl"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Menu
                  </h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <button
                  onClick={() => {
                    onSettings();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Cog6ToothIcon className="w-5 h-5 mr-3" />
                  Settings
                </button>
                
                <button
                  onClick={() => {
                    onShare();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <ShareIcon className="w-5 h-5 mr-3" />
                  Share Dashboard
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
