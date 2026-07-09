# Roadmap: React Knowledge Graph Viewer

## Overview

El primer tramo de trabajo (Milestones 1-3 de `docs/07-roadmap.md`) lleva el repositorio desde "solo documentación" hasta un componente `<KnowledgeGraphViewer nodes edges />` funcional, desacoplado de cualquier backend. El camino tiene tres etapas naturales impuestas por la propia dirección de dependencias del proyecto: primero se levanta un monorepo con las guardas de compliance y arquitectura (licencias, atribución, reglas de lint) que son baratas de poner ahora y carísimas de retrofittear después; luego se construye `graph-core`, el modelo de datos neutral del que depende todo lo demás y que debe probarse neutral con un dataset estructuralmente distinto; y finalmente se importa y adapta el visor 3D original hacia un componente React mínimo que renderiza datos mock cumpliendo el contrato props-in/callbacks-out. Al terminar este tramo, cualquier equipo de Grupo Reacciona podrá montar el visor con datos de prueba, sin ninguna dependencia residual de MCP/SQLite/AST/Git.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Repo Scaffolding & Compliance Gates** - Monorepo pnpm/Turborepo con TypeScript compartido, guardas de arquitectura (ESLint) y de licencias (CI), y compliance de atribución (NOTICE.md/THIRD_PARTY_NOTICES.md) resueltos antes de escribir código de features. (completed 2026-07-09)
- [ ] **Phase 2: Modelo de Datos Neutral (graph-core)** - Tipos `GraphNode`/`GraphEdge`/`NormalizedGraph`, validación Zod y utilidades de grafo, probados como genuinamente neutrales frente a un dataset no derivado de code-graph.
- [ ] **Phase 3: Componente Visor 3D Mínimo** - `<KnowledgeGraphViewer nodes edges />` importado y adaptado desde `codebase-memory-mcp`, renderizando datos mock con interacción, cámara, encoding visual y estados explícitos, sin ninguna dependencia del backend original.

## Phase Details

### Phase 1: Repo Scaffolding & Compliance Gates

**Goal**: El equipo tiene una base de monorepo funcional y protegida estructuralmente (arquitectura, licencias, atribución) antes de que exista código de features, para que los riesgos más caros de corregir tarde (atribución legal, dependencias no permitidas, instancias duplicadas de React/Three) queden bloqueados desde el día uno.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07
**Success Criteria** (what must be TRUE):

  1. Un desarrollador puede ejecutar `pnpm install` y el build de Turborepo sobre todo el monorepo (`packages/graph-core`, `packages/graph-renderer-three`, `packages/react-knowledge-graph`, `packages/adapters/{codebase-memory,graphology,neo4j}`, `examples/*`), resolviendo TypeScript vía project references sin errores.
  2. Un PR que introduce un import de React/Three.js o una llamada a `fetch`/`axios`/`useQuery` dentro de `graph-core` o `react-knowledge-graph` falla el lint en CI (regla `no-restricted-imports` de ADR 0003).
  3. Un PR que añade una dependencia con licencia no permitida (GPL/AGPL/SSPL) es bloqueado por el chequeo de licencias en CI antes de mergear.
  4. `NOTICE.md` contiene el SHA de commit real, copyright y texto de licencia de `codebase-memory-mcp` (sin placeholders), y `THIRD_PARTY_NOTICES.md` existe con el mismo nivel de detalle.
  5. Los packages consumidores declaran `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei` como `peerDependencies`, verificable instalando el paquete en un `examples/*` real sin duplicar instancias.

**Plans**: 8/8 plans executed

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Monorepo foundation: pnpm workspace, TypeScript project references, Turborepo tasks

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — ESLint architecture guard (D-05..D-08), CI pipeline, NOTICE.md/PROJECT.md legal finalization

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Scaffold graph-core + empirical D-05 guard verification

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md — Scaffold graph-renderer-three (peerDependencies) + empirical D-07 guard verification
- [x] 01-05-PLAN.md — Scaffold adapters/codebase-memory (D-09/D-10, no logic) + empirical D-08 guard verification

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-06-PLAN.md — Scaffold react-knowledge-graph (peerDependencies) + empirical D-06 guard verification

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 01-07-PLAN.md — examples/basic-usage Vite skeleton + no-duplicate-instance integration proof

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 01-08-PLAN.md — THIRD_PARTY_NOTICES.md generation, empirical license-gate test, full-phase verification

### Phase 2: Modelo de Datos Neutral (graph-core)

**Goal**: `graph-core` expone un modelo de grafo (`GraphNode`/`GraphEdge`/`NormalizedGraph`) y utilidades de validación/transformación que son verificablemente neutrales — no solo documentadas como tales — y no dependen de React, Three.js ni de ningún backend concreto.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04
**Success Criteria** (what must be TRUE):

  1. Un desarrollador puede importar `GraphNode`/`GraphEdge`/`NormalizedGraph` desde `graph-core` sin arrastrar ninguna dependencia de React, Three.js o de un backend concreto.
  2. Al validar un grafo con Zod, un dataset con IDs duplicados o con aristas cuyo `source`/`target` no existe es rechazado con un mensaje de error claro.
  3. Un desarrollador puede filtrar, agrupar y obtener estadísticas de un grafo usando utilidades ya provistas por `graph-core`, sin escribir lógica de transformación custom.
  4. `graph-core` normaliza y valida correctamente un dataset estructuralmente distinto de un code-graph (p. ej. forma Graphology/GraphRAG), demostrando neutralidad real y no solo ausencia de imports de React/Three.js.

**Plans**: TBD

### Phase 3: Componente Visor 3D Mínimo

**Goal**: Cualquier equipo puede montar `<KnowledgeGraphViewer nodes={} edges={} />`, ver el grafo renderizado en 3D con datos mock, interactuar con él (click/hover/cámara/drag) y recibir siempre datos normalizados en los callbacks — sin ninguna dependencia residual del backend original.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: VIEWER-01, VIEWER-02, VIEWER-03, VIEWER-04, VIEWER-05, VIEWER-06, VIEWER-07, VIEWER-08, VIEWER-09, VIEWER-10
**Success Criteria** (what must be TRUE):

  1. Un desarrollador puede renderizar `<KnowledgeGraphViewer nodes={mockNodes} edges={mockEdges} />` (visor importado desde `codebase-memory-mcp` hacia `graph-renderer-three`) y ver el grafo en 3D con controles de cámara pan/zoom/orbit funcionando y layout `force-3d` por defecto.
  2. Los eventos `onNodeClick`, `onNodeDoubleClick`, `onNodeHover` y `onEdgeClick` siempre devuelven objetos `GraphNode`/`GraphEdge` normalizados, nunca instancias internas de Three.js.
  3. El color y tamaño de nodo, y el color/ancho de arista, se configuran como valor fijo o función (encoding visual); las etiquetas solo son visibles en hover o selección (nunca siempre visibles); y los nodos se pueden arrastrar (drag) en la escena.
  4. El componente maneja explícitamente los estados vacío (sin datos), cargando y error (p. ej. datos inválidos), mostrando feedback visual distinto para cada uno en lugar de fallar silenciosamente o mostrar una escena en blanco.
  5. Una auditoría de imports/dependencias de `graph-renderer-three` y `react-knowledge-graph` no encuentra ninguna referencia a MCP, SQLite, ASTs o un repositorio Git concreto.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Repo Scaffolding & Compliance Gates | 8/8 | Complete    | 2026-07-09 |
| 2. Modelo de Datos Neutral (graph-core) | 0/TBD | Not started | - |
| 3. Componente Visor 3D Mínimo | 0/TBD | Not started | - |
