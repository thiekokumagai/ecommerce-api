# Roadmap: ecommerce-core-api

## Overview

Este roadmap detalha as fases necessárias para refatorar o backend `ecommerce-core-api` para uma Arquitetura Limpa Modular sem interromper ou quebrar as funcionalidades existentes de e-commerce.

## Milestones

- 🚧 **v1.0 Refatoração Clean Architecture** - Fases 1-5 (em progresso)

## Phases

- [x] **Phase 1: Diretrizes Arquiteturais** - Estabelecer o manual da arquitetura limpa e inicializar o projeto
- [x] **Phase 2: Refatoração do Módulo Pioneiro (categories)** - Validar o padrão desacoplando categorias
- [x] **Phase 3: Refatoração de Apoio (users, variations)** - Aplicar padrão aos módulos simples de suporte
- [x] **Phase 4: Refatoração Principal (products, auth)** - Migrar a lógica complexa de estoque e autenticação (completed 2026-05-17)
- [x] **Phase 5: Verificação e Testes** - Garantir estabilidade com suite de testes unitários e E2E completa (completed 2026-05-17)

## Phase Details

### Phase 1: Diretrizes Arquiteturais
**Goal**: Definir as especificações de design e pasta da Arquitetura Limpa Modular
**Depends on**: Nothing
**Requirements**: REQ-01
**Success Criteria**:
  1. O arquivo `.planning/codebase/ARCHITECTURE.md` existe detalhando as responsabilidades de cada camada.
  2. O manual de desenvolvimento em PT-BR está disponível.
**Plans**: 1 plano

Plans:
- [x] 01-01: Criar manual arquitetural e diretrizes de design

### Phase 2: Refatoração do Módulo Pioneiro (categories)
**Goal**: Desacoplar completamente o módulo de categorias em camadas
**Depends on**: Phase 1
**Requirements**: REQ-02
**Success Criteria**:
  1. A pasta `src/modules/categories/domain` contém a entidade pura, port do repositório e os use cases.
  2. A pasta `src/modules/categories/infrastructure` contém os controllers, DTOs e repositório Prisma.
  3. O arquivo `categories.service.ts` foi deletado com sucesso.
  4. Testes e2e de categorias passam sem alterações na API pública.
**Plans**: 1 plano

Plans:
- [x] 02-01: Refatorar o módulo de categorias para Clean Architecture

### Phase 3: Refatoração de Apoio (users, variations)
**Goal**: Aplicar o padrão de camadas aos módulos de usuários e variações
**Depends on**: Phase 2
**Requirements**: REQ-03
**Success Criteria**:
  1. Módulo `users` refatorado com injeção de use cases e repositório Prisma desacoplado.
  2. Módulo `variations` refatorado de forma análoga.
  3. Serviços antigos deletados.
**Plans**: 2 planos

Plans:
- [x] 03-01: Refatorar módulo de usuários (users)
- [x] 03-02: Refatorar módulo de variações (variations)

### Phase 4: Refatoração Principal (products, auth)
**Goal**: Refatorar o core complexo de catálogo, regras de estoque e fluxo de segurança
**Depends on**: Phase 3
**Requirements**: REQ-04, REQ-05
**Success Criteria**:
  1. Módulo `products` estruturado em camadas de domínio e infraestrutura.
  2. A lógica complexa de estoque de produtos simples/com variação e transição de tipos é isolada em use cases específicos do domínio.
  3. O módulo `auth` está devidamente isolado com use cases de login, validação e refresh de token.
**Plans**: 2 planos

Plans:
- [x] 04-01: Refatorar módulo de produtos (products)
- [x] 04-02: Refatorar módulo de autenticação (auth)

### Phase 5: Verificação e Testes
**Goal**: Validar a integridade, compatibilidade pública e testabilidade do sistema
**Depends on**: Phase 4
**Requirements**: REQ-06
**Success Criteria**:
  1. Execução de todos os testes unitários com 100% de sucesso.
  2. Execução de testes E2E do Supertest confirmando integridade de todos os endpoints HTTP.
  3. A documentação Swagger (/api/docs) renderiza perfeitamente com todas as tags de contratos das DTOs de infraestrutura.
**Plans**: 1 plano

Plans:
- [x] 05-01: Execução geral de testes unitários, E2E e validação Swagger

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Diretrizes Arquiteturais | v1.0 | 1/1 | Completed | 2026-05-17 |
| 2. Módulo Pioneiro (categories) | v1.0 | 1/1 | Completed | 2026-05-17 |
| 3. Módulos Apoio (users, variations) | v1.0 | 2/2 | Completed | 2026-05-17 |
| 4. Módulos Core (products, auth) | v1.0 | 2/2 | Complete    | 2026-05-17 |
| 5. Verificação e Testes | v1.0 | 1/1 | Complete    | 2026-05-17 |
