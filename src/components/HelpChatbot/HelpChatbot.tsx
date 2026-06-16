import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, X, Send, Bot,
  ChevronRight
} from 'lucide-react';
import './HelpChatbot.css';

/* ─── Types ──────────────────────────────────────────────── */
interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  suggestions?: string[];
}

interface KnowledgeEntry {
  id: string;
  category: string;
  keywords: string[];
  question: string;
  answer: string;
  route?: string;
  relatedIds?: string[];
}

/* ═══════════════════════════════════════════════════════════
   KNOWLEDGE BASE — covers every module, workflow & feature
   ═══════════════════════════════════════════════════════════ */
const knowledgeBase: KnowledgeEntry[] = [
  // ── DASHBOARD ──────────────────────────────────────────
  {
    id: 'dashboard',
    category: 'Dashboard',
    keywords: ['dashboard', 'painel', 'inicio', 'home', 'resumo', 'kpi', 'indicador', 'visao geral', 'tela inicial', 'pagina inicial', 'pagina principal'],
    question: 'O que é o Dashboard?',
    answer: 'O **Dashboard** é a tela inicial do ERP e apresenta uma visão consolidada de toda a operação:\n\n• **KPIs principais** — faturamento mensal, orçamentos pendentes, OSs em produção e contas a receber.\n• **Gráficos interativos** (Chart.js) — evolução de receita, comparativo mensal e distribuição por status.\n• **Atalhos rápidos** — acesso direto aos módulos mais usados.\n• **Alertas** — notificações de prazos, estoque baixo e cobranças vencidas.\n\nAcesse em [Dashboard](/).',
    route: '/',
    relatedIds: ['relatorios', 'financeiro-overview', 'chartjs']
  },

  // ── CLIENTES ───────────────────────────────────────────
  {
    id: 'clientes-overview',
    category: 'Clientes',
    keywords: ['cliente', 'clientes', 'crm', 'carteira', 'cadastro cliente', 'lista cliente', 'gestao cliente'],
    question: 'Como funciona o módulo de Clientes?',
    answer: 'O módulo de **Clientes** é o CRM do sistema:\n\n• **Cadastrar clientes** PF (CPF) ou PJ (CNPJ) com todos os dados fiscais.\n• **Múltiplos contatos** — cadastre vários contatos por empresa (compras, financeiro, arte).\n• **Múltiplos endereços** — endereço de cobrança, entrega e instalação separados.\n• **Perfil do cliente** — visualize todo o histórico de orçamentos, OSs e financeiro.\n• **Busca e filtros** — encontre clientes por nome, documento, cidade ou segmento.\n\nAcesse em [Clientes](/clientes).',
    route: '/clientes',
    relatedIds: ['clientes-cadastro', 'clientes-perfil', 'orcamento-overview']
  },
  {
    id: 'clientes-cadastro',
    category: 'Clientes',
    keywords: ['cadastrar cliente', 'novo cliente', 'adicionar cliente', 'criar cliente', 'cpf', 'cnpj', 'pessoa fisica', 'pessoa juridica', 'razao social', 'registrar cliente'],
    question: 'Como cadastrar um novo cliente?',
    answer: 'Para cadastrar um novo cliente:\n\n1. Acesse [Clientes](/clientes) no menu lateral.\n2. Clique no botão **"Novo Cliente"**.\n3. Escolha o tipo: **Pessoa Física** ou **Pessoa Jurídica**.\n4. Preencha os dados: nome/razão social, CPF/CNPJ, telefone e e-mail.\n5. Adicione endereços (cobrança, entrega, instalação).\n6. Clique em **"Salvar"**.\n\n💡 **Dica**: O sistema integra com **ViaCEP** — ao digitar o CEP, o endereço é preenchido automaticamente!',
    route: '/clientes/novo',
    relatedIds: ['clientes-overview', 'viacep']
  },
  {
    id: 'clientes-perfil',
    category: 'Clientes',
    keywords: ['perfil cliente', 'historico cliente', 'detalhes cliente', 'visualizar cliente', 'os do cliente', 'orcamentos do cliente', 'editar cliente', 'alterar cliente'],
    question: 'Como ver o perfil e histórico de um cliente?',
    answer: 'Para acessar o perfil completo de um cliente:\n\n1. Vá até [Clientes](/clientes).\n2. Clique no nome do cliente na listagem.\n3. O perfil exibe: dados cadastrais, endereços, contatos e o **histórico completo** de orçamentos, ordens de serviço e transações financeiras.\n\n💡 Você pode editar os dados clicando em **"Editar"** diretamente no perfil.',
    route: '/clientes',
    relatedIds: ['clientes-overview', 'clientes-cadastro']
  },

  // ── ORÇAMENTOS ─────────────────────────────────────────
  {
    id: 'orcamento-overview',
    category: 'Orçamentos',
    keywords: ['orcamento', 'orcamentos', 'proposta', 'propostas', 'venda', 'vendas', 'precificar', 'preco', 'vender', 'cotacao', 'comercial'],
    question: 'Como funciona o módulo de Orçamentos?',
    answer: 'O módulo de **Orçamentos** é o coração comercial do ERP:\n\n• **Criar propostas detalhadas** com itens, quantidades, metros quadrados e preço unitário.\n• **Cálculo automático** baseado em insumos, m², sangrias, acabamentos e custo/hora de produção.\n• **Status** — Rascunho, Enviado, Aprovado, Rejeitado.\n• **Conversão em OS** — quando o cliente aprova, transforme em Ordem de Serviço com um clique!\n• **PDF** — gere versão impressa para enviar ao cliente.\n\nAcesse em [Orçamentos](/orcamentos).',
    route: '/orcamentos',
    relatedIds: ['orcamento-criar', 'orcamento-converter', 'calculadoras']
  },
  {
    id: 'orcamento-criar',
    category: 'Orçamentos',
    keywords: ['criar orcamento', 'novo orcamento', 'fazer orcamento', 'nova proposta', 'adicionar orcamento', 'montar orcamento', 'fazer proposta', 'elaborar orcamento'],
    question: 'Como criar um novo orçamento?',
    answer: 'Para criar um novo orçamento:\n\n1. Acesse [Orçamentos](/orcamentos) no menu lateral.\n2. Clique em **"Novo Orçamento"**.\n3. Selecione o **cliente** (ou cadastre um novo).\n4. Adicione os **itens/serviços**: descrição, quantidade, m², preço unitário.\n5. O sistema calcula automaticamente o **valor total** com materiais e mão de obra.\n6. Defina prazo de validade e condições de pagamento.\n7. Clique em **"Salvar"** ou **"Enviar ao Cliente"**.\n\n💡 Use as [Calculadoras](/calculadoras) para estimar custos de materiais!',
    route: '/orcamentos/novo',
    relatedIds: ['orcamento-overview', 'calculadoras', 'orcamento-converter']
  },
  {
    id: 'orcamento-converter',
    category: 'Orçamentos',
    keywords: ['converter orcamento', 'transformar orcamento', 'orcamento em os', 'orcamento aprovado', 'aprovar orcamento', 'gerar os', 'virar os'],
    question: 'Como converter um orçamento em OS?',
    answer: 'Quando o cliente aprova um orçamento:\n\n1. Abra o orçamento aprovado em [Orçamentos](/orcamentos).\n2. Clique no botão **"Gerar Ordem de Serviço"**.\n3. O sistema cria automaticamente uma OS com todos os dados (itens, quantidades, valores).\n4. A OS aparecerá no painel de [Ordens de Serviço](/ordens-servico) e no [PCP / Kanban](/producao).\n\n💡 Você também pode enviar a arte para aprovação pelo módulo de [Aprovações](/aprovacoes).',
    route: '/orcamentos',
    relatedIds: ['os-overview', 'producao-overview', 'aprovacoes']
  },
  {
    id: 'orcamento-visualizar',
    category: 'Orçamentos',
    keywords: ['ver orcamento', 'visualizar orcamento', 'detalhe orcamento', 'imprimir orcamento', 'pdf orcamento', 'enviar orcamento'],
    question: 'Como visualizar ou imprimir um orçamento?',
    answer: 'Para visualizar/imprimir um orçamento:\n\n1. Acesse [Orçamentos](/orcamentos).\n2. Clique no orçamento desejado para abrir a **visualização completa**.\n3. Na tela de detalhes, use:\n   • **"Imprimir"** — imprime direto no navegador.\n   • **"Gerar PDF"** — baixa um PDF com a identidade visual da empresa.\n   • **"Enviar"** — envia por e-mail ou gera link para o cliente.\n\nO layout do PDF segue a identidade configurada em [Configurações](/configuracoes).',
    route: '/orcamentos',
    relatedIds: ['orcamento-overview', 'configuracoes']
  },

  // ── ORDENS DE SERVIÇO ──────────────────────────────────
  {
    id: 'os-overview',
    category: 'Ordens de Serviço',
    keywords: ['ordem servico', 'ordem de servico', 'os', 'ordens', 'servico', 'os aberta', 'gerenciar os', 'ordens servico'],
    question: 'Como funciona o módulo de Ordens de Serviço?',
    answer: 'O módulo de **Ordens de Serviço (OS)** gerencia toda a execução:\n\n• **Criar OS** manualmente ou a partir de um orçamento aprovado.\n• **Status** — Aberta, Em Produção, Concluída, Entregue, Cancelada.\n• **Detalhamento** — itens, quantidades, prazos, responsáveis e observações.\n• **Vínculo financeiro** — cada OS pode gerar lançamentos no financeiro.\n• **Rastreabilidade** — todo o histórico de movimentações fica registrado.\n\nAcesse em [Ordens de Serviço](/ordens-servico).',
    route: '/ordens-servico',
    relatedIds: ['os-criar', 'producao-overview', 'orcamento-converter']
  },
  {
    id: 'os-criar',
    category: 'Ordens de Serviço',
    keywords: ['criar os', 'nova os', 'nova ordem', 'adicionar os', 'abrir os', 'abrir ordem', 'nova ordem servico'],
    question: 'Como criar uma Ordem de Serviço?',
    answer: 'Para criar uma OS:\n\n1. Acesse [Ordens de Serviço](/ordens-servico).\n2. Clique em **"Nova OS"**.\n3. Selecione o **cliente** e (opcionalmente) vincule a um orçamento.\n4. Adicione os itens/serviços com quantidades e especificações.\n5. Defina **prazo de entrega** e responsável.\n6. Clique em **"Salvar"**.\n\nA OS entrará automaticamente no [PCP / Kanban](/producao) na coluna Backlog.',
    route: '/ordens-servico/nova',
    relatedIds: ['os-overview', 'producao-overview']
  },
  {
    id: 'os-editar',
    category: 'Ordens de Serviço',
    keywords: ['editar os', 'alterar os', 'modificar os', 'editar ordem', 'atualizar os', 'status os', 'cancelar os'],
    question: 'Como editar ou atualizar uma OS?',
    answer: 'Para editar uma Ordem de Serviço:\n\n1. Acesse [Ordens de Serviço](/ordens-servico).\n2. Clique na OS desejada para abrir os detalhes.\n3. Clique em **"Editar"** para modificar itens, prazos ou observações.\n4. Para alterar o status, use os botões de ação (Iniciar Produção, Concluir, Entregar).\n5. Salve as alterações.\n\n💡 O Kanban em [Produção](/producao) também permite mover OSs entre colunas de status arrastando os cards.',
    route: '/ordens-servico',
    relatedIds: ['os-overview', 'producao-overview']
  },

  // ── PRODUÇÃO / PCP / KANBAN ────────────────────────────
  {
    id: 'producao-overview',
    category: 'Produção / PCP',
    keywords: ['producao', 'pcp', 'kanban', 'painel producao', 'etapa', 'etapas', 'status producao', 'coluna', 'backlog', 'arte', 'impressao', 'acabamento', 'concluido', 'planejamento'],
    question: 'Como funciona o PCP / Kanban?',
    answer: 'O **PCP (Planejamento e Controle de Produção)** organiza as OSs em um painel Kanban visual:\n\n• **Backlog** — OSs aguardando início.\n• **Arte/Aprovação** — arte em criação ou aguardando aprovação do cliente.\n• **Impressão** — peças sendo impressas.\n• **Acabamento** — corte, dobra, colagem e montagem.\n• **Instalação** — peças prontas para instalar.\n• **Concluído** — trabalhos finalizados.\n\nArraste as OSs entre colunas para atualizar o status!\n\nAcesse em [PCP / Kanban](/producao).',
    route: '/producao',
    relatedIds: ['os-overview', 'instalacoes']
  },

  // ── ESTOQUE ────────────────────────────────────────────
  {
    id: 'estoque-overview',
    category: 'Estoque',
    keywords: ['estoque', 'insumo', 'insumos', 'material', 'materiais', 'quantidade', 'saldo', 'inventario', 'controle estoque', 'entrada', 'saida', 'movimentacao'],
    question: 'Como funciona o controle de Estoque?',
    answer: 'O módulo de **Estoque** monitora todos os insumos da fábrica:\n\n• **Cadastro de materiais** — ACM, vinil, lona, tintas, tubos, perfis metálicos e mais.\n• **Controle de quantidade** — entradas (compras) e saídas (produção) automáticas.\n• **Alerta de estoque mínimo** — o sistema avisa quando um item atinge o nível de segurança.\n• **Movimentações** — histórico completo de entradas e saídas por item.\n• **Unidades de medida** — metros, litros, quilos, unidades, bobinas.\n\nAcesse em [Estoque](/estoque).',
    route: '/estoque',
    relatedIds: ['estoque-materiais', 'fornecedores', 'calculadoras']
  },
  {
    id: 'estoque-materiais',
    category: 'Estoque',
    keywords: ['acm', 'chapa', 'vinil', 'lona', 'tinta', 'bobina', 'substrato', 'resina', 'material especifico', 'adesivo', 'impressao digital'],
    question: 'Como gerenciar materiais específicos?',
    answer: 'Para gerenciar materiais específicos (ACM, vinil, lona, etc.):\n\n1. Acesse [Estoque](/estoque).\n2. Use a **barra de busca** para encontrar o material.\n3. Clique no material para ver **saldo**, **movimentações** e **nível mínimo**.\n4. Para dar entrada: clique em **"Entrada"**, informe quantidade e fornecedor.\n5. Saídas são registradas automaticamente quando uma OS entra em produção.\n\n💡 Use as [Calculadoras](/calculadoras) para calcular o aproveitamento de chapas e evitar desperdício!',
    route: '/estoque',
    relatedIds: ['estoque-overview', 'calculadoras', 'fornecedores']
  },

  // ── FORNECEDORES ───────────────────────────────────────
  {
    id: 'fornecedores',
    category: 'Fornecedores',
    keywords: ['fornecedor', 'fornecedores', 'compra', 'compras', 'supplier', 'cadastro fornecedor', 'distribuidora', 'novo fornecedor', 'cadastrar fornecedor'],
    question: 'Como funciona o cadastro de Fornecedores?',
    answer: 'O módulo de **Fornecedores** gerencia toda a cadeia de suprimentos:\n\n• **Cadastrar fornecedores** com razão social, CNPJ, contato e endereço.\n• **Vincular produtos** — associe quais materiais cada fornecedor oferece.\n• **Histórico de compras** — veja as últimas compras com cada fornecedor.\n• **Comparar preços** — use o [Comparador de Preços](/comparador) para o melhor custo.\n\nPara cadastrar: acesse [Fornecedores](/fornecedores) → **"Novo Fornecedor"**.',
    route: '/fornecedores',
    relatedIds: ['estoque-overview', 'comparador']
  },

  // ── FINANCEIRO ─────────────────────────────────────────
  {
    id: 'financeiro-overview',
    category: 'Financeiro',
    keywords: ['financeiro', 'financa', 'financas', 'faturamento', 'fluxo de caixa', 'caixa', 'receita', 'despesa', 'dre', 'contas', 'contabilidade'],
    question: 'Como funciona o módulo Financeiro?',
    answer: 'O módulo **Financeiro** é o controle completo de receitas e despesas:\n\n• **Contas a Pagar** — fornecedores, aluguel, impostos, salários.\n• **Contas a Receber** — cobranças de clientes, parcelas.\n• **Fluxo de Caixa** — visão consolidada de entradas e saídas por período.\n• **Lançamentos** — crie, edite e dê baixa em transações.\n• **Centro de Custos** — categorize despesas por departamento/projeto.\n• **Gráficos** — visualize a evolução financeira com Chart.js.\n\nAcesse em [Financeiro](/financeiro).',
    route: '/financeiro',
    relatedIds: ['financeiro-lancamento', 'financeiro-baixa', 'financeiro-centrocusto', 'contratos']
  },
  {
    id: 'financeiro-lancamento',
    category: 'Financeiro',
    keywords: ['lancamento', 'transacao', 'novo lancamento', 'criar lancamento', 'pagar', 'receber', 'conta pagar', 'conta receber', 'despesa', 'receita', 'registrar despesa', 'registrar receita'],
    question: 'Como criar um lançamento financeiro?',
    answer: 'Para criar um novo lançamento:\n\n1. Acesse [Financeiro](/financeiro).\n2. Clique em **"Novo Lançamento"**.\n3. Selecione o tipo: **Receita** (entrada) ou **Despesa** (saída).\n4. Preencha: descrição, valor, data de vencimento, categoria e centro de custo.\n5. Vincule a um cliente ou fornecedor (opcional).\n6. Clique em **"Salvar"**.\n\nO lançamento aparecerá na listagem e poderá ser filtrado por status: Pendente, Pago ou Vencido.',
    route: '/financeiro/novo',
    relatedIds: ['financeiro-overview', 'financeiro-baixa', 'financeiro-centrocusto']
  },
  {
    id: 'financeiro-baixa',
    category: 'Financeiro',
    keywords: ['baixa', 'dar baixa', 'confirmar pagamento', 'recebimento', 'pago', 'confirmar baixa', 'multa', 'juros', 'desconto', 'receber pagamento', 'quitar', 'liquidar'],
    question: 'Como dar baixa / confirmar pagamento?',
    answer: 'Para dar baixa em um lançamento (confirmar pagamento ou recebimento):\n\n1. Na listagem do [Financeiro](/financeiro), encontre o lançamento.\n2. Clique no botão **"Receber"** (ou "Pagar").\n3. Um popup aparecerá com:\n   • **Data de pagamento** — quando foi efetivamente pago.\n   • **Multa** — valor de penalidade (se aplicável).\n   • **Juros** — valor de juros (se aplicável).\n   • **Desconto** — desconto concedido.\n4. Confirme a baixa.\n\nO status mudará para **"Pago"** e será contabilizado no fluxo de caixa.',
    route: '/financeiro',
    relatedIds: ['financeiro-overview', 'financeiro-lancamento']
  },
  {
    id: 'financeiro-centrocusto',
    category: 'Financeiro',
    keywords: ['centro custo', 'centro de custo', 'custo', 'departamento', 'setor', 'categorizar', 'classificar despesa', 'adicionar custo'],
    question: 'Como funciona o Centro de Custos?',
    answer: 'O **Centro de Custos** permite categorizar receitas e despesas por área:\n\n• **Criar centros de custo** — ex: Produção, Administrativo, Comercial, Instalação.\n• **Vincular lançamentos** — ao criar um lançamento, selecione o centro de custo.\n• **Relatórios por centro** — veja quanto cada área gasta/fatura.\n\nPara gerenciar centros de custo, acesse [Configurações](/configuracoes) ou diretamente no [Financeiro](/financeiro).',
    route: '/financeiro',
    relatedIds: ['financeiro-overview', 'financeiro-lancamento', 'configuracoes']
  },
  {
    id: 'financeiro-filtros',
    category: 'Financeiro',
    keywords: ['filtrar financeiro', 'buscar lancamento', 'vencido', 'pendente', 'pago', 'periodo financeiro', 'extrato'],
    question: 'Como filtrar lançamentos no Financeiro?',
    answer: 'O módulo Financeiro possui filtros avançados:\n\n• **Por status** — Pendente, Pago, Vencido, Cancelado.\n• **Por tipo** — Receita ou Despesa.\n• **Por período** — defina data inicial e final.\n• **Por centro de custo** — filtre por departamento/área.\n• **Por cliente/fornecedor** — veja transações de um parceiro específico.\n• **Busca textual** — digite parte da descrição para filtrar.\n\nOs filtros funcionam em tempo real na listagem do [Financeiro](/financeiro).',
    route: '/financeiro',
    relatedIds: ['financeiro-overview', 'financeiro-lancamento']
  },

  // ── CONTRATOS ──────────────────────────────────────────
  {
    id: 'contratos',
    category: 'Contratos',
    keywords: ['contrato', 'contratos', 'recorrente', 'recorrencia', 'faturamento automatico', 'aluguel', 'manutencao', 'mensal', 'assinatura', 'renovacao', 'contrato recorrente'],
    question: 'Como funciona o módulo de Contratos?',
    answer: 'O módulo de **Contratos** gerencia serviços recorrentes:\n\n• **Contratos de manutenção** — manutenção periódica de painéis, letreiros, fachadas.\n• **Aluguel de estruturas** — locação de equipamentos ou painéis.\n• **Faturamento automático** — gera lançamentos financeiros conforme a periodicidade (mensal, trimestral, etc.).\n• **Controle de vigência** — datas de início, fim e renovação.\n\nAcesse em [Contratos](/contratos).',
    route: '/contratos',
    relatedIds: ['financeiro-overview']
  },

  // ── APROVAÇÕES DE ARTE ─────────────────────────────────
  {
    id: 'aprovacoes',
    category: 'Aprovações de Arte',
    keywords: ['aprovacao', 'aprovacoes', 'aprovar arte', 'arte', 'design', 'layout', 'enviar arte', 'cliente aprovar', 'link aprovacao', 'aprovacao online', 'nova aprovacao'],
    question: 'Como funciona o módulo de Aprovações?',
    answer: 'O módulo de **Aprovações de Arte** permite enviar layouts/artes para aprovação digital:\n\n1. Acesse [Aprovações](/aprovacoes) e clique em **"Nova Aprovação"**.\n2. Vincule a uma OS ou orçamento.\n3. Faça upload do arquivo de arte (imagem ou PDF).\n4. O sistema gera um **link público exclusivo** para o cliente.\n5. O cliente visualiza e pode **aprovar** ou **reprovar** com comentários.\n6. Você recebe notificação quando o cliente responde.\n\n💡 O link funciona sem login — ideal para enviar por WhatsApp ou e-mail!',
    route: '/aprovacoes',
    relatedIds: ['orcamento-overview', 'os-overview']
  },

  // ── CALCULADORAS ───────────────────────────────────────
  {
    id: 'calculadoras',
    category: 'Calculadoras',
    keywords: ['calculadora', 'calculadoras', 'metro quadrado', 'm2', 'm²', 'aproveitamento', 'calcular', 'consumo', 'retalho', 'corte', 'sangria'],
    question: 'Como funcionam as Calculadoras?',
    answer: 'As **Calculadoras Avançadas** ajudam a estimar custos:\n\n• **Calculadora de ACM** — aproveitamento ideal de chapas, evitando retalhos.\n• **Calculadora de impressão** — consumo de tinta por m² e custo.\n• **Calculadora de vinil/lona** — aproveitamento de bobinas e rolos.\n• **Calculadora de estrutura** — custo de corte e soldagem de perfis metálicos.\n• **Calculadora de m²** — converte medidas e calcula áreas com sangria.\n\nAcesse em [Calculadoras](/calculadoras).',
    route: '/calculadoras',
    relatedIds: ['orcamento-criar', 'estoque-overview']
  },

  // ── COMPARADOR DE PREÇOS ───────────────────────────────
  {
    id: 'comparador',
    category: 'Comparador de Preços',
    keywords: ['comparador', 'comparar preco', 'preco fornecedor', 'melhor preco', 'cotacao fornecedor', 'comparativo', 'comparar fornecedor'],
    question: 'Como funciona o Comparador de Preços?',
    answer: 'O **Comparador de Preços** compara cotações de diferentes fornecedores:\n\n• Selecione o material ou insumo.\n• Veja preços praticados por cada fornecedor cadastrado.\n• Compare por **preço unitário**, **frete** e **prazo de entrega**.\n• Ideal para decisões de compra e negociação.\n\nAcesse em [Comparador de Preços](/comparador).',
    route: '/comparador',
    relatedIds: ['fornecedores', 'estoque-overview']
  },

  // ── MÁQUINAS / EQUIPAMENTOS ────────────────────────────
  {
    id: 'maquinas',
    category: 'Máquinas',
    keywords: ['maquina', 'maquinas', 'equipamento', 'equipamentos', 'impressora', 'router', 'cnc', 'manutencao maquina', 'plotter', 'custo maquina', 'custo hora'],
    question: 'Como funciona a gestão de Máquinas?',
    answer: 'O módulo de **Máquinas** gerencia o parque de equipamentos:\n\n• **Cadastro** — impressoras, plotters, routers CNC, máquinas de corte.\n• **Manutenção** — agende manutenções preventivas e registre corretivas.\n• **Custo operacional** — custo/hora de cada máquina para precificação.\n• **Status** — Operacional, Em Manutenção, Inativa.\n• **Histórico** — todas as intervenções e substituições de peças.\n\nAcesse em [Máquinas](/maquinas).',
    route: '/maquinas',
    relatedIds: ['producao-overview', 'calculadoras']
  },

  // ── VISITAS TÉCNICAS ───────────────────────────────────
  {
    id: 'visitas-overview',
    category: 'Visitas Técnicas',
    keywords: ['visita', 'visitas', 'tecnica', 'levantamento', 'medir', 'campo', 'tecnico', 'checklist', 'fachada', 'assinatura digital', 'visita tecnica'],
    question: 'Como funcionam as Visitas Técnicas?',
    answer: 'O módulo de **Visitas Técnicas** é ideal para levantamentos em campo:\n\n1. Acesse [Visitas Técnicas](/visitas) e clique em **"Nova Visita"**.\n2. Vincule ao cliente e endereço de instalação.\n3. O técnico preenche um **checklist de 17 passos** no celular:\n   • Fotos da fachada e ponto de fixação.\n   • Condições elétricas e croquis.\n   • Medidas detalhadas e tipo de substrato.\n4. O cliente assina digitalmente na tela.\n5. Tudo é salvo em **tempo real** no ERP.\n\nAcesse em [Visitas Técnicas](/visitas).',
    route: '/visitas',
    relatedIds: ['visitas-executar', 'instalacoes', 'clientes-overview']
  },
  {
    id: 'visitas-executar',
    category: 'Visitas Técnicas',
    keywords: ['executar visita', 'fazer visita', 'preencher visita', 'visita campo', 'checklist visita', 'fotos visita', 'croqui', 'agendar visita'],
    question: 'Como executar uma visita técnica?',
    answer: 'Para executar uma visita técnica no local:\n\n1. Acesse [Visitas Técnicas](/visitas) no celular ou tablet.\n2. Selecione a visita agendada e clique em **"Executar"**.\n3. Siga os 17 passos do checklist:\n   • Tire fotos da fachada, pontos de energia, estrutura.\n   • Registre medidas, croquis e observações.\n   • Informe tipo de instalação e dificuldades.\n4. Colha a **assinatura digital** do cliente.\n5. Clique em **"Concluir Visita"** — relatório disponível imediatamente.\n\n💡 Funciona offline! Os dados sincronizam quando houver conexão.',
    route: '/visitas',
    relatedIds: ['visitas-overview', 'instalacoes']
  },

  // ── INSTALAÇÕES ────────────────────────────────────────
  {
    id: 'instalacoes',
    category: 'Instalações',
    keywords: ['instalacao', 'instalacoes', 'instalar', 'montagem', 'equipe instalacao', 'agendar instalacao', 'campo', 'fixacao'],
    question: 'Como funciona o módulo de Instalações?',
    answer: 'O módulo de **Instalações** gerencia todo o processo de montagem em campo:\n\n• **Agendar** — defina data, horário, equipe e local.\n• **Checklist** — etapas obrigatórias com registro fotográfico.\n• **Equipe** — atribua técnicos e veículos.\n• **Status** — Agendada, Em Execução, Concluída, Retrabalho.\n• **Registro** — fotos do antes e depois, assinatura do cliente.\n\nAcesse em [Instalações](/instalacoes).',
    route: '/instalacoes',
    relatedIds: ['producao-overview', 'visitas-overview', 'calendario']
  },

  // ── DOCUMENTOS ─────────────────────────────────────────
  {
    id: 'documentos',
    category: 'Documentos',
    keywords: ['documento', 'documentos', 'arquivo', 'upload', 'anexo', 'pdf', 'gestao documental', 'nota fiscal', 'alvara'],
    question: 'Como funciona a Gestão de Documentos?',
    answer: 'O módulo de **Documentos** centraliza a gestão documental:\n\n• **Upload** — PDFs, imagens, planilhas, contratos.\n• **Categorização** — organize por tipo (contrato, nota fiscal, alvará, projeto).\n• **Busca** — encontre rapidamente pelo nome ou categoria.\n• **Versionamento** — histórico de versões de cada documento.\n• **Compartilhamento** — gere links para envio externo.\n\nAcesse em [Documentos](/documentos).',
    route: '/documentos',
    relatedIds: ['modelos']
  },

  // ── MODELOS / POPs ─────────────────────────────────────
  {
    id: 'modelos',
    category: 'Modelos / POPs',
    keywords: ['modelo', 'modelos', 'pop', 'pops', 'procedimento', 'operacional', 'padrao', 'checklist', 'iso', 'qualidade', 'template'],
    question: 'Como funcionam os Modelos / POPs?',
    answer: 'A aba de **Modelos / POPs** gerencia Procedimentos Operacionais Padrão:\n\n• **Modelos de documentos** — contratos, checklists, termos de entrega.\n• **POPs de produção** — passo-a-passo de cada etapa.\n• **Checklists de qualidade** — auditorias internas e verificações ISO.\n• **Templates reutilizáveis** — crie uma vez e aplique em todas as operações.\n\nAcesse em [Modelos / POPs](/modelos).',
    route: '/modelos',
    relatedIds: ['documentos', 'producao-overview']
  },

  // ── LINKS ÚTEIS ────────────────────────────────────────
  {
    id: 'links',
    category: 'Links Úteis',
    keywords: ['link', 'links', 'atalho', 'atalhos', 'utilitario', 'recurso', 'site', 'ferramenta online', 'links uteis'],
    question: 'Como funcionam os Links Úteis?',
    answer: 'O painel de **Links Úteis** centraliza atalhos compartilhados:\n\n• **Cadastrar links** — sites de fornecedores, geradores de QR Code, fontes.\n• **Categorizar** — Fornecedores, Ferramentas, Referências.\n• **Acesso rápido** — toda a equipe pode acessar.\n• **Editável** — adicione, edite ou remova a qualquer momento.\n\nAcesse em [Links Úteis](/links).',
    route: '/links',
    relatedIds: []
  },

  // ── NOTAS ──────────────────────────────────────────────
  {
    id: 'notas',
    category: 'Notas',
    keywords: ['nota', 'notas', 'lembrete', 'post-it', 'postit', 'recado', 'anotacao', 'mural', 'memo', 'notas rapidas'],
    question: 'Como funcionam as Notas?',
    answer: 'O módulo de **Notas** funciona como um mural de post-its interativo:\n\n• **Criar notas rápidas** — recados, lembretes, anotações.\n• **Cores** — diferencie por cor/prioridade.\n• **Fixar no topo** — destaque notas urgentes.\n• **Compartilhar** — notas visíveis para toda a equipe.\n• **Excluir** — remova quando não forem mais necessárias.\n\nAcesse em [Notas](/notas).',
    route: '/notas',
    relatedIds: []
  },

  // ── RELATÓRIOS ─────────────────────────────────────────
  {
    id: 'relatorios',
    category: 'Relatórios',
    keywords: ['relatorio', 'relatorios', 'exportar', 'metrica', 'indicador', 'analise', 'exportacao', 'excel', 'csv', 'dados'],
    question: 'Como funcionam os Relatórios?',
    answer: 'O módulo de **Relatórios** oferece análises detalhadas:\n\n• **Relatório financeiro** — receitas, despesas e lucro por período.\n• **Relatório de produção** — OSs por status, tempo médio por etapa.\n• **Relatório comercial** — orçamentos por status, taxa de conversão.\n• **Relatório de estoque** — movimentações, itens em baixa.\n• **Exportação** — CSV ou Excel.\n• **Gráficos** — tendências com Chart.js.\n\nAcesse em [Relatórios](/relatorios).',
    route: '/relatorios',
    relatedIds: ['dashboard', 'financeiro-overview', 'chartjs']
  },

  // ── CALENDÁRIO ─────────────────────────────────────────
  {
    id: 'calendario',
    category: 'Calendário',
    keywords: ['calendario', 'agenda', 'evento', 'agendar', 'prazo', 'data', 'compromisso', 'deadline', 'programacao'],
    question: 'Como funciona o Calendário?',
    answer: 'O **Calendário** centraliza todos os compromissos e prazos:\n\n• **Visitas técnicas** — datas agendadas.\n• **Prazos de entrega** — deadlines de OSs e orçamentos.\n• **Instalações** — agendamentos de montagem.\n• **Contratos** — renovações e vencimentos.\n• **Eventos personalizados** — crie lembretes e compromissos.\n• **Visualização** — mensal, semanal e diária.\n\nAcesse em [Calendário](/calendario).',
    route: '/calendario',
    relatedIds: ['visitas-overview', 'instalacoes', 'os-overview']
  },

  // ── CONFIGURAÇÕES ──────────────────────────────────────
  {
    id: 'configuracoes',
    category: 'Configurações',
    keywords: ['configuracao', 'configuracoes', 'configurar', 'ajuste', 'ajustes', 'sistema', 'preferencia', 'conta', 'usuario', 'perfil', 'permissao', 'notificacao', 'email', 'empresa'],
    question: 'Como funcionam as Configurações?',
    answer: 'As **Configurações** permitem personalizar todo o sistema:\n\n• **Dados da empresa** — razão social, CNPJ, logotipo, endereço.\n• **Usuários** — criar, editar e gerenciar contas.\n• **Permissões** — definir o que cada perfil acessa.\n• **Notificações** — alertas por e-mail e no sistema.\n• **Financeiro** — contas bancárias, categorias, centros de custo.\n• **Produção** — etapas do Kanban, tipos de serviço.\n• **Integrações** — ViaCEP, assinatura digital, etc.\n\nAcesse em [Configurações](/configuracoes).',
    route: '/configuracoes',
    relatedIds: ['financeiro-centrocusto']
  },

  // ── INTEGRAÇÕES ────────────────────────────────────────
  {
    id: 'viacep',
    category: 'Integrações',
    keywords: ['viacep', 'cep', 'endereco automatico', 'busca cep', 'integracao cep', 'autocompletar endereco', 'buscar cep', 'consulta cep'],
    question: 'Como funciona o ViaCEP?',
    answer: 'O sistema integra com a API **ViaCEP** para preenchimento automático de endereços:\n\n• Ao digitar um **CEP** em qualquer formulário (clientes, visitas, fornecedores), o sistema preenche automaticamente:\n   - Logradouro (rua)\n   - Bairro\n   - Cidade\n   - Estado (UF)\n\n💡 Basta digitar os 8 dígitos do CEP e aguardar o preenchimento automático!',
    relatedIds: ['clientes-cadastro', 'configuracoes']
  },
  {
    id: 'chartjs',
    category: 'Integrações',
    keywords: ['chart', 'chartjs', 'chart.js', 'grafico', 'graficos', 'pizza', 'barra', 'linha', 'visualizacao dados', 'grafico financeiro'],
    question: 'Como funcionam os gráficos (Chart.js)?',
    answer: 'O sistema utiliza **Chart.js** para visualizações de dados interativas:\n\n• **Dashboard** — gráficos de faturamento, OSs por status, receita vs despesa.\n• **Financeiro** — fluxo de caixa, evolução de receitas e despesas.\n• **Relatórios** — gráficos comparativos e tendências.\n• **Tipos** — barras, linhas, pizza, rosca (doughnut) e área.\n• **Interativos** — passe o mouse para ver detalhes.\n\nOs gráficos são atualizados automaticamente conforme novos dados entram no sistema.',
    relatedIds: ['dashboard', 'relatorios', 'financeiro-overview']
  },

  // ── LOGIN / ACESSO ─────────────────────────────────────
  {
    id: 'login',
    category: 'Acesso',
    keywords: ['login', 'entrar', 'acesso', 'autenticacao', 'senha', 'sair', 'logout', 'deslogar', 'trocar senha', 'esqueci senha'],
    question: 'Como fazer login no sistema?',
    answer: 'Para acessar o ERP:\n\n1. Abra o sistema no navegador.\n2. Na tela de login, insira seu **e-mail** e **senha**.\n3. Clique em **"Entrar"**.\n\nSe esqueceu a senha, entre em contato com o administrador para redefinição.\n\nPara **sair**, clique no menu de usuário no canto superior e selecione **"Sair"**.',
    relatedIds: ['configuracoes']
  },

  // ── FLUXO COMPLETO ─────────────────────────────────────
  {
    id: 'fluxo-completo',
    category: 'Fluxos',
    keywords: ['fluxo', 'processo', 'passo a passo', 'como comeco', 'por onde comeco', 'workflow', 'fluxo completo', 'do inicio ao fim', 'ciclo', 'etapas do sistema', 'como funciona tudo'],
    question: 'Qual é o fluxo completo do sistema?',
    answer: 'O **fluxo completo** do ERP de Comunicação Visual:\n\n1. 📋 **Cadastro do Cliente** → [Clientes](/clientes)\n2. 💰 **Orçamento** → [Orçamentos](/orcamentos) (use as [Calculadoras](/calculadoras))\n3. 🎨 **Aprovação de Arte** → [Aprovações](/aprovacoes) (link para o cliente)\n4. 📝 **Ordem de Serviço** → [Ordens de Serviço](/ordens-servico) (converta o orçamento)\n5. 🏭 **Produção** → [PCP / Kanban](/producao)\n6. 📦 **Estoque** → [Estoque](/estoque) (materiais baixados automaticamente)\n7. 🔧 **Instalação** → [Instalações](/instalacoes) (agende e execute)\n8. 💵 **Financeiro** → [Financeiro](/financeiro) (fature e dê baixa)\n9. 📊 **Relatórios** → [Relatórios](/relatorios) (analise resultados)\n\nCada etapa é integrada — os dados fluem automaticamente!',
    relatedIds: ['dashboard', 'orcamento-overview', 'os-overview', 'producao-overview']
  },

  // ── SOBRE O SISTEMA ────────────────────────────────────
  {
    id: 'o-que-e-sistema',
    category: 'Sobre o Sistema',
    keywords: ['o que e', 'sistema', 'erp', 'comunicacao visual', 'sobre', 'funcionalidades', 'modulos', 'para que serve', 'grafio', 'o que faz'],
    question: 'O que é este sistema?',
    answer: 'Este é o **ERP GRAFIO** — sistema completo de gestão para empresas de comunicação visual, sinalização e gráficas.\n\nPossui **mais de 20 módulos** integrados:\n\n• **Comercial** — Clientes, Orçamentos, Aprovações.\n• **Operacional** — OSs, PCP/Kanban, Instalações.\n• **Suprimentos** — Estoque, Fornecedores, Calculadoras, Comparador.\n• **Financeiro** — Contas a Pagar/Receber, Contratos, Centro de Custos.\n• **Produtividade** — Calendário, Notas, Documentos, Modelos, Links.\n• **Análise** — Dashboard, Relatórios, Gráficos.\n\nPergunte sobre qualquer módulo para saber mais!',
    relatedIds: ['fluxo-completo', 'dashboard']
  },
  {
    id: 'listar-modulos',
    category: 'Sobre o Sistema',
    keywords: ['quais modulos', 'lista modulos', 'todos modulos', 'quais funcionalidades', 'o que tem', 'quais paginas', 'menu', 'navegacao', 'onde fica'],
    question: 'Quais módulos o sistema possui?',
    answer: 'O sistema possui os seguintes módulos:\n\n📊 **Gestão**\n• [Dashboard](/) — Visão geral e KPIs\n• [Relatórios](/relatorios) — Análises e exportações\n• [Calendário](/calendario) — Agenda e prazos\n\n💼 **Comercial**\n• [Clientes](/clientes) — CRM completo\n• [Orçamentos](/orcamentos) — Propostas e precificação\n• [Aprovações](/aprovacoes) — Aprovação de arte online\n\n🏭 **Operacional**\n• [Ordens de Serviço](/ordens-servico) — Gestão de OSs\n• [Produção / Kanban](/producao) — PCP visual\n• [Instalações](/instalacoes) — Montagem em campo\n• [Visitas Técnicas](/visitas) — Levantamentos\n\n📦 **Suprimentos**\n• [Estoque](/estoque) — Controle de insumos\n• [Fornecedores](/fornecedores) — Cadastro de fornecedores\n• [Calculadoras](/calculadoras) — Cálculos de materiais\n• [Comparador](/comparador) — Comparar preços\n• [Máquinas](/maquinas) — Equipamentos\n\n💰 **Financeiro**\n• [Financeiro](/financeiro) — Pagar e receber\n• [Contratos](/contratos) — Recorrência\n\n📁 **Produtividade**\n• [Documentos](/documentos) — Gestão documental\n• [Modelos / POPs](/modelos) — Procedimentos\n• [Links Úteis](/links) — Atalhos\n• [Notas](/notas) — Lembretes\n\n⚙️ [Configurações](/configuracoes) — Personalização do sistema',
    relatedIds: ['o-que-e-sistema', 'fluxo-completo']
  },

  // ── DICAS ──────────────────────────────────────────────
  {
    id: 'dicas',
    category: 'Dicas',
    keywords: ['dica', 'dicas', 'truque', 'produtividade', 'rapido', 'eficiencia', 'como usar melhor'],
    question: 'Dicas de produtividade?',
    answer: 'Aqui vão **dicas de produtividade**:\n\n• 🔍 **Busca rápida** — use a barra de busca em qualquer listagem para filtrar.\n• 📱 **Mobile** — o sistema é responsivo, use no celular em campo.\n• 🔗 **ViaCEP** — digite apenas o CEP para preencher endereços.\n• 📊 **Dashboard** — comece o dia pelo Dashboard para visão geral.\n• 🎨 **Aprovação online** — envie links de arte por WhatsApp.\n• 📋 **Orçamento → OS** — converta com um clique.\n• 📅 **Calendário** — acompanhe prazos e agendamentos.',
    relatedIds: ['fluxo-completo', 'viacep']
  },

  // ── BUSCA E FILTROS ────────────────────────────────────
  {
    id: 'busca-filtro',
    category: 'Funcionalidades',
    keywords: ['buscar', 'busca', 'filtrar', 'filtro', 'pesquisar', 'pesquisa', 'encontrar', 'procurar', 'localizar', 'como achar'],
    question: 'Como buscar e filtrar informações?',
    answer: 'Todas as listagens possuem **busca e filtros**:\n\n• **Barra de busca** — digite para filtrar instantaneamente.\n• **Filtros por status** — Aberto, Pendente, Pago, Concluído, etc.\n• **Filtros por data** — defina período inicial e final.\n• **Filtros por categoria** — tipo, centro de custo ou departamento.\n• **Ordenação** — clique nos cabeçalhos das colunas.\n\nA busca funciona em tempo real conforme você digita.',
    relatedIds: []
  },

  // ── IMPRIMIR/EXPORTAR ──────────────────────────────────
  {
    id: 'imprimir-exportar',
    category: 'Funcionalidades',
    keywords: ['imprimir', 'impressao', 'pdf', 'exportar', 'baixar', 'download', 'enviar', 'compartilhar', 'gerar pdf'],
    question: 'Como imprimir ou exportar dados?',
    answer: 'Para imprimir ou exportar:\n\n• **Orçamentos** — "Imprimir" ou "Gerar PDF" na visualização.\n• **Relatórios** — "Exportar CSV" ou "Exportar Excel".\n• **Documentos** — download direto dos arquivos anexados.\n• **Listagens** — Ctrl+P no navegador para qualquer tela.\n\nOs PDFs gerados seguem a identidade visual configurada em [Configurações](/configuracoes).',
    relatedIds: ['relatorios', 'orcamento-visualizar', 'documentos']
  },

  // ── EXCLUIR / DELETAR ──────────────────────────────────
  {
    id: 'excluir',
    category: 'Funcionalidades',
    keywords: ['excluir', 'deletar', 'remover', 'apagar', 'cancelar', 'desfazer'],
    question: 'Como excluir registros?',
    answer: 'Para excluir ou cancelar registros no sistema:\n\n1. Acesse o módulo desejado (Clientes, Orçamentos, OSs, Financeiro, etc.).\n2. Encontre o registro na listagem.\n3. Abra os detalhes clicando no item.\n4. Clique no botão **"Excluir"** ou **"Cancelar"** (geralmente com ícone de lixeira).\n5. Confirme a exclusão no popup de confirmação.\n\n⚠️ **Atenção**: Alguns registros vinculados (ex: OS com lançamentos financeiros) podem ter restrições de exclusão. Nesse caso, opte por **cancelar** em vez de excluir.',
    relatedIds: []
  },

  // ── SAUDAÇÕES ──────────────────────────────────────────
  {
    id: 'saudacao',
    category: 'Interação',
    keywords: ['ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'e ai', 'eai', 'tudo bem', 'hello', 'hi', 'hey', 'fala'],
    question: 'Saudação',
    answer: 'Olá! 👋 Sou o **GRAFIO AI**, seu assistente do ERP de Comunicação Visual.\n\nPosso ajudar com qualquer dúvida sobre o sistema! Exemplos:\n\n• "Como criar um orçamento?"\n• "Como funciona o Kanban?"\n• "Como dar baixa no financeiro?"\n• "Como executar uma visita técnica?"\n• "Quais módulos o sistema possui?"\n\nDigite sua pergunta! 😊',
    relatedIds: ['o-que-e-sistema', 'fluxo-completo', 'listar-modulos']
  },
  {
    id: 'obrigado',
    category: 'Interação',
    keywords: ['obrigado', 'obrigada', 'valeu', 'agradeco', 'thanks', 'vlw', 'show', 'perfeito', 'entendi', 'massa', 'top'],
    question: 'Agradecimento',
    answer: 'De nada! 😊 Fico feliz em ajudar. Se tiver mais alguma dúvida sobre qualquer módulo, é só perguntar! Estou sempre aqui.',
    relatedIds: []
  },
  {
    id: 'nao-entendi',
    category: 'Interação',
    keywords: ['nao entendi', 'como assim', 'explica melhor', 'pode repetir', 'nao compreendi', 'me explica', 'nao sei'],
    question: 'Pedido de explicação',
    answer: 'Claro! Me diga sobre qual módulo ou funcionalidade quer saber mais. Exemplos:\n\n• "Como funciona o **Financeiro**?"\n• "Como criar um **Orçamento**?"\n• "O que é o **PCP**?"\n• "Como dar baixa em uma **conta a receber**?"\n• "Quais módulos existem?"\n\nQuanto mais detalhada a pergunta, melhor consigo ajudar! 😊',
    relatedIds: ['o-que-e-sistema', 'fluxo-completo', 'listar-modulos']
  },
  {
    id: 'ajuda',
    category: 'Interação',
    keywords: ['ajuda', 'help', 'socorro', 'me ajuda', 'preciso ajuda', 'nao sei usar', 'como usar'],
    question: 'Preciso de ajuda!',
    answer: 'Estou aqui para ajudar! 🤝\n\nVocê pode me perguntar sobre **qualquer funcionalidade** do sistema:\n\n• **"Como criar..."** — orçamento, OS, cliente, lançamento, visita...\n• **"Como funciona..."** — qualquer módulo do sistema.\n• **"Onde fica..."** — encontrar uma funcionalidade específica.\n• **"O que é..."** — entender termos e conceitos.\n• **"Quais módulos..."** — ver lista completa de funcionalidades.\n\nDigite sua dúvida e eu respondo na hora!',
    relatedIds: ['listar-modulos', 'fluxo-completo', 'dicas']
  }
];

/* ═══════════════════════════════════════════════════════════
   SEARCH ENGINE — fuzzy scoring with accent normalisation
   ═══════════════════════════════════════════════════════════ */

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text).split(' ').filter(t => t.length > 1);
}

function scoreEntry(query: string, entry: KnowledgeEntry): number {
  const nq = normalizeText(query);
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;

  let total = 0;

  for (const keyword of entry.keywords) {
    const nk = normalizeText(keyword);

    // Exact full match
    if (nq === nk) { total += 100; continue; }

    // Query contains keyword
    if (nq.includes(nk) && nk.length > 2) {
      total += 50 + nk.length;
      continue;
    }

    // Keyword contains query
    if (nk.includes(nq) && nq.length > 2) {
      total += 40;
      continue;
    }

    // Token-level matching
    const keywordTokens = tokenize(keyword);
    for (const qt of queryTokens) {
      for (const kt of keywordTokens) {
        if (qt === kt) {
          total += 12;
        } else if (qt.length >= 3 && (kt.startsWith(qt) || qt.startsWith(kt))) {
          total += 7;
        } else if (qt.length >= 4 && (kt.includes(qt) || qt.includes(kt))) {
          total += 4;
        }
      }
    }
  }

  // Check question text
  const nQuestion = normalizeText(entry.question);
  for (const qt of queryTokens) {
    if (qt.length >= 3 && nQuestion.includes(qt)) total += 5;
  }

  // Light check on answer (only long tokens)
  const nAnswer = normalizeText(entry.answer);
  for (const qt of queryTokens) {
    if (qt.length >= 5 && nAnswer.includes(qt)) total += 2;
  }

  return total;
}

interface ScoredEntry { entry: KnowledgeEntry; score: number; }

function findBestResponses(query: string): ScoredEntry[] {
  return knowledgeBase
    .map(entry => ({ entry, score: scoreEntry(query, entry) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

function getBotResponse(query: string): { text: string; suggestions: string[] } {
  const cleanQuery = query.toLowerCase().trim();
  const scored = findBestResponses(query);

  // Check for specialized intents first if no strong keyword match
  if (scored.length === 0 || scored[0].score < 5) {
    // 1. CorelDraw & File Conversion Intent
    if (cleanQuery.includes('corel') || cleanQuery.includes('cdr') || cleanQuery.includes('vers') || cleanQuery.includes('antig') || cleanQuery.includes('salvar') || cleanQuery.includes('abrir') || cleanQuery.includes('extens')) {
      return {
        text: '🎨 **Conversão de Versões do CorelDraw & Vetores**\n\nIdentifiquei que você quer saber sobre conversão de arquivos ou compatibilidade do Corel!\n\nNo GRAFIO ERP, implementamos um **motor de conversão de cabeçalho** no módulo de [Mockups & Converter](/mockups-converter) que resolve exatamente esse problema:\n\n1. Você faz o upload de um arquivo **.CDR recente** (versão 2020 a 2024).\n2. Seleciona o formato de saída como **CorelDraw (Versão Legada)**.\n3. Escolhe a versão antiga desejada (por exemplo, **CorelDraw X7 (v17)** ou **CorelDraw X5 (v15)**).\n4. O sistema rebaixa a assinatura binária e exporta o arquivo pronto para download.\n5. Também suportamos conversões para **SVG (vetor limpo)**, **DXF (para corte Router CNC)**, **PDF editável** e **EPS**.\n\nAcesse o [Conversor de Arquivos](/mockups-converter) para testar agora!',
        suggestions: [
          'Como funciona o Conversor?',
          'Quais formatos o sistema converte?',
          'Como gerar Mockup com IA?'
        ]
      };
    }

    // 2. Pricing & Cost Calculations Intent
    if (cleanQuery.includes('custo') || cleanQuery.includes('calcul') || cleanQuery.includes('prec') || cleanQuery.includes('acm') || cleanQuery.includes('mdf') || cleanQuery.includes('cnc') || cleanQuery.includes('router') || cleanQuery.includes('lona') || cleanQuery.includes('adesiv') || cleanQuery.includes('margem')) {
      return {
        text: '💰 **Precificação Inteligente & Custos Industriais**\n\nPara calcular o preço de venda de forma precisa em comunicação visual (como Fachadas ACM, Letreiros, Adesivação):\n\n• **Precificação Inteligente** ([Acessar](/precificacao)) — Permite calcular o custo com base no custo-hora das máquinas (Router CNC, Impressoras), tempo de produção, insumos/matéria-prima utilizados e margem de lucro desejada. Possui também um **Assistente de IA** integrado para analisar se a margem está saudável.\n• **Calculadoras Rápidas** ([Acessar](/calculadoras)) — Úteis para obter o preço de venda bruto por metro quadrado de lonas e placas rapidamente.\n\nRecomendo preencher a ficha de custos de materiais e o valor da hora/máquina nas configurações do sistema para obter cálculos perfeitos!',
        suggestions: [
          'Como funciona a Precificação Inteligente?',
          'Onde cadastro o custo de hora/máquina?',
          'Como calcular metro quadrado?'
        ]
      };
    }

    // 3. CRM & WhatsApp Charging Intent
    if (cleanQuery.includes('crm') || cleanQuery.includes('funil') || cleanQuery.includes('lead') || cleanQuery.includes('oportunidade') || cleanQuery.includes('whatsapp') || cleanQuery.includes('cobrar') || cleanQuery.includes('mensagem')) {
      return {
        text: '🔥 **CRM Comercial & Cobrança via WhatsApp**\n\nO CRM do sistema conta com um **Funil / Kanban Comercial** interativo ([Acessar](/crm)) para gerenciar seus contatos:\n\n• **Fases do Funil** — Acompanhe leads desde "Novo Lead" até "Fechado Ganho/Perdido".\n• **Follow-up Recomendado** — O painel inicial do [Dashboard](/) identifica orçamentos parados há dias e sugere ações.\n• **Cobrança Expressa via WhatsApp** — Ao clicar em **"Cobrar via WhatsApp"** (no Dashboard ou no CRM), o sistema monta uma mensagem personalizada e abre automaticamente o **WhatsApp Web** (no computador) ou o aplicativo do WhatsApp (no celular) para contato imediato.\n\nExperimente gerenciar as oportunidades em [CRM / Funil](/crm).',
        suggestions: [
          'Como enviar cobrança por WhatsApp?',
          'Como movimentar leads no Kanban?',
          'Como cadastrar novos clientes?'
        ]
      };
    }

    // 4. Nesting / Simulador Industrial Intent
    if (cleanQuery.includes('nesting') || cleanQuery.includes('otimiz') || cleanQuery.includes('aproveit') || cleanQuery.includes('chapa') || cleanQuery.includes('corte') || cleanQuery.includes('placa')) {
      return {
        text: '⚙️ **Simulador Industrial & Otimização de Chapas (Nesting)**\n\nPara evitar o desperdício de materiais caros como chapas de ACM, acrílico, MDF ou chapas galvanizadas:\n\n1. Acesse o [Simulador Industrial](/simulador-industrial).\n2. Insira o tamanho da chapa bruta (ex: 3000x1500mm).\n3. Insira as dimensões das peças que precisa cortar e a quantidade.\n4. O motor geométrico calcula o **aproveitamento ideal**, organizando as peças e reduzindo sobras.\n5. O sistema exibe um preview visual do plano de corte e a porcentagem de aproveitamento útil.\n\nAcesse o [Simulador de Chapas](/simulador-industrial) para otimizar seus cortes!',
        suggestions: [
          'Como usar o Simulador Industrial?',
          'Posso exportar o plano de corte?',
          'Quais materiais posso otimizar?'
        ]
      };
    }

    // 5. BI & Financial Dashboard Intent
    if (cleanQuery.includes('bi') || cleanQuery.includes('mrr') || cleanQuery.includes('churn') || cleanQuery.includes('dashboard exec') || cleanQuery.includes('relatori') || cleanQuery.includes('fatur')) {
      return {
        text: '📊 **BI Executivo & Relatórios Estratégicos**\n\nOferecemos duas visões principais para acompanhamento de métricas financeiras e de produção:\n\n• **BI Executivo** ([Acessar](/executive-dashboard)) — Indicadores de alto nível para fundadores e gerentes: receita mensal recorrente (MRR), taxa de cancelamento (Churn), ticket médio, taxa de conversão de orçamentos e capacidade instalada das máquinas.\n• **Relatórios Gerais** ([Acessar](/relatorios)) — Relatórios operacionais detalhados de faturamento por período, vendas por vendedor, consumo de estoque e ordens de serviço concluídas.\n\nConsulte o [BI Executivo](/executive-dashboard) para uma análise de saúde do negócio.',
        suggestions: [
          'O que é MRR e Churn no painel?',
          'Como funciona o BI Executivo?',
          'Como gerar relatório de vendas?'
        ]
      };
    }


    // 7. Small talk & greetings
    if (cleanQuery.includes('ola') || cleanQuery.includes('oi') || cleanQuery.includes('bom dia') || cleanQuery.includes('boa tarde') || cleanQuery.includes('boa noite') || cleanQuery.includes('tudo bem') || cleanQuery.includes('ajuda')) {
      return {
        text: 'Olá! 😊 Sou o **GRAFIO AI**, assistente virtual de inteligência e suporte do ERP.\n\nEstou aqui para te ajudar a operar o sistema de ponta a ponta. Você pode me perguntar sobre:\n\n• **Conversão de arquivos do CorelDraw** (versões antigas)\n• **Precificação Inteligente** (custo-hora e insumos)\n• **Otimização de chapas (Nesting)**\n• **Cobrança via WhatsApp** no CRM\n• **BI Executivo** e Relatórios\n\nComo posso te ajudar hoje?',
        suggestions: [
          'Como rebaixar arquivo do Corel?',
          'Como funciona a Precificação?',
          'O que faz o Simulador Industrial?'
        ]
      };
    }

    // Generic Fallback (slightly improved)
    return {
      text: 'Entendi a sua dúvida! Embora eu não tenha encontrado um artigo exato para a frase digitada, posso te dar suporte em qualquer área do sistema. 🚀\n\nSelecione um dos tópicos principais ou tente reformular a pergunta usando palavras-chave como **Corel**, **Orçamento**, **WhatsApp**, **Plano de corte**, **Financeiro** ou **Kanban**.',
      suggestions: [
        'Como funciona o Conversor de Corel?',
        'Como funciona o CRM / WhatsApp?',
        'O que o Simulador de corte faz?'
      ]
    };
  }

  const primary = scored[0];
  let text = primary.entry.answer;

  // Include secondary if different category and score close enough
  const secondary = scored.length > 1
    && scored[1].score >= Math.max(primary.score * 0.45, 10)
    && scored[1].entry.category !== primary.entry.category
    ? scored[1]
    : undefined;

  if (secondary) {
    text += `\n\n---\n\n📌 **Relacionado — ${secondary.entry.question}**\n\n${secondary.entry.answer}`;
  }

  // Build suggestions from related entries
  const suggestions: string[] = [];
  const seen = new Set<string>([primary.entry.id, secondary?.entry.id].filter((x): x is string => !!x));
  const relatedIds = [
    ...(primary.entry.relatedIds || []),
    ...(secondary?.entry.relatedIds || [])
  ];

  for (const rid of relatedIds) {
    if (seen.has(rid)) continue;
    seen.add(rid);
    const entry = knowledgeBase.find(e => e.id === rid);
    if (entry && suggestions.length < 3) {
      suggestions.push(entry.question);
    }
  }

  // Fill remaining with smart defaults
  if (suggestions.length < 2) {
    const defaults = ['Quais módulos o sistema possui?', 'Qual é o fluxo completo do sistema?', 'Dicas de produtividade?'];
    for (const d of defaults) {
      if (suggestions.length >= 3) break;
      if (!suggestions.includes(d)) suggestions.push(d);
    }
  }

  return { text, suggestions };
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Olá! Sou o **GRAFIO AI**, seu assistente virtual de ajuda. Estou pronto para tirar dúvidas sobre **qualquer módulo, funcionalidade ou processo** do ERP de Comunicação Visual.\n\nPergunte o que quiser — desde como criar um orçamento até como dar baixa no financeiro! 🚀',
      suggestions: [
        'Quais módulos o sistema possui?',
        'Qual é o fluxo completo do sistema?',
        'Como criar um orçamento?',
        'Como funciona o PCP / Kanban?',
        'Como dar baixa no financeiro?',
        'Dicas de produtividade?'
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const toggleChat = () => setIsOpen(prev => !prev);

  /* ── Markdown-like rendering ────────────────────────── */
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) elements.push(<br key={`br-${lineIdx}`} />);

      // Parse links [Label](path) and bold **text**
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(...parseBoldText(line.substring(lastIndex, match.index), `${lineIdx}-${lastIndex}`));
        }
        parts.push(
          <Link key={`link-${lineIdx}-${match.index}`} to={match[2]}>
            {match[1]}
          </Link>
        );
        lastIndex = linkRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(...parseBoldText(line.substring(lastIndex), `${lineIdx}-${lastIndex}`));
      }

      elements.push(<React.Fragment key={`line-${lineIdx}`}>{parts}</React.Fragment>);
    });

    return elements;
  };

  const parseBoldText = (chunk: string, keyPrefix: string): React.ReactNode[] => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(chunk)) !== null) {
      if (match.index > lastIndex) {
        parts.push(chunk.substring(lastIndex, match.index));
      }
      parts.push(<strong key={`bold-${keyPrefix}-${match.index}`}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < chunk.length) {
      parts.push(chunk.substring(lastIndex));
    }

    return parts;
  };

  /* ── Handlers ───────────────────────────────────────── */
  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay (proportional to answer length, 800-2000ms)
    const delay = Math.min(800 + Math.random() * 600, 2000);
    setTimeout(() => {
      const response = getBotResponse(text);
      const botMessage: Message = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: response.text,
        suggestions: response.suggestions
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, delay);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const handleSuggestionClick = (question: string) => {
    handleSend(question);
  };

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="chatbot-container">
      {/* FAB */}
      <button className="chatbot-fab" onClick={toggleChat} title="Ajuda &amp; Dúvidas">
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && <span className="chatbot-fab-badge" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-bot-info">
              <div className="chatbot-bot-avatar">
                <Bot size={20} />
              </div>
              <div className="chatbot-bot-meta">
                <span className="chatbot-bot-name">GRAFIO AI</span>
                <span className="chatbot-bot-status">
                  <span className="chatbot-status-dot" /> Online
                </span>
              </div>
            </div>
            <button className="chatbot-close-btn" onClick={toggleChat} title="Fechar">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((m) => (
              <div key={m.id} className={`chatbot-message-row ${m.sender}`}>
                <div className={`chatbot-bubble ${m.sender}`}>
                  {renderMessageContent(m.text)}

                  {/* Dynamic suggestion chips */}
                  {m.sender === 'bot' && m.suggestions && m.suggestions.length > 0 && (
                    <div className="chatbot-chips-container">
                      <span className="chatbot-chips-title">
                        {m.id === 'welcome' ? 'Perguntas populares:' : 'Perguntas relacionadas:'}
                      </span>
                      {m.suggestions.map((s, i) => (
                        <button
                          key={`chip-${m.id}-${i}`}
                          className="chatbot-chip"
                          onClick={() => handleSuggestionClick(s)}
                        >
                          <span>{s}</span>
                          <ChevronRight size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing animation */}
            {isTyping && (
              <div className="chatbot-message-row bot">
                <div className="chatbot-bubble bot" style={{ padding: '0.5rem 0.75rem' }}>
                  <div className="chatbot-typing">
                    <span className="chatbot-typing-dot" />
                    <span className="chatbot-typing-dot" />
                    <span className="chatbot-typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chatbot-input-form" onSubmit={handleSubmit}>
            <div className="chatbot-input-wrap">
              <input
                type="text"
                className="chatbot-input"
                placeholder="Pergunte qualquer coisa sobre o ERP..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isTyping}
              />
            </div>
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={!inputValue.trim() || isTyping}
              title="Enviar"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
