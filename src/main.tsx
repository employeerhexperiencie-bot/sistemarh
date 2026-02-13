import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Patch para prevenir erro "removeChild" causado por extensões do navegador
// (ex: Google Tradutor) que modificam o DOM fora do controle do React
if (typeof Node !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      console.warn('[DOM Patch] removeChild ignorado - nó não é filho deste elemento');
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      console.warn('[DOM Patch] insertBefore ignorado - nó de referência não é filho deste elemento');
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

createRoot(document.getElementById("root")!).render(
  <App />
);
