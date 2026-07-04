export interface Representada {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  comissaoPadrao: number; // Porcentagem, ex: 5% -> 5
  telefone: string;
  email: string;
  segmento: string;
  contato: string;
}

export interface Cliente {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
  contato: string;
}

export interface OrderItem {
  id: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  totalItem: number;
}

export type PedidoStatus = 'Rascunho' | 'Pendente' | 'Faturado' | 'Pago' | 'Cancelado';

export interface Pedido {
  id: string;
  numeroPedido: string;
  clienteId: string;
  representadaId: string;
  dataPedido: string; // YYYY-MM-DD
  itens: OrderItem[];
  valorTotal: number;
  comissaoPercentual: number; // Porcentagem de comissão deste pedido
  valorComissao: number; // Calculado: valorTotal * (comissaoPercentual / 100)
  status: PedidoStatus;
  observacoes?: string;
}

export interface MetaVendas {
  metaMensal: number;
  anoMes: string; // Formato YYYY-MM
}

export interface Produto {
  id: string;
  codigo: string;         // SKU ou Código interno
  nome: string;           // Nome do produto
  representadaId: string; // ID da representada fabricante
  precoVenda: number;     // Preço sugerido de venda
  unidade: string;        // Unidade (Un, Cx, Kg, FD, etc.)
  descricao?: string;     // Detalhes ou especificações
  ativo: boolean;         // Se o produto está disponível para venda
}

