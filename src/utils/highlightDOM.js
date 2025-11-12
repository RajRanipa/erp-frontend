// utils/highlightDOM.js

/**
 * Removes any existing highlights (spans with the class 'highlight').
 * @param {HTMLElement} root - The root element to clean up.
 */
export const removeHighlights = (root) => {
  root.querySelectorAll('span.highlight').forEach(span => {
    // Replace the span with its inner text
    const parent = span.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(span.innerText), span);
      parent.normalize(); // Merges adjacent text nodes
    }
  });
};

/**
 * Finds and wraps text nodes inside the root element.
 * Handles both regular text and input/textarea values.
 */
export const applyHighlights = (root, searchTerm) => {
  if (!root || !searchTerm) return;
  searchTerm = searchTerm.toLowerCase();
  // console.log("searchTerm", searchTerm)
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  
  // Use a TreeWalker to efficiently traverse all text nodes
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  const nodesToProcess = [];

  // Collect nodes first to avoid modifying the DOM while traversing
  while ((node = walker.nextNode())) {
    // 💡 Skip nodes inside scripts, styles, or our own highlight spans
    if (node.parentElement.closest('.highlight')) continue;

    // 💡 Skip nodes inside input/textarea for now (handle separately)
    if (node.parentElement.tagName === 'INPUT' || node.parentElement.tagName === 'TEXTAREA') continue;
    
    nodesToProcess.push(node);
  }

  // --- Process Regular Text Nodes ---
  nodesToProcess.forEach(textNode => {
    const parent = textNode.parentNode;
    const text = textNode.nodeValue;
    // console.log("regex", regex, "text", text)
    if (text.match(regex)) {
      const fragment = document.createDocumentFragment();
      text.split(regex).forEach((part, index) => {
        if (part.match(regex)) {
          const span = document.createElement('span');
          span.className = 'highlight';
          span.textContent = part;
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      // Replace the original text node with the fragment containing spans
      parent.replaceChild(fragment, textNode);
    }
  });
};