# Requirements: React Knowledge Graph Viewer

**Defined:** 2026-07-08
**Core Value:** Cualquier equipo puede montar `<KnowledgeGraphViewer nodes={} edges={} />` para visualizar un grafo de conocimiento sin acoplarse a MCP, SQLite, ASTs, un repositorio Git concreto, ni a ningún backend específico.

## v1 Requirements

Requisitos para el primer tramo de trabajo (Milestones 1-3 de docs/07-roadmap.md). Cada uno se mapeará a una fase del roadmap.

### INFRA (Repo y compliance)

- [x] **INFRA-01**: Monorepo pnpm con `packages/graph-core`, `packages/graph-renderer-three`, `packages/react-knowledge-graph`, `packages/adapters/{codebase-memory,graphology,neo4j}`, `examples/*` (docs/03-architecture.md)
- [x] **INFRA-02**: Turborepo + configuración de TypeScript compartida (project references) en todos los packages
- [ ] **INFRA-03**: Regla de ESLint (`no-restricted-imports`) que bloquea imports de React/Three.js/backend (`fetch`/`axios`/`useQuery`) en `graph-core` y `react-knowledge-graph`, forzando ADR 0003
- [ ] **INFRA-04**: Chequeo de licencias en CI (`pnpm licenses list` o `license-checker-rseidelsohn`) wired antes de añadir cualquier dependencia real
- [ ] **INFRA-05**: `NOTICE.md` finalizado con el SHA de commit real, copyright y texto de licencia de `codebase-memory-mcp` (sustituye el placeholder actual en `NOTICE.md:14`)
- [ ] **INFRA-06**: `THIRD_PARTY_NOTICES.md` creado
- [ ] **INFRA-07**: `peerDependencies` (`react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`) declaradas correctamente en todos los packages consumidores, evitando instancias duplicadas

### CORE (Modelo de datos neutral)

- [ ] **CORE-01**: Tipos `GraphNode`/`GraphEdge`/`NormalizedGraph` definidos en `graph-core`, sin dependencias de React/Three.js/backend
- [ ] **CORE-02**: Validación de datos con Zod (IDs únicos, existencia de `source`/`target` en las aristas)
- [ ] **CORE-03**: Utilidades de normalización, filtro, agrupación y estadísticas del grafo
- [ ] **CORE-04**: `graph-core` verificado como neutral alimentándolo con un dataset estructuralmente distinto (p. ej. forma Graphology/GraphRAG), no solo datos de code-graph

### VIEWER (Componente React mínimo y desacoplamiento)

- [ ] **VIEWER-01**: Visor 3D importado desde `https://github.com/DeusData/codebase-memory-mcp` hacia `packages/react-knowledge-graph`
- [ ] **VIEWER-02**: `<KnowledgeGraphViewer nodes edges />` renderiza un grafo con datos mock usando `graph-renderer-three` (React Three Fiber)
- [ ] **VIEWER-03**: Eventos `onNodeClick`, `onNodeDoubleClick`, `onNodeHover`, `onEdgeClick` devuelven siempre `GraphNode`/`GraphEdge` normalizados, nunca objetos internos de Three.js (docs/05-react-api.md)
- [ ] **VIEWER-04**: Control de cámara pan/zoom/orbit
- [ ] **VIEWER-05**: Encoding visual configurable (`nodeColor`/`nodeSize`/`edgeColor`/`edgeWidth` como valor o función)
- [ ] **VIEWER-06**: Labels con visibilidad por defecto `'hover'`/`'selected'` (nunca siempre visibles)
- [ ] **VIEWER-07**: Layout `force-3d` por defecto
- [ ] **VIEWER-08**: Drag de nodos soportado (gap detectado en investigación, no estaba en docs/05)
- [ ] **VIEWER-09**: Estados vacío, cargando y error manejados explícitamente por el componente (gap detectado en investigación)
- [ ] **VIEWER-10**: Ninguna dependencia del backend original (MCP/SQLite/AST/Git) permanece en `graph-renderer-three` ni `react-knowledge-graph`

## v2 Requirements

Diferidos a milestones posteriores del roadmap (docs/07-roadmap.md). Reconocidos pero no incluidos en el roadmap actual.

### Exploration UX (Milestone 4)

- **EXPL-01**: Búsqueda de nodos con centrado de cámara
- **EXPL-02**: Filtro por `kind`/`group`
- **EXPL-03**: Resaltado de vecinos al seleccionar un nodo
- **EXPL-04**: Panel `GraphInspector` opcional

### Performance & Clustering (Milestone 5)

- **PERF-01**: Renderizado de nodos vía `InstancedMesh`
- **PERF-02**: Geometría de aristas batched/instanced
- **PERF-03**: Cálculo de layout fuera del hilo principal (Web Worker / Barnes-Hut)
- **PERF-04**: Benchmarks a 1k/5k/10k nodos
- **PERF-05**: Clustering por atributo o detección de comunidades — no estaba en el roadmap original, añadido tras investigación (docs/research/FEATURES.md, PITFALLS.md) como mitigación real para grafos de 1k+ nodos

### Adapters (Milestone 6)

- **ADAPT-01**: Adaptador para Codebase Memory MCP
- **ADAPT-02**: Adaptador para Graphology
- **ADAPT-03**: Adaptador para registros Neo4j (con conversión explícita de tipos Integer/Node/Relationship antes de normalizar)
- **ADAPT-04**: Adaptador JSON genérico

### Publication (Milestone 7)

- **PUB-01**: Workflow de Changesets configurado (modo `linked`)
- **PUB-02**: Build dual ESM+CJS con tipos TypeScript vía `tsup`
- **PUB-03**: README de uso y versionado semántico
- **PUB-04**: Publicación real — requiere aprobación interna de Grupo Reacciona antes de hacerse pública (política de conducta, no una decisión técnica)

## Out of Scope

Exclusiones explícitas. Documentadas para prevenir scope creep.

| Feature | Reason |
|---------|--------|
| Versión vanilla JS | Diferida a Milestone 8, solo si hay demanda real (docs/01, docs/07) |
| Competir con Cytoscape.js/Sigma.js como herramienta 2D analítica completa | No es el objetivo del proyecto (docs/01) |
| Motor de layouts propio desde el día uno | Complejidad innecesaria; usar `d3-force-3d` (docs/01, research/STACK.md) |
| Acoplar la librería a MCP, SQLite, ASTs o un repositorio Git concreto | Rompe el principio de neutralidad del modelo (docs/01) |
| Edición de grafos en el visor | Violaría el modelo neutral/agnóstico de backend (research/PITFALLS.md) |
| Búsqueda difusa/lenguaje natural (estilo Neo4j Bloom) | Diferenciador legítimo pero no v1 (research/FEATURES.md) |
| Export PNG/SVG y modo presentación | Milestone 8, sin demanda validada aún |
| Renderizador 2D (Sigma.js) | Milestone 8, solo si hay demanda real |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| INFRA-06 | Phase 1 | Pending |
| INFRA-07 | Phase 1 | Pending |
| CORE-01 | Phase 2 | Pending |
| CORE-02 | Phase 2 | Pending |
| CORE-03 | Phase 2 | Pending |
| CORE-04 | Phase 2 | Pending |
| VIEWER-01 | Phase 3 | Pending |
| VIEWER-02 | Phase 3 | Pending |
| VIEWER-03 | Phase 3 | Pending |
| VIEWER-04 | Phase 3 | Pending |
| VIEWER-05 | Phase 3 | Pending |
| VIEWER-06 | Phase 3 | Pending |
| VIEWER-07 | Phase 3 | Pending |
| VIEWER-08 | Phase 3 | Pending |
| VIEWER-09 | Phase 3 | Pending |
| VIEWER-10 | Phase 3 | Pending |

**Coverage:**

- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-08*
*Last updated: 2026-07-08 after roadmap creation (3 phases, 21/21 v1 requirements mapped)*
