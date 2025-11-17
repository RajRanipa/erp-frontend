// hooks/useHighlight.js
import { useEffect, useRef } from 'react';
import { removeHighlights, applyHighlights } from '@/utils/highlightDOM'; // Your functions from above

/**
 * Applies custom highlighting to a specific container element.
 * @param {string} searchTerm - The text to search for.
 */
export const useHighlight = (searchTerm) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // 1. Clean up existing highlights
    if (containerRef.current) {
      removeHighlights(containerRef.current);
    }
    
    // 2. Apply new highlights if a search term exists
    if (searchTerm && containerRef.current) {
      applyHighlights(containerRef.current, searchTerm);
    }
    
    // 3. Cleanup function to reset highlights when the component unmounts 
    // or dependencies change (searchTerm changes to empty)
    return () => {
      if (containerRef.current) {
        removeHighlights(containerRef.current);
      }
    };
  }, [searchTerm]);

  return containerRef;
};