import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface VirtualizedGridConfig {
  /** Fixed width of each card in pixels (used to calculate columns unless fixedColumns is set) */
  cardWidth: number;
  /** Fixed height of each card in pixels */
  cardHeight: number;
  /** Gap between cards in pixels */
  gap: number;
  /** Total number of items to virtualize */
  totalItems: number;
  /** Number of rows to render outside visible area (default: 3) */
  overscan?: number;
  /** If set, uses this many columns and stretches cards to fill width */
  fixedColumns?: number;
}

export interface VirtualizedGridResult {
  /** Ref to attach to the scroll container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Ref to attach to the grid content container (for width measurement) */
  gridRef: React.RefObject<HTMLDivElement>;
  /** Number of columns in the grid */
  columns: number;
  /** Total height of the virtualized content */
  totalHeight: number;
  /** Array of visible items with their index and style */
  virtualItems: Array<{
    index: number;
    style: React.CSSProperties;
  }>;
  /** Scroll to a specific item index */
  scrollToIndex: (index: number) => void;
  /** Whether the grid is ready to render */
  isReady: boolean;
}

/**
 * A clean, efficient hook for virtualizing a grid of fixed-size cards.
 * Uses @tanstack/react-virtual under the hood.
 */
export function useVirtualizedGrid(
  config: VirtualizedGridConfig,
): VirtualizedGridResult {
  const {
    cardWidth: baseCardWidth,
    cardHeight,
    gap,
    totalItems,
    overscan = 3,
    fixedColumns,
  } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Track container width for responsive columns
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Reset state on mount to ensure fresh measurement
    setIsReady(false);
    setContainerWidth(0);

    let rafId: number;
    let attempts = 0;
    const maxAttempts = 30;

    const updateWidth = () => {
      const width = grid.clientWidth;
      // Only update if we have a valid width (> 100px to avoid animation artifacts)
      if (width > 100) {
        setContainerWidth(width);
        setIsReady(true);
      } else if (attempts < maxAttempts) {
        // Keep trying until we get a valid width
        attempts++;
        rafId = requestAnimationFrame(updateWidth);
      }
    };

    // Start measuring on next frame
    rafId = requestAnimationFrame(updateWidth);

    // Watch for size changes
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 100) {
        setContainerWidth(entry.contentRect.width);
        setIsReady(true);
      }
    });
    resizeObserver.observe(grid);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate columns based on container width or use fixed columns
  const columns = useMemo(() => {
    if (fixedColumns) return fixedColumns;
    if (containerWidth === 0) return 1;
    // Calculate how many cards fit with gaps
    const available = containerWidth + gap; // Add gap because last item doesn't have trailing gap
    const itemWithGap = baseCardWidth + gap;
    return Math.max(1, Math.floor(available / itemWithGap));
  }, [containerWidth, baseCardWidth, gap, fixedColumns]);

  // Calculate actual card width - stretch to fill if using fixed columns
  const cardWidth = useMemo(() => {
    if (!fixedColumns || containerWidth === 0) return baseCardWidth;
    // Calculate width to fill container: (containerWidth - totalGaps) / columns
    const totalGaps = (fixedColumns - 1) * gap;
    const availableWidth = containerWidth - totalGaps;
    // Don't floor - let cards be slightly larger to fill space
    return availableWidth / fixedColumns;
  }, [fixedColumns, containerWidth, gap, baseCardWidth]);

  // Calculate total rows
  const rowCount = useMemo(() => {
    return Math.ceil(totalItems / columns);
  }, [totalItems, columns]);

  // Row height including gap
  const rowHeight = cardHeight + gap;

  // Use TanStack's virtualizer for rows
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  // Get virtual rows from virtualizer
  const virtualRows = rowVirtualizer.getVirtualItems();

  // Convert virtual rows to individual item positions
  const virtualItems = useMemo(() => {
    // Don't render until we have a valid container width measurement
    if (containerWidth === 0) return [];

    const items: Array<{ index: number; style: React.CSSProperties }> = [];

    for (const virtualRow of virtualRows) {
      const rowIndex = virtualRow.index;
      const startItemIndex = rowIndex * columns;

      // For each column in this row
      for (let col = 0; col < columns; col++) {
        const itemIndex = startItemIndex + col;

        // Don't render items past the total
        if (itemIndex >= totalItems) break;

        items.push({
          index: itemIndex,
          style: {
            position: "absolute",
            top: virtualRow.start,
            left: col * (cardWidth + gap),
            width: cardWidth,
            height: cardHeight,
          },
        });
      }
    }

    return items;
  }, [
    virtualRows,
    columns,
    totalItems,
    cardWidth,
    cardHeight,
    gap,
    containerWidth,
  ]);

  // Scroll to a specific item
  const scrollToIndex = useCallback(
    (index: number) => {
      const rowIndex = Math.floor(index / columns);
      rowVirtualizer.scrollToIndex(rowIndex, { align: "start" });
    },
    [columns, rowVirtualizer],
  );

  return {
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    gridRef: gridRef as React.RefObject<HTMLDivElement>,
    columns,
    totalHeight: rowVirtualizer.getTotalSize(),
    virtualItems,
    scrollToIndex,
    isReady,
  };
}
