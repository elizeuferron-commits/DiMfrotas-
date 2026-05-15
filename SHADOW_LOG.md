# 🌑 Modo Sombra (Shadow Mode)

Este arquivo registra o progresso das funcionalidades em desenvolvimento paralelo. As alterações aqui listadas **não** foram aplicadas à versão estável do aplicativo.

## 📋 Backlog de Desenvolvimento (Sombra)
- [ ] *Nenhuma funcionalidade pendente no Modo Sombra.*

## 🔄 Histórico de Sincronização
- **2026-05-15 (PRO)**: **Lançamento v0.2.0**: Unificação do ecossistema APK Digital, Modo Offline (PWA), Sincronização Excel Staff e Consultor Gemini Flash 3.0.
- **2026-05-15**: **Backup para Google Drive**: Adicionada ferramenta que gera um instalador portátil (.html) estruturado para ser armazenado e distribuído via Drive, garantindo acesso universal ao ecossistema DM.
- **2026-05-15**: **Relatórios em Excel (Staff)**: Implementada exportação de fichas individuais e lista completa da equipe para formato .xlsx.
- **2026-05-15**: **Distribuição APK (PWA)**: Implementada terminologia e fluxo de compartilhamento do "Instalador APK" para facilitar a adoção pelos funcionários via WhatsApp. Melhorado o guia visual para criação de atalhos dinâmicos com o logo oficial da DM.
- **2026-05-15**: **Lançamento do Consultor IA (DM Pro Assistente)**: O componente `AIConsultant` foi promovido para produção, utilizando oficialmente o motor **Gemini 3.0 Flash**.
- **2026-05-15**: **Estratégia de Ecossistema**: Implementado o Hub de ferramentas satélites (AppSheet, FlutterFlow) e plano de migração para **Vertex AI** na Central de Criação.
- **2026-05-15**: **Sincronização de Correções**: Botão de alternância rápida de rotas ativo e correção do exportador de PDF integrada.
- **2026-05-15**: **Plano de Expansão Cloud**: O sistema agora orienta Elizeu Ferron sobre a migração para Vertex AI e integração com ecossistemas Low-Code Enterprise.
- **2026-05-15**: **Integração Real com Gemini API**: Substituição de simulações por chamadas reais via Google AI SDK no Centro de Criação e lançamento do Consultor IA para todos os colaboradores.
- **2026-05-15**: Implementado alternância rápida de status em rotas de fretamento.
- **2026-05-14**: **Independência de Plataforma**: O aplicativo foi totalmente desvinculado de referências a "projeto" ou "estúdio", tornando-se um software independente (DM Pro App).
- **2026-05-14**: Implementado Portal de Download Oficial com autenticação de segurança para colaboradores, site de landing page corporativa e meta-tags de SEO/PWA otimizadas para download sem intermediários.
- **2026-05-14**: Implementado Gerenciador de Fretamento (CharteredRoutes) com formulário de importação de localização via Google Maps.
- **2026-05-14**: Adicionado Mural de Mídia (Upload de Imagens/Vídeos) no Dashboard para compartilhamento entre equipe com legendas.
- **2026-05-14**: Implementado Banner de Instalação PWA (Atalho Executável) no Dashboard para facilitar a geração de ícone nativo em dispositivos Desktop e Mobile.
- **2026-05-14**: Sincronizado: Controle de Jornada (Portaria/Jornada) e Gestão de Fretamento integrados ao core do aplicativo.
- **2026-05-14**: Desenvolvimento das ferramentas de Controle de Jornada e Fretamento em Modo Sombra (Isolated Dev).
- **2026-05-13**: Sincronizado: Plano de Fundo Personalizado (Frota DM) via `/background.jpg` com Fallback Estilizado e Correção de Erros de Hidratação em Layouts de Alta Densidade.
- **2026-05-13**: Sincronizado: Controle de Jornada (Portaria/Jornada) com Clock-in/out, Intervalos e Painel de Monitoramento.
- **2026-05-13**: Sincronizado: Gerador de Instalador Portátil (Acesso Offline/Folder) e Compartilhamento Direto para Equipe via WhatsApp.
- **2026-05-13**: Sincronizado: Integração de Vídeos em Destaque no Dashboard (Limite 4), Compartilhamento de Vídeos e Confirmação Global de Exclusão (Trash/Delete Buttons) em todo o sistema.
- **2026-05-13**: Sincronizado: Highway IA Auditor (Motor de Detecção e Correção Automática), Logout Seguro, Perfil de Visitante (Expiração 15 dias), Compartilhamento Social (FB/IG/WhatsApp) e Exclusão de Publicações pelo Autor.
- **2026-05-13**: Sincronizado: Nova Identidade Visual (Logo DM Turismo), Finalização da Estrutura de Build Executável (Electron/Pathing) e Atualização de Referências Globais para o novo nome "DM Turismo".
- **2026-05-13**: Remoção de funcionalidades legadas: IA Auditor e Controle de Jornada removidos para simplificação do core operacional.
- **2026-05-12**: Sincronizado: Otimização PWA (Estratégia Stale-while-revalidate e Window Controls Overlay) para experiência nativa autêntica.
- **2026-05-12**: Sincronizado: Exclusão segura de viagens com confirmação (modal de segurança), Correção de permissões Firestore (trips, fuel_entries, stock_items) e Geração profissional de Ordens de Serviço em Word (.docx) e PDF (Texto selecionável).
- **2026-05-12**: Sincronizado: Finalização da Ferramenta de BI (ReportsView) com Exportação Real (PDF/Excel), Refatoração para Performance (Lazy Loading/Memoization), Botão de Foto em Aniversariantes e Consolidação de Layout.
- **2026-05-12**: Sincronizado: Fix no instalador PWA (Botão Executável), Adição de Foto instantânea para aniversariantes no Dashboard.
- **2026-05-11**: Sincronizado: Compartilhamento de Acesso via WhatsApp Individual e Card de Instalação Nativa (Executável PWA).
- **2026-05-11**: Sincronizado: Mural Festivo Premium, Anexos em Viagens, Simplificação da Home e Relatórios Operacionais.
- **2026-05-11**: Sincronizado: Gestão de Equipe Avançada (Permissões Manuais Dinâmicas, Exclusão Segura e Compartilhamento WhatsApp).
- **2026-05-11**: Implementação do Dashboard Pro (Home), Sistema de Mensagens e Alertas de Aniversário.
- **2026-05-11**: Sincronizado: Versão 0.1.6-pro "Premium Dark UI" (Contrast & Build Optimization). Foco em legibilidade extrema, remoção de fundos complexos e otimização profunda do bundle via tree-shaking e chunks manuais.
- **2026-05-11**: Sincronizado: Versão 0.1.5-pro "Full Stack" (Electron, Capacitor, Audit, Backup & Ultra-Build).
- **2026-05-11**: Sincronizado: Sistema de Backup Automático do Firestore (Snapshots 24h), Widget de Alertas de Frota, Novo Layout OS de Viagem v3 e Relatório Técnico de Oficina.
- **2026-05-10**: Sincronizado: Geração de OS em Word (.docx) e PDF com texto selecionável (selectable text).
- **2026-05-10**: Sincronizado: Expansão de OS na lista (ver paradas, notas e anexos inline).
- **2026-05-10**: Sincronizado: Transição para "Highway OS" - Novo fundo de estrada cinematic, atualização de identidade visual para "DM Turismo" e otimização de build para ambiente de produção.
- **2026-05-10**: Sincronizado: OS de Viagem, Checklist de Passageiros, Instalação PWA, Ajustes de Permissões (RBAC), Auto-recolhimento da Barra Lateral, Otimização de Impressão A4 (Eco-mode), PDF Editável e Compartilhamento de PDF via WhatsApp.
- **2026-05-10**: Sincronizado: Ocultar campo de Custo (R$) no formulário de Abastecimento.
- **Sincronização 01** (09/05/2026): Implementação de RBAC (Controle de Acesso por Cargo) integrada com sucesso.
- **Sincronização 02** (09/05/2026): Lançamento da v1.1.0 com PWA, Sistema de Viagens e Banco de Dados Real-time.
