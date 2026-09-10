# react-knowledge-graph

## React Knowledge Graph Viewer — `@gruporeacciona/react-knowledge-graph`

Librería React reutilizable para visualizar grafos de conocimiento (grafos de código, GraphRAG, Neo4j, Graphology, memorias tipo Mem0/Graphiti, grafos jurídicos/documentales y mapas de dependencias técnicas) usando Three.js/React Three Fiber y un modelo de datos neutral.

> **Estado actual:** scaffolding de monorepo completo con guardas de arquitectura y compliance activos. La lógica de negocio (`KnowledgeGraphViewer`, hooks, adaptadores) se implementa en fases posteriores.

## Arquitectura

Monorepo de cuatro paquetes con dirección de dependencia estricta:

```
Aplicación consumidora
  └─▶ react-knowledge-graph   (API pública: KnowledgeGraphViewer + hooks)
        └─▶ graph-renderer-three   (escena Three.js/R3F)
              └─▶ graph-core        (tipos, validación, utilidades — sin React ni Three.js)

adapters/*   (conversores externos → NormalizedGraph; nunca importados por react-knowledge-graph)
```

### Paquetes

| Paquete | npm | Responsabilidad |
|---|---|---|
| `graph-core` | `@gruporeacciona/graph-core` | Tipos `GraphNode`/`GraphEdge`/`NormalizedGraph`, validación, normalización, utilidades de filtrado/agrupación/estadísticas — cero dependencias de React o Three.js |
| `graph-renderer-three` | `@gruporeacciona/graph-renderer-three` | Escena Three.js/R3F: nodos, aristas, cámara, controles, selección, animaciones, efectos visuales |
| `react-knowledge-graph` | `@gruporeacciona/react-knowledge-graph` | Componente público `KnowledgeGraphViewer`, hooks (`useGraphSelection`, `useGraphSearch`, `useGraphFilters`, `useGraphCamera`, `useGraphStats`), theming, paneles opcionales |
| `adapters/codebase-memory` | `@gruporeacciona/adapter-codebase-memory` | Conversor del formato Codebase Memory MCP → `NormalizedGraph` (implementación diferida a Milestone 6) |

## Dependencias clave

- **Runtime (peerDependencies):** `react ^19.2.7`, `react-dom ^19.2.7`, `three ^0.185.1`, `@react-three/fiber ^9.6.1`, `@react-three/drei ^10.7.7`
- **Build/tooling:** `pnpm@11.10.0` (Corepack), `turbo@2.10.4`, `typescript@6.0.3`, `eslint@10.6.0`, `typescript-eslint@8.63.0`
- **Compliance:** `license-checker-rseidelsohn@5.0.1`, `generate-license-file@4.2.1`

## Instalación y ejecución

```bash
# Activar la versión correcta de pnpm mediante Corepack
corepack enable
corepack use pnpm@11.10.0

# Instalar dependencias del workspace
pnpm install

# Build completo (todos los paquetes)
pnpm build                        # equivale a: turbo run build

# Lint y typecheck
pnpm lint
pnpm typecheck

# Gate de licencias
pnpm run licenses:check

# Ejemplo básico (Vite dev server)
pnpm --filter @gruporeacciona/example-basic-usage exec vite
```

## Guardas de arquitectura (ESLint)

Cada paquete tiene restricciones de imports forzadas en CI:

- **`graph-core`:** bloquea `react`, `react-dom`, `three`, `@react-three/*`, `fetch` (global), `axios`, `useQuery`
- **`react-knowledge-graph`:** permite `react`/`react-dom`; bloquea `three`, `@react-three/*`, `fetch`, `axios`, `useQuery`
- **`graph-renderer-three`:** permite `react`, `three`, `@react-three/*`; bloquea `fetch`, `axios`, `useQuery`
- **`adapters/*`:** bloquea `react`, `react-dom`, `three`, `@react-three/*`

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) ejecuta en cada PR y push a `main`:
1. `pnpm install --frozen-lockfile`
2. `turbo run build lint typecheck`
3. Gate de licencias: bloquea GPL/AGPL/SSPL; MPL/LGPL/EPL requieren revisión manual

## Licencias y atribución

El proyecto es MIT. Deriva parcialmente de `codebase-memory-mcp` (MIT, Copyright © 2025 DeusData, tag `v0.8.1`, SHA `f0c9be19c5d74b84f418d807bfdce7b5d6a261ff`). Consultar `NOTICE.md` y `THIRD_PARTY_NOTICES.md`.
