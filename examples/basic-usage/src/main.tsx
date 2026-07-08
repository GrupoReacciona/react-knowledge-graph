import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Side-effect-only import: proves `@gruporeacciona/react-knowledge-graph` resolves as a
// real `workspace:*` dependency and its built output is loadable from a genuine consumer.
// The package currently has no named exports (Phase 1 scaffolding placeholder — see
// packages/react-knowledge-graph/src/index.ts). The real viewer component and the
// mock-data usage shown in ../basic-usage.tsx land in Phase 3 (VIEWER-02, D-11).
// Do NOT import the future viewer component here yet — it does not exist until Phase 3.
import '@gruporeacciona/react-knowledge-graph';

function App() {
  return <div>examples/basic-usage placeholder — the real viewer lands in Phase 3 (VIEWER-02).</div>;
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
