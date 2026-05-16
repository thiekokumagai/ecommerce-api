---
title: "Mapa de Arquitetura"
last_updated: "2026-05-16"
---

# Mapa de Arquitetura

## Visão Geral
O projeto `ecommerce-core-api` é uma aplicação backend construída em NestJS. Ele segue o padrão de arquitetura de monólito modular, onde os recursos são encapsulados em módulos distintos (Auth, Users, Products, Categories, Variations).

## Padrões Principais
- **Monólito Modular:** Funcionalidades são separadas por domínio dentro de `src/modules/`.
- **Arquitetura em Camadas:** Cada módulo segue rigorosamente o padrão Controller-Service-Repository (Prisma).
  - **Controllers:** Lidam com as requisições HTTP, validação de DTOs (com `class-validator`) e documentação Swagger.
  - **Services:** Contêm as regras de negócio, orquestram chamadas e interagem diretamente com o Prisma para as operações no banco de dados.
- **Injeção de Dependências:** Utiliza intensamente o contêiner de DI do NestJS para a injeção de serviços, providers e configurações.

## Fluxo de Dados
1. **Requisição do Cliente:** Uma requisição HTTP chega através de um endpoint definido em um Controller.
2. **Middlewares/Guards:** A requisição passa por guards globais/locais (ex: JWT AuthGuard) e interceptors.
3. **Validação:** Os pipes de validação utilizam o `class-validator` e os DTOs para garantir a integridade do payload enviado.
4. **Camada de Serviço:** O Controller invoca o método apropriado do Service, repassando os DTOs já validados.
5. **Acesso a Dados:** O Service executa as regras de negócio e utiliza o Prisma Client para realizar as queries no banco de dados PostgreSQL.
6. **Integrações Externas:** Se necessário (como no upload de imagens), o Service interage com módulos externos, como o módulo do MinIO.
7. **Resposta:** Os dados são formatados (geralmente serializados) e retornados para o cliente.

## Abstrações
- **ORM:** O Prisma atua como a abstração principal de acesso ao banco de dados Postgres.
- **Armazenamento de Objetos:** O módulo `src/minio` abstrai o SDK do MinIO para prover métodos unificados de upload e manipulação de arquivos.
- **Autenticação:** As bibliotecas Passport e JWT abstraem a lógica de geração, validação e estratégias de tokens de sessão.
