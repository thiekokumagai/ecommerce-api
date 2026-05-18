# Project: ecommerce-core-api

## What This Is

O `ecommerce-core-api` é a API backend principal da plataforma de e-commerce PodeMais, desenvolvida com NestJS 11, TypeScript e Prisma ORM (banco PostgreSQL). Ela gerencia autenticação, usuários, categorias, variações de produto e controle de estoque de produtos simples e complexos (com variações).

## Core Value

Prover uma API de e-commerce robusta, segura, desacoplada e escalável, que garanta consistência no controle de estoque de produtos e performance sob alta demanda.

## Requirements

### Validated

- ✓ Controle básico de produtos simples (sem variações) e complexos (com variações) — existente
- ✓ Autenticação JWT e gerenciamento de permissões via Passport — existente
- ✓ Integração com Prisma ORM e PostgreSQL — existente

### Active

- [ ] REQ-01: Estabelecer as regras e padrões de Arquitetura Limpa Modular (Modular Clean Architecture)
- [ ] REQ-02: Refatorar o módulo de categorias (`categories`) como módulo pioneiro da arquitetura limpa
- [ ] REQ-03: Refatorar os módulos de apoio (`users` e `variations`)
- [ ] REQ-04: Refatorar o núcleo de produtos (`products`), preservando as regras de estoque e alteração de variações
- [ ] REQ-05: Refatorar o fluxo de autenticação (`auth`) desacoplando controllers e use cases
- [ ] REQ-06: Garantir cobertura de testes unitários nos use cases e testes de ponta-a-ponta (E2E) nas novas rotas

### Out of Scope

- [Exclusão 1] — Migração de banco de dados (o banco continua PostgreSQL gerenciado via Prisma)
- [Exclusão 2] — Criação de novos endpoints de checkout/carrinho (foco estritamente na refatoração da estrutura atual)

## Context

O projeto atual sofre de alto acoplamento nos arquivos `*.service.ts`, que misturam lógica de banco de dados (Prisma), validações de regras de negócios e tratamento de erros. A refatoração visa separar essas preocupações em camadas claras, facilitando testes unitários rápidos e independência de infraestrutura.

## Constraints

- **Stack**: NestJS 11 + TypeScript + Prisma ORM (Manter a stack técnica) — Sem permissão para mudar framework ou ORM.
- **Retrocompatibilidade**: Os contratos de API HTTP e endpoints atuais não podem quebrar (garantido por testes E2E).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clean Architecture Modular | Manter as fronteiras nativas do NestJS agrupando o código por funcionalidade | — Pending |

## Evolution

Este documento evolui na transição de fases e milestones.

---
*Last updated: 2026-05-17 after initialization*
