import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initPIIStorageGuards } from './lib/piiStorage'

// Inicializa proteção de PII em armazenamento do navegador
initPIIStorageGuards();

// Patch para prevenir erro "removeChild"/"insertBefore" causado por extensões
// do navegador (ex: Google Tradutor, Grammarly) que modificam o DOM
if (typeof Node !== 'undefined') {
  const proto = Node.prototype;

  const origRemoveChild = proto.removeChild;
  proto.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      console.warn('[DOM Patch] removeChild ignorado');
      return child;
    }
    return origRemoveChild.call(this, child) as T;
  };

  const origInsertBefore = proto.insertBefore;
  proto.insertBefore = function <T extends Node>(newNode: T, refNode: Node | null): T {
    if (refNode && refNode.parentNode !== this) {
      console.warn('[DOM Patch] insertBefore ignorado');
      return newNode;
    }
    return origInsertBefore.call(this, newNode, refNode) as T;
  };

  const origReplaceChild = proto.replaceChild;
  proto.replaceChild = function <T extends Node>(newChild: Node, oldChild: T): T {
    if (oldChild.parentNode !== this) {
      console.warn('[DOM Patch] replaceChild ignorado');
      return oldChild;
    }
    return origReplaceChild.call(this, newChild, oldChild) as T;
  };
}

createRoot(document.getElementById("root")!).render(
  <App />
);
