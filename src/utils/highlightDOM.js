// utils/highlightDOM.js

/**
 * Removes any existing highlights (spans with the class 'highlight').
 * @param {HTMLElement} root - The root element to clean up.
 */
export const removeHighlights = (root, className = 'highlight') => {
  root.querySelectorAll(`span.${className}`).forEach(span => {
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
export const applyHighlights_old = (root, searchTerm, className = 'highlight') => {
  if (!root || !searchTerm) return;
  searchTerm = searchTerm.toLowerCase().split(' ').filter(Boolean).join('|');
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  // console.log("searchTerm", searchTerm)
  // console.log("regex new", regex)
  
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
    if (node.parentElement.closest(`.${className}`)) continue;

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
          span.className = `${className}`;
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

// utils/highlightDOM.js

export const applyHighlights = (container, searchTerm, highlightClass = 'inputHighlight') => {
  if (!searchTerm || !container) return;

  const regex = new RegExp(`(${searchTerm})`, 'gi');

  // 1. Create a TreeWalker to find all text nodes
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        // EXCEPTION LOGIC: Check if the text node's parent matches what we want to ignore
        
        // Example 1: Ignore a specific tag (e.g., <kbd> or <code>)
        if (node.parentNode.nodeName.toLowerCase() === 'kbd') {
          return NodeFilter.FILTER_REJECT; 
        }

        // Example 2: Ignore any element with a specific class (e.g., className="no-highlight")
        if (node.parentNode.closest('.no-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }

        // If it passes the checks, accept the text node for highlighting
        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false
  );

  const textNodes = [];
  let currentNode;
  
  // 2. Collect all valid text nodes
  while ((currentNode = walker.nextNode())) {
    textNodes.push(currentNode);
  }

  // 3. Apply the highlights to the collected text nodes
  textNodes.forEach((node) => {
    const text = node.nodeValue;
    if (regex.test(text)) {
      const span = document.createElement('span');
      span.innerHTML = text.replace(regex, `<mark class="${highlightClass}">$1</mark>`);
      node.parentNode.replaceChild(span, node);
    }
  });
};