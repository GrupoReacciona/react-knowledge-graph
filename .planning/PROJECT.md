# React Knowledge Graph Viewer

## What This Is

Una librería React reutilizable (`@gruporeacciona/react-knowledge-graph`) para visualizar grafos de conocimiento — grafos de código, GraphRAG, Neo4j, Graphology/Sigma, memorias tipo Mem0/Graphiti, grafos jurídicos/documentales y mapas de dependencias técnicas — usando un modelo de datos neutral (`nodes: GraphNode[]`, `edges: GraphEdge[]`). Nace de extraer y evolucionar el visor 3D (Three.js / React Three Fiber) del proyecto open-source `codebase-memory-mcp` hacia un componente desacoplado de cualquier backend concreto.

## Core Value

Cualquier equipo puede montar `<KnowledgeGraphViewer nodes={} edges={} />` para visualizar un grafo de conocimiento sin acoplarse a MCP, SQLite, ASTs, un repositorio Git concreto, ni a ningún backend específico.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate. El repositorio es actualmente solo documentación: no hay código implementado, `packages/` está vacío, sin dependencias ni CI, según el mapeo de codebase de 2026-07-08.)

### Active

<!-- Current scope. Building toward Milestones 1-3 del roadmap (docs/07-roadmap.md). -->

- [ ] Estructura de monorepo creada: `packages/graph-core`, `packages/graph-renderer-three`, `packages/react-knowledge-graph`, `packages/adapters/{codebase-memory,graphology,neo4j}`, `examples/*` (docs/03-architecture.md)
- [ ] Archivos de licencias/compliance completos: `LICENSE` (MIT), `NOTICE.md` con atribución real a `codebase-memory-mcp`, `THIRD_PARTY_NOTICES.md`, `SECURITY.md` (docs/08-licensing-compliance.md)
- [ ] ADRs iniciales revisados/ampliados (ya existen 3 en `docs/adr/`)
- [ ] Visor 3D importado desde `https://github.com/DeusData/codebase-memory-mcp` (MIT, verificado) hacia `packages/react-knowledge-graph`
- [ ] Componente React mínimo `<KnowledgeGraphViewer nodes edges onNodeClick onNodeHover />` renderizando datos mock
- [ ] Modelo neutral `nodes`/`edges` implementado en `graph-core`, sin dependencias del backend original (MCP/SQLite/AST/Git)
- [ ] Validación de datos en `graph-core` (esquema de `GraphNode`/`GraphEdge`)
- [ ] Ejemplos con Storybook o Vite demostrando el componente

Todos los ítems Active son hipótesis hasta que se implementen, verifiquen y confirmen.

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Versión vanilla JS — diferida a Milestone 8, solo si hay demanda real (docs/01, docs/07)
- Competir directamente con Cytoscape.js/Sigma.js como herramienta analítica 2D completa — no es el objetivo (docs/01)
- Motor de layouts avanzado propio desde el día uno — diferido (docs/01)
- Acoplar la librería a MCP, SQLite, ASTs o repositorios Git — va en contra del principio de neutralidad del modelo (docs/01)
- Búsqueda/filtro/inspector (Milestone 4), rendimiento con 1k-10k nodos (Milestone 5), adaptadores Graphology/Neo4j/JSON (Milestone 6) y publicación/versionado (Milestone 7) — quedan para tramos posteriores, no en este

## Context

- **Origen del código**: se extrae del visor 3D de `codebase-memory-mcp` (https://github.com/DeusData/codebase-memory-mcp), MIT, público, ~28.2k estrellas — verificado vía GitHub API el 2026-07-08.
- **Estado actual del repo** (mapeo de codebase, 2026-07-08): solo documentación. No hay código de implementación, `package.json` es un placeholder, sin lockfile ni CI. `packages/` existe pero está vacío.
- **Documentación previa extensa**: `docs/01` a `docs/08` (visión, viabilidad, arquitectura, modelo de datos, API React, plan de extracción, roadmap, licencias) más 3 ADRs en `docs/adr/` — son el contrato de diseño vinculante para las fases de implementación.
- **Gap detectado en el mapeo**: `NOTICE.md:14` señala explícitamente que la atribución está sin resolver; `THIRD_PARTY_NOTICES.md` todavía no existe. Debe completarse como parte del trabajo de licencias de Milestone 1.
- **Audiencia**: inicialmente equipos de ingeniería de Grupo Reacciona que necesiten visualizar grafos de código/conocimiento (p. ej. salidas de Codebase Memory MCP). La intención a largo plazo es publicar el paquete en abierto bajo MIT, pero eso requiere aprobación interna previa antes de cualquier publicación pública.

## Constraints

- **Licencias**: intención de licencia MIT para el proyecto nuevo; debe mantener atribución a `codebase-memory-mcp` (copia de la licencia original, copyright, explicación en `NOTICE.md`) — Por qué: reutilizar código derivado bajo MIT exige atribución legal (docs/08).
- **Aprobación de publicación**: cualquier release público u open-source, o publicación npm bajo el scope `@gruporeacciona`, requiere aprobación interna previa según la política de conducta de Reacciona — Por qué: la organización no permite publicar contenido como Reacciona sin aprobación previa.
- **Stack técnico**: React primero, usando Three.js / React Three Fiber para el renderizado; JS vanilla explícitamente diferido — Por qué: el visor original está construido sobre R3F, reutilizarlo reduce el riesgo de la extracción (docs/01, docs/03).
- **Arquitectura**: modelo de datos neutral `nodes`/`edges`; el core (tipos, validación, normalización) debe permanecer desacoplado de cualquier renderizador o backend concreto (MCP, SQLite, AST, Git) — Por qué: reutilización across code graphs, GraphRAG, Neo4j, Graphology, KGs empresariales (docs/01, docs/03).
- **Política de dependencias**: nuevas dependencias deben respetar la política de licencias de docs/08 (MIT/BSD/ISC/Apache-2.0 permitidas por defecto; MPL/LGPL/EPL requieren revisión manual; GPL/AGPL/SSPL bloqueadas) — Por qué: mantener el paquete legalmente limpio dado el objetivo de licencia MIT.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Primer tramo de trabajo = Milestones 1-3 (repo base, componente React mínimo, desacoplamiento real en graph-core) | El usuario eligió el alcance más ambicioso frente a solo el scaffolding del repo | — Pending |
| Intención de licencia: MIT, publicación open-source | Intención explícita del usuario, alineada con la recomendación de docs/08 | — Pending (requiere aprobación de publicación de Reacciona antes de hacerse pública) |
| Fuente de extracción confirmada: github.com/DeusData/codebase-memory-mcp | Verificado vía GitHub API: MIT, público, 28.2k estrellas | ✓ Good |
| Commit fuente fijado: tag `v0.8.1` (SHA `f0c9be19c5d74b84f418d807bfdce7b5d6a261ff`, 2026-06-12), copyright `(c) 2025 DeusData` | Decidido en discusión de Fase 1: tag etiquetado es más auditable que HEAD de main; se re-verificará en Fase 3 antes de importar código | ✓ NOTICE.md finalizado en Fase 1 con este SHA/tag/copyright/texto MIT completo (Plan 01-02) — re-verificar en Fase 3 antes de copiar código |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-08 after initialization*
