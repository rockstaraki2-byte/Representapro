import React, { useState, useEffect } from 'react';
import { Pedido, Cliente, Representada, OrderItem, PedidoStatus } from '../types';
import { formatarMoeda, formatarData } from '../utils';
import { Plus, Trash2, Edit3, Eye, FileText, Check, Percent, AlertCircle, ShoppingCart, Mail, Send, Printer, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gerarPedidoPDF, gerarResumoMensalPDF } from '../lib/pdfGenerator';

interface PedidosTabProps {
  pedidos: Pedido[];
  clientes: Cliente[];
  representadas: Representada[];
  activePedidoToEdit: Pedido | null;
  onClearActiveEdit: () => void;
  onAdd: (pedido: Pedido) => void;
  onEdit: (pedido: Pedido) => void;
  onDelete: (id: string) => void;
}

export default function PedidosTab({
  pedidos,
  clientes,
  representadas,
  activePedidoToEdit,
  onClearActiveEdit,
  onAdd,
  onEdit,
  onDelete,
}: PedidosTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Form states
  const [numeroPedido, setNumeroPedido] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [representadaId, setRepresentadaId] = useState('');
  const [dataPedido, setDataPedido] = useState(new Date().toISOString().split('T')[0]);
  const [itens, setItens] = useState<OrderItem[]>([]);
  const [comissaoPercentual, setComissaoPercentual] = useState<number>(5);
  const [status, setStatus] = useState<PedidoStatus>('Pendente');
  const [observacoes, setObservacoes] = useState('');

  // Item form states
  const [itemDescricao, setItemDescricao] = useState('');
  const [itemQuantidade, setItemQuantidade] = useState<number>(1);
  const [itemPreco, setItemPreco] = useState<number>(0);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Modal and Email states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [emailPedido, setEmailPedido] = useState<Pedido | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Load order for editing if triggered from props
  useEffect(() => {
    if (activePedidoToEdit) {
      handleLoadForEdit(activePedidoToEdit);
      onClearActiveEdit(); // Clear parent trigger
    }
  }, [activePedidoToEdit]);

  // Sync default commission % when represented company is selected (only when creating)
  const handleRepresentadaChange = (id: string) => {
    setRepresentadaId(id);
    if (!editingId) {
      const repSelected = representadas.find(r => r.id === id);
      if (repSelected) {
        setComissaoPercentual(repSelected.comissaoPadrao);
      }
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDescricao.trim()) {
      alert('Preencha a descrição do produto.');
      return;
    }
    if (itemQuantidade <= 0) {
      alert('A quantidade do item deve ser maior que zero.');
      return;
    }
    if (itemPreco < 0) {
      alert('O preço unitário não pode ser negativo.');
      return;
    }

    const novoItem: OrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(5)}`,
      descricao: itemDescricao.trim(),
      quantidade: itemQuantidade,
      precoUnitario: itemPreco,
      totalItem: itemQuantidade * itemPreco
    };

    setItens([...itens, novoItem]);
    setItemDescricao('');
    setItemQuantidade(1);
    setItemPreco(0);
  };

  const handleRemoveItem = (id: string) => {
    setItens(itens.filter(it => it.id !== id));
  };

  const resetForm = () => {
    setEditingId(null);
    setNumeroPedido('');
    setClienteId('');
    setRepresentadaId('');
    setDataPedido(new Date().toISOString().split('T')[0]);
    setItens([]);
    setComissaoPercentual(5);
    setStatus('Pendente');
    setObservacoes('');
    setValidationError(null);
    setIsFormOpen(false);
  };

  const handleLoadForEdit = (p: Pedido) => {
    setEditingId(p.id);
    setNumeroPedido(p.numeroPedido);
    setClienteId(p.clienteId);
    setRepresentadaId(p.representadaId);
    setDataPedido(p.dataPedido);
    setItens(p.itens || []);
    setComissaoPercentual(p.comissaoPercentual);
    setStatus(p.status);
    setObservacoes(p.observacoes || '');
    setValidationError(null);
    setIsFormOpen(true);
  };

  const handleOpenEmailModal = (p: Pedido) => {
    const cli = clientes.find(c => c.id === p.clienteId);
    const rep = representadas.find(r => r.id === p.representadaId);
    setEmailPedido(p);
    setEmailRecipient(cli?.email || '');
    setEmailSubject(`Pedido de Venda #${p.numeroPedido} - ${rep?.nomeFantasia || 'Representada'}`);
    setEmailBody(`Prezado(a) ${cli?.contato || 'Cliente'},\n\nSegue em anexo a cópia digital do Pedido de Venda #${p.numeroPedido}.\n\nResumo Financeiro:\nValor Total: ${formatarMoeda(p.valorTotal)}\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\nRepresentação Comercial`);
    setEmailSuccess(false);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSuccess(true);
      setTimeout(() => {
        setEmailPedido(null);
      }, 1500);
    }, 1500);
  };

  const handleSubmitPedido = (e: React.FormEvent) => {
    e.preventDefault();

    if (!numeroPedido.trim() || !clienteId || !representadaId) {
      setValidationError('Por favor, preencha o número do pedido, selecione o cliente e selecione a representada.');
      return;
    }

    if (itens.length === 0) {
      setValidationError('Adicione pelo menos um produto/item ao pedido.');
      return;
    }

    const totalPedido = itens.reduce((sum, item) => sum + item.totalItem, 0);
    const percComissao = parseFloat(String(comissaoPercentual));

    if (isNaN(percComissao) || percComissao < 0 || percComissao > 100) {
      setValidationError('A porcentagem de comissão deve estar entre 0 e 100.');
      return;
    }

    const valorComissaoCalculado = totalPedido * (percComissao / 100);

    const finalPedido: Pedido = {
      id: editingId || `ped-${Date.now()}`,
      numeroPedido: numeroPedido.trim(),
      clienteId,
      representadaId,
      dataPedido,
      itens,
      valorTotal: totalPedido,
      comissaoPercentual: percComissao,
      valorComissao: valorComissaoCalculado,
      status,
      observacoes: observacoes.trim() || undefined,
    };

    if (editingId) {
      onEdit(finalPedido);
    } else {
      onAdd(finalPedido);
    }

    resetForm();
  };

  // Filter orders based on queries
  const pedidosFiltrados = pedidos.filter(p => {
    const cli = clientes.find(c => c.id === p.clienteId);
    const rep = representadas.find(r => r.id === p.representadaId);
    
    const matchesSearch = 
      p.numeroPedido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cli && cli.nomeFantasia.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rep && rep.nomeFantasia.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCalculadoForm = itens.reduce((sum, item) => sum + item.totalItem, 0);
  const valorComissaoForm = totalCalculadoForm * (comissaoPercentual / 100);

  return (
    <div className="space-y-6">
      
      {/* Top action bar to trigger new order modal */}
      <div className="flex justify-between items-center bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-slate-800">Emissão de Pedidos de Venda</h3>
            <p className="text-[11px] text-slate-400">Gere novos pedidos de faturamento e envie comissões automáticas para sua carteira.</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-100"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pedido</span>
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-5xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-2 text-emerald-800">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-serif font-bold text-base text-slate-800">
                    {editingId ? `Editar Pedido #${numeroPedido}` : 'Gerar e Emitir Novo Pedido'}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  <span className="font-bold text-lg">&times;</span>
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-4">
                {validationError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-100">
                    {validationError}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Dados Gerais do Pedido */}
                  <form onSubmit={handleSubmitPedido} id="ped-form-elem" className="lg:col-span-8 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Código/Nº do Pedido */}
                      <div className="space-y-1">
                        <label className="block text-xs font-mono uppercase text-slate-500">Número do Pedido <span className="text-red-500">*</span></label>
                        <input 
                          type="text"
                          placeholder="Ex: 20455 ou 1002-A"
                          value={numeroPedido}
                          onChange={(e) => setNumeroPedido(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 font-bold"
                        />
                      </div>

                      {/* Data do Pedido */}
                      <div className="space-y-1">
                        <label className="block text-xs font-mono uppercase text-slate-500">Data de Emissão <span className="text-red-500">*</span></label>
                        <input 
                          type="date"
                          value={dataPedido}
                          onChange={(e) => setDataPedido(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 font-mono"
                        />
                      </div>

                      {/* Cliente */}
                      <div className="space-y-1">
                        <label className="block text-xs font-mono uppercase text-slate-500">Cliente (Comprador) <span className="text-red-500">*</span></label>
                        <select 
                          value={clienteId}
                          onChange={(e) => setClienteId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 cursor-pointer"
                        >
                          <option value="">-- Selecione o Cliente --</option>
                          {clientes.map(c => (
                            <option key={c.id} value={c.id}>{c.nomeFantasia} ({c.cidade}-{c.uf})</option>
                          ))}
                        </select>
                      </div>

                      {/* Representada */}
                      <div className="space-y-1">
                        <label className="block text-xs font-mono uppercase text-slate-500">Representada (Fábrica) <span className="text-red-500">*</span></label>
                        <select 
                          value={representadaId}
                          onChange={(e) => handleRepresentadaChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 cursor-pointer"
                        >
                          <option value="">-- Selecione a Representada --</option>
                          {representadas.map(r => (
                            <option key={r.id} value={r.id}>{r.nomeFantasia} ({r.comissaoPadrao}% comissão padrão)</option>
                          ))}
                        </select>
                      </div>

                      {/* Porcentagem Comissão */}
                      <div className="space-y-1">
                        <label className="block text-xs font-mono uppercase text-slate-500">Comissão Ajustada (%)</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            placeholder="5.0"
                            value={comissaoPercentual}
                            onChange={(e) => setComissaoPercentual(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 font-mono font-bold"
                          />
                          <span className="text-xs font-mono text-slate-400 font-semibold shrink-0">Comissão</span>
                        </div>
                      </div>

                      {/* Status do Pedido */}
                      <div className="space-y-1">
                        <label className="block text-xs font-mono uppercase text-slate-500">Status do Pedido <span className="text-red-500">*</span></label>
                        <select 
                          value={status}
                          onChange={(e) => setStatus(e.target.value as PedidoStatus)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 cursor-pointer font-bold"
                        >
                          <option value="Rascunho">Rascunho</option>
                          <option value="Pendente">Pendente (Liberação Fábrica)</option>
                          <option value="Faturado">Faturado (Fábrica enviou)</option>
                          <option value="Pago">Comissão Recebida (Pago)</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </div>

                    </div>

                    {/* Observações */}
                    <div className="space-y-1">
                      <label className="block text-xs font-mono uppercase text-slate-500">Observações de Faturamento / Condições de Pagamento</label>
                      <textarea 
                        rows={2}
                        placeholder="Ex: Faturar para 30/60 dias. Enviar via transportadora indicada."
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 resize-none leading-relaxed"
                      />
                    </div>

                    {/* Tabela de Itens Adicionados */}
                    <div className="space-y-1.5 pt-2">
                      <span className="block text-xs font-mono uppercase text-slate-500">Produtos no Pedido ({itens.length})</span>
                      <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/30">
                        {itens.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400 italic">
                            Nenhum produto adicionado. Use o painel lateral direito para cadastrar itens!
                          </div>
                        ) : (
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-mono text-[9px] border-b border-slate-100">
                                <th className="p-2.5 pl-3">Descrição do Produto</th>
                                <th className="p-2.5 text-center">Qtd</th>
                                <th className="p-2.5 text-right">Preço Unitário</th>
                                <th className="p-2.5 text-right">Subtotal</th>
                                <th className="p-2.5 text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {itens.map(it => (
                                <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="p-2.5 pl-3 font-serif text-slate-700 font-bold">{it.descricao}</td>
                                  <td className="p-2.5 text-center font-mono font-bold text-slate-600">{it.quantidade}</td>
                                  <td className="p-2.5 text-right font-mono text-slate-600">{formatarMoeda(it.precoUnitario)}</td>
                                  <td className="p-2.5 text-right font-mono text-slate-700 font-bold">{formatarMoeda(it.totalItem)}</td>
                                  <td className="p-2.5 text-center">
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveItem(it.id)}
                                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                                      title="Remover Item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </form>

                  {/* Adicionador de Itens lateral */}
                  <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 p-5 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-3 border-b border-slate-200 pb-2">
                        <ShoppingCart className="w-4 h-4 text-emerald-600" />
                        <span>Inserir Item / Produto</span>
                      </h4>
                      
                      <form onSubmit={handleAddItem} className="space-y-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase text-slate-500">Descrição do Produto</label>
                          <input 
                            type="text"
                            placeholder="Ex: Bobina de Cabo Elétrico 100m"
                            value={itemDescricao}
                            onChange={(e) => setItemDescricao(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600 text-slate-850"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-mono uppercase text-slate-500">Quantidade</label>
                            <input 
                              type="number"
                              min="1"
                              value={itemQuantidade}
                              onChange={(e) => setItemQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600 text-slate-850 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-mono uppercase text-slate-500">P. Unitário (R$)</label>
                            <input 
                              type="number"
                              step="any"
                              min="0"
                              placeholder="0.00"
                              value={itemPreco === 0 ? '' : itemPreco}
                              onChange={(e) => setItemPreco(parseFloat(e.target.value) || 0)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600 text-slate-850 font-mono font-bold"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar ao Carrinho</span>
                        </button>
                      </form>
                    </div>

                    {/* Painel Financeiro Dinâmico */}
                    <div className="mt-5 pt-4 border-t border-slate-200 space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal Produtos:</span>
                        <span className="text-slate-800 font-bold">{formatarMoeda(totalCalculadoForm)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 border-b border-dashed border-slate-200 pb-2">
                        <span>Comissão ({comissaoPercentual}%):</span>
                        <span className="text-emerald-700 font-bold">{formatarMoeda(valorComissaoForm)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span className="font-bold">Total Faturado:</span>
                        <span className="text-slate-900 font-extrabold text-sm">{formatarMoeda(totalCalculadoForm)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                <div className="text-left font-mono">
                  <span className="text-[9px] text-slate-400 block uppercase">Resumo Financeiro</span>
                  <span className="text-xs text-slate-600 font-bold">Total: <strong className="text-emerald-700 text-sm">{formatarMoeda(totalCalculadoForm)}</strong></span>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    Fechar / Cancelar
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const formElem = document.getElementById('ped-form-elem') as HTMLFormElement;
                      if (formElem) formElem.requestSubmit();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {editingId ? 'Salvar Alterações' : 'Emitir Pedido'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Caixa de Busca, Filtros e Listagem */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-serif font-bold text-base text-slate-700">Relatório Geral de Vendas ({pedidosFiltrados.length})</h4>
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botão de Exportar Relatório PDF Mensal */}
            <button
              onClick={() => {
                const currentAnoMes = new Date().toISOString().slice(0, 7);
                gerarResumoMensalPDF(pedidos, clientes, representadas, currentAnoMes);
              }}
              className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Exportar Resumo de Pedidos do Mês em PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Resumo do Mês (PDF)</span>
            </button>

            {/* Filtro de Status */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-bold cursor-pointer focus:outline-none"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Rascunho">Rascunho</option>
              <option value="Pendente">Pendente</option>
              <option value="Faturado">Faturado</option>
              <option value="Pago">Comissão Recebida</option>
              <option value="Cancelado">Cancelado</option>
            </select>

            {/* Caixa de Busca */}
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Buscar por Nº, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600 text-slate-800"
              />
            </div>
          </div>
        </div>

        {pedidosFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-400 italic">
            Nenhum pedido de venda encontrado para os filtros ativos.
          </div>
        ) : (
          <div className="space-y-3">
            {pedidosFiltrados.map(p => {
              const cli = clientes.find(c => c.id === p.clienteId);
              const rep = representadas.find(r => r.id === p.representadaId);

              const badgeColor = 
                p.status === 'Pago' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                p.status === 'Faturado' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                p.status === 'Pendente' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                p.status === 'Rascunho' ? 'text-slate-600 bg-slate-50 border-slate-200' : 'text-red-700 bg-red-50 border-red-200';

              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 hover:shadow-md transition-all relative">
                  
                  {/* Linha de Cabeçalho */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-400">PEDIDO</span>
                      <h5 className="font-mono font-extrabold text-base text-slate-800">#{p.numeroPedido}</h5>
                      <span className="text-slate-300">|</span>
                      <span className="font-mono text-[11px] text-slate-500">{formatarData(p.dataPedido)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}>
                        {p.status}
                      </span>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <button 
                          onClick={() => {
                            const cli = clientes.find(c => c.id === p.clienteId);
                            const rep = representadas.find(r => r.id === p.representadaId);
                            gerarPedidoPDF(p, cli, rep);
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          title="Imprimir Pedido (PDF)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleOpenEmailModal(p)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          title="Enviar por E-mail"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleLoadForEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Excluir permanentemente o pedido #${p.numeroPedido}?`)) {
                              onDelete(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Informações de Vendas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Cliente (Comprador)</span>
                      <strong className="text-slate-800 text-[13px] font-serif block mt-0.5">{cli ? cli.nomeFantasia : 'Não Encontrado'}</strong>
                      <span className="text-slate-400 block mt-0.5 text-[10px]">{cli ? cli.razaoSocial : ''}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Representada (Fábrica)</span>
                      <strong className="text-slate-800 text-[13px] font-serif block mt-0.5">{rep ? rep.nomeFantasia : 'Não Encontrado'}</strong>
                      <span className="text-slate-400 block mt-0.5 text-[10px]">{rep ? rep.razaoSocial : ''}</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div className="font-mono text-[10px]">
                        <span className="text-slate-400 block uppercase tracking-wider">Valor do Pedido</span>
                        <strong className="text-slate-800 text-xs font-bold">{formatarMoeda(p.valorTotal)}</strong>
                      </div>
                      <div className="text-right font-mono text-[10px]">
                        <span className="text-slate-400 block uppercase tracking-wider">Sua Comissão ({p.comissaoPercentual}%)</span>
                        <strong className="text-emerald-700 text-xs font-extrabold">{formatarMoeda(p.valorComissao)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Produtos Acoplada do Pedido */}
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">Itens do Pedido ({p.itens.length})</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {p.itens.map(it => (
                        <div key={it.id} className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 text-[11px] flex justify-between items-center">
                          <span className="font-serif text-slate-700 font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-[130px]">{it.descricao}</span>
                          <span className="font-mono text-slate-500 font-bold shrink-0">{it.quantidade}x {formatarMoeda(it.precoUnitario)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Observações Adicionadas */}
                  {p.observacoes && (
                    <div className="pt-2 text-[11px] text-slate-500 italic border-t border-dashed border-slate-100">
                      Observações: {p.observacoes}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para envio de Pedido via E-mail */}
      <AnimatePresence>
        {emailPedido && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-serif font-bold text-sm text-slate-800">
                    Enviar Pedido #{emailPedido.numeroPedido} por E-mail
                  </h3>
                </div>
                <button
                  onClick={() => setEmailPedido(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                  disabled={isSendingEmail}
                >
                  &times;
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSendEmail} className="p-5 space-y-4">
                {emailSuccess ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="font-serif font-bold text-slate-800 text-sm">E-mail Enviado com Sucesso!</h4>
                    <p className="text-[11px] text-slate-400">O pedido foi processado e enviado para <strong>{emailRecipient}</strong>.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-500 font-mono uppercase text-[9px]">E-mail do Destinatário <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        required
                        placeholder="cliente@email.com"
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800"
                        disabled={isSendingEmail}
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-500 font-mono uppercase text-[9px]">Assunto do E-mail</label>
                      <input
                        type="text"
                        required
                        placeholder="Assunto"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 font-bold"
                        disabled={isSendingEmail}
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-500 font-mono uppercase text-[9px]">Mensagem</label>
                      <textarea
                        rows={5}
                        required
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 leading-relaxed resize-none"
                        disabled={isSendingEmail}
                      />
                    </div>

                    <div className="bg-emerald-50/50 border border-dashed border-emerald-200 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <div className="text-left">
                          <p className="text-[11px] font-mono font-bold text-slate-700">Pedido_{emailPedido.numeroPedido}.pdf</p>
                          <p className="text-[9px] text-slate-400">Documento PDF gerado automaticamente</p>
                        </div>
                      </div>
                      <span className="text-[9px] uppercase font-mono font-bold text-emerald-600 bg-white border border-emerald-100 px-1.5 py-0.5 rounded">
                        Anexo
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEmailPedido(null)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
                        disabled={isSendingEmail}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        disabled={isSendingEmail}
                      >
                        {isSendingEmail ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Enviar por E-mail</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
