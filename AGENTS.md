# Regras do Aplicativo - Gestão DM Turismo

## 🛡️ Fluxo de Trabalho: Modo Sombra (Shadow Mode)
O usuário estabeleceu um workflow de "Linha Paralela" para desenvolvimento:

1. **Desenvolvimento Isolado**: Novas funcionalidades devem ser discutidas e preparadas em arquivos de extensão `.shadow.tsx` ou documentadas no `SHADOW_LOG.md` antes de serem integradas.
2. **Proteção da Estabilidade**: O código residente em `src/App.tsx`, `src/components/`, etc., é considerado a "Versão de Produção".
3. **Comando de Gatilho**: Somente quando o usuário solicitar "Atualizar o aplicativo", as alterações do Modo Sombra devem ser movidas/mescladas para os arquivos principais.
4. **Referência de Partida**: O arquivo `PONTO_DE_PARTIDA.md` serve como referência do estado estável inicial.

## 🎨 Diretrizes de Design
- Seguir o padrão "DM Turismo": Dark mode (zinc-900/950), detalhes em `brand-accent` (#ff6b00) e tipografia em Inter.
- Manter o estilo de botões e cards com cantos arredondados (rounded-2xl) e fontes uppercase para labels técnicas.
