# INSTRUMENTAÇÃO — Astra Foods

Sistema base reconstruído a partir do projeto Kindred Connect para gestão de instrumentação, calibração e metrologia.

## O que esta versão resolve

- Remove a página inicial de tela branca.
- A rota inicial `/` renderiza o Dashboard diretamente.
- Não há leitura de `localStorage` durante a renderização SSR.
- Navegação entre módulos acontece imediatamente no cliente.
- A interface foi estruturada para carregamento assíncrono de dados sem bloquear a troca de módulo.
- Inclui estrutura visual dos módulos de Instrumentação.
- Inclui tabela inicial de instrumentos e busca global local.
- Inclui estados visuais para calibrado, a vencer e vencido.
- Inclui tratamento de erro da aplicação.

## Módulos

Dashboard, Instrumentos, Calibração, Padrões, Certificados, Manutenção, Não Conformidades, Movimentações, Indicadores, Relatórios, Documentos, Alertas, Inteligência e Configurações.

## Próxima etapa

Conectar os módulos a banco de dados/API e implementar CRUDs, autenticação, histórico, cálculos metrológicos, certificados, manutenção, NCs, relatórios e permissões.

## Execução

```bash
npm install
npm run dev
```

Para produção:

```bash
npm run build
```
