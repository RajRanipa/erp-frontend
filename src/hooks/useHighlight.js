// hooks/useHighlight.js
import { useEffect, useRef } from 'react';
import { removeHighlights, applyHighlights } from '@/utils/highlightDOM'; // Your functions from above

/**
 * Applies custom highlighting to a specific container element.
 * @param {string} searchTerm - The text to search for.
 */
export const useHighlight = (searchTerm, ClassName) => {
  const containerRef = useRef(null);
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      removeHighlights(container, ClassName);
    }

    if (searchTerm && container) {
      applyHighlights(container, searchTerm, ClassName);
    }

    return () => {
      if (container) removeHighlights(container, ClassName);
    };
  }, [searchTerm, ClassName]);

  return containerRef;
};
