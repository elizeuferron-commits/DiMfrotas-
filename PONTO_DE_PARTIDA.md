# Ponto de Partida - Documentação do Estado Atual

Este documento registra o estado estável do sistema de Gestão de Frota em 11 de Maio de 2026.

## 🛣️ Premium Dark UI (v0.2.0-pro)
- **Identidade Visual**: Implementação do novo Logo "DM Turismo" em laranja (#ff6b00) e tema Zinc-950 refinado.
- **Relatórios em Excel (Staff)**: Capacidade de exportar fichas individuais e a lista completa de colaboradores para o formato `.xlsx`.
- **Modo Offline & APK Digital**: Transição completa para ecossistema PWA com terminologia "APK Digital". Ícones dinâmicos na tela inicial e suporte a funcionamento offline com persistência em IndexedDB.
- **Consultor IA (DM Pro Assistente)**: Assistente inteligente integrado (Gemini 3.0 Flash) para análise de documentos e suporte operacional.
- **Simplificação Operacional**: Remoção do motor de auditoria (IA Auditor) e controle de jornada para focar na agilidade do core business.
- **Mural de Momentos Social**: Novo feed de mídias (Fotos e Vídeos) e notícias com suporte a compartilhamento direto para Redes Sociais.
- **Instalador APK Digital**: Renomeação do instalador portátil para "APK Digital" facilitando a compreensão do usuário Android sobre a instalação nativa via PWA.
- **Vídeos em Destaque**: Espaço dedicado para até 4 vídeos de operação no Dashboard.
- **Sistema de Segurança de Dados**: Implementação de confirmação obrigatória em todas as exclusões.
- **Contraste Aprimorado**: Ajuste global de cores para leitura perfeita.
- **Build & Performance**: Sistema de build otimizado com chunks separados para Firebase e bibliotecas pesadas.
- **UX**: Expansão de itens na lista de OS e recolhimento automático da barra lateral.
- **Exportação Multi-formato**: Suporte a PDF, Word e agora Excel (.xlsx).

## 📱 Infraestrutura de Distribuição (Cross-Platform)
O sistema opera como um ecossistema de instalação única, preparado para todas as plataformas:
- **APK Digital (PWA)**: Foco principal para colaboradores via Android/iOS, com instalação direta ("Add to Home Screen") que simula um aplicativo nativo (.apk).
- **Offline First**: Persistência de dados local garantindo que o colaborador possa consultar sua escala mesmo sem sinal de internet.
- **Electron**: Executável nativo para desktop com suporte a instalação offline.
- **Vite Build**: Configuração de `base: './'` para resolução universal de ativos.

## 🛡️ Segurança, Backup & Auditoria
- **Histórico de Auditoria**: Log detalhado de ações (Criação de Viagens, Veículos, Funcionários) com rastreio por usuário e timestamp.
- **Backup Automático**: Sistema de snapshots do Firestore que realiza backups silenciados a cada 24h para o administrador (`elizeuferron@gmail.com`).
- **Gestão de Snapshots**: Ferramenta manual na área de engenharia para exportação instantânea do banco de dados em JSON.
- **Regras de Segurança**: Firestore Rules robustecidas com validação de email administrativo e permissões específicas para logs de auditoria.

## 🚀 Viagens & Fretamento
- **Módulo de Trips**: Novo sistema para controle de rotas, turismo e fretamento contínuo.
- **Checklist de Documentação**: Sistema inteligente que gera listas de documentos obrigatórios baseados na modalidade (Estadual, Interestadual ou Mercosul).
- **Manifesto de Passageiros**: Cadastro detalhado de passageiros com captura de documentos para conformidade legal.
- **Ordem de Serviço (OS)**: Geração automatizada de Ordem de Serviço profissional pronta para impressão, centralizando dados de itinerário (incluindo paradas intermediárias), recursos e passageiros.
- **Edição de Viagens**: Capacidade de acessar e corrigir dados de viagens já cadastradas (redigitar informações).
- **Suporte a Segundo Motorista**: Opção de escalar motorista auxiliar para viagens longas, com exibição e assinatura na Ordem de Serviço.
- **Paradas Intermediárias**: Suporte para adicionar múltiplas escalas com data e hora prevista durante a criação/edição da rota.
- **Anexos e Documentos Digitalizados**: Módulo de upload para fotos (instruções, comprovantes), PDFs, documentos Word e planilhas Excel, com visualização integrada e indicação na escala. Inclui suporte para recebimento de arquivos compartilhados diretamente do WhatsApp via PWA Share Target e um visualizador dedicado para acesso rápido aos documentos salvos.
- **Filtros Avançados**: Sistema de busca textual (título/itinerário) e filtragem por status, modalidade e intervalo de datas com opção de reset rápido.
- **Status em Tempo Real**: Visualização de viagens agendadas, em curso e finalizadas, com indicador visual de pendências documentais.
- **Integração de Passageiros**: Controle de ocupação por viagem, com funcionalidades de importação em massa (texto colado), exportação para CSV e edição individual de nomes e documentos.
- **Nova Ferramenta - OS de Viagem**: Seção dedicada para busca e emissão instantânea de Ordens de Serviço (escala operacional) para a equipe, incluindo checklist interativo de passageiros para conferência no embarque, geração automática de número de O.S., preenchimento inteligente via IA (Gemini), opções de exportação para PDF, compartilhamento via WhatsApp e extração automática de passageiros a partir de anexos (fotos/PDF). A O.S. está otimizada para o padrão A4, com layout "Eco-friendly" para economia de papel e tinta, além de ser totalmente editável antes da exportação para PDF e compartilhamento direto.
- **Gestão Documental Inteligente**: Sistema de anexos em viagens com suporte a download direto e extração de dados via IA. Agora é possível importar listas de passageiros automaticamente a partir de fotos de documentos ou PDFs de manifesto, utilizando visão computacional (Gemini Vision).
- **Controle de Permissões (RBAC)**: Sistema de permissões granulado por cargo. Motoristas e equipe de limpeza agora têm acesso direto à ferramenta "OS de Viagem" (substituindo a visualização completa de "Viagens" para limpeza), garantindo foco nas tarefas operacionais.
- **Distribuição e Acesso Facilitado**: Sistema otimizado para instalação como PWA (atalho na tela do celular/PC) e botão de compartilhamento rápido de link para acesso de funcionários. Agora com interface otimizada que recolhe a barra lateral automaticamente após a seleção de uma ferramenta, maximizando a área de trabalho.

## 📊 Gestão Financeira e Real-time
- **Fluxo de Caixa**: Módulo completo de contas a pagar e receber.
- **Live Database**: Indicador visual de conexão em tempo real com o Firestore.
- **Sincronização Multi-usuário**: Todas as tabelas (Frota, Manutenção, Financeiro e Viagens) agora utilizam listeners (`onSnapshot`) para atualização instantânea entre dispositivos.

## 🛠️ Módulo de Manutenção (Oficina)
- **O.S. Técnica**: Fluxo especializado para veículos pesados (Vans/Ônibus).
- **Alertas de KM**: Monitoramento preditivo de troca de óleo e revisões.

---
**Data de Atualização:** 16/05/2026
**Responsável:** DM Pro Dev Team

## 🌑 Atualizações Recentes (16/05/2026)
- **Preparação Nativa Android**: Plataforma Android inicializada com Capacitor 8.3, SDK 36 (Android 15) configurado e sincronizado.
- **Refatoração HashRouter**: Sistema de roteamento robusto para suporte a navegação por histórico e botão voltar em apps nativos.
- **Instalador APK Corporativo v2**: Versão aprimorada do instalador portátil (.html) com guia visual passo-a-passo para instalação como App nativo em Android e iOS.
- **Gestão Financeira de Oficina**: Inclusão de custos reais e datas de conclusão no histórico de manutenção de veículos para análise de ROI.
- **Ecossistema de Compartilhamento**: Módulo de compartilhamento universal para colaboradores via WhatsApp, simplificando a distribuição do ecossistema DM.

## 🌑 Atualizações Recentes (19/05/2026) - v1.6.0 "Diamond Dashboard"
- **Dashboard Pro (v1.6.0)**:
    - **Interface de Alta Densidade**: Redesenho completo do painel principal focado em controle operacional total.
    - **Alertas Prateados (FleetAlerts)**: Widget inteligente integrado que destaca veículos com documentação vencida ou manutenções atrasadas diretamente na Home.
    - **Mural de Mídia Estabilizado**: Sistema robusto de compartilhamento de fotos e vídeos da operação, com suporte a links externos (Instagram/TikTok) e visualização em tela cheia.
    - **Homenagem a Aniversariantes**: Banner festivo dinâmico com suporte a foto do colaborador e animações de celebração.
    - **Feed de Notícias Administrativo**: Canal oficial de comunicação para notícias urgentes e informativos da frota.
- **Sidebar Unificada**:
    - **Consolidação de Módulos**: Agrupamento lógico de ferramentas para reduzir a carga cognitiva.
    - **Controle de Acesso RBAC v2**: Restrição do Módulo de Ponto exclusivamente para o Proprietário (Elizeu Ferron) e colaboradores autorizados (Geber, Daniela).
    - **Navegação Inteligente**: Resolução de permissões em tempo real para exibir apenas o que o usuário pode acessar.
- **Módulo de Manutenção Especializada**:
    - **Checklist Adaptativo**: Lista suspensa de manutenções com itens específicos para Vans (Portas, Estribos) e Ônibus (Ar Centrifugo, Sistemas a Ar, Banheiro).
    - **Automação de Descrição**: Seleções inteligentes que concatenam itens técnicos na descrição da OS, economizando tempo de digitação.
- **Integração v1.4.0-attachments**: Sincronização oficial do ecossistema de visualização de anexos (PDF, Office, Imagens) em todo o fluxo de viagens e oficina.
- **Integração v1.2.0-finance**: Lançamento do Scanner Financeiro IA (OCR via Gemini) e suporte a Código de Barras no Contas a Pagar.

## 🌑 Atualizações Recentes (19/05/2026) - v1.7.0 "Production Stable"
- **Hotfix de Permissões (v1.6.1)**: Correção crítica nas regras de segurança do Firestore para permitir que administradores excluam rotas de fretamento e vídeos em destaque sem erros de permissão ou recursão.
- **Estabilização de Mídia**: Otimização dos componentes `Dashboard` e `MediaHub` para evitar interrupções em pedidos de reprodução (`play()`) em navegadores modernos, garantindo fluidez no mural de mídias.
- **Limpeza de Modo Sombra**: Remoção completa de marcas d'água e referências de desenvolvimento ".shadow", consolidando o sistema para uso em produção.
- **Refinamento de Dashboard**: Limpeza visual e remoção de widgets redundantes para foco total nas métricas operacionais e alertas de frota.
