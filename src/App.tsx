import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  ShoppingCart, 
  Landmark, 
  TrendingUp, 
  AlertCircle,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Import Types
import { Representada, Cliente, Pedido, MetaVendas, Produto } from './types';

// Import Seeds
import { 
  SEED_REPRESENTADAS, 
  SEED_CLIENTES, 
  SEED_PEDIDOS, 
  SEED_METAS,
  SEED_PRODUTOS
} from './data';

// Import Subcomponents
import DashboardTab from './components/DashboardTab';
import RepresentadasTab from './components/RepresentadasTab';
import ClientesTab from './components/ClientesTab';
import PedidosTab from './components/PedidosTab';
import ProdutosTab from './components/ProdutosTab';

export default function App() {
  // --- Core Persistent States ---
  const [representadas, setRepresentadas] = useState<Representada[]>(() => {
    const saved = localStorage.getItem('rep_representadas');
    return saved ? JSON.parse(saved) : SEED_REPRESENTADAS;
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('rep_clientes');
    return saved ? JSON.parse(saved) : SEED_CLIENTES;
  });

  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const saved = localStorage.getItem('rep_pedidos');
    return saved ? JSON.parse(saved) : SEED_PEDIDOS;
  });

  const [meta, setMeta] = useState<MetaVendas>(() => {
    const saved = localStorage.getItem('rep_meta');
    return saved ? JSON.parse(saved) : SEED_METAS;
  });

  const [produtos, setProdutos] = useState<Produto[]>(() => {
    const saved = localStorage.getItem('rep_produtos');
    return saved ? JSON.parse(saved) : SEED_PRODUTOS;
  });

  // --- UI Navigation & Active States ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'representadas' | 'clientes' | 'pedidos' | 'produtos'>('dashboard');
  const [activePedidoToEdit, setActivePedidoToEdit] = useState<Pedido | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- LocalStorage Synchronization ---
  useEffect(() => {
    localStorage.setItem('rep_representadas', JSON.stringify(representadas));
  }, [representadas]);

  useEffect(() => {
    localStorage.setItem('rep_clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('rep_pedidos', JSON.stringify(pedidos));
  }, [pedidos]);

  useEffect(() => {
    localStorage.setItem('rep_meta', JSON.stringify(meta));
  }, [meta]);

  useEffect(() => {
    localStorage.setItem('rep_produtos', JSON.stringify(produtos));
  }, [produtos]);

  // --- Handlers for CRUD ---
  
  // Representadas
  const handleAddRepresentada = (rep: Representada) => {
    setRepresentadas([...representadas, rep]);
  };
  const handleEditRepresentada = (rep: Representada) => {
    setRepresentadas(representadas.map(r => r.id === rep.id ? rep : r));
  };
  const handleDeleteRepresentada = (id: string) => {
    setRepresentadas(representadas.filter(r => r.id !== id));
  };

  // Clientes
  const handleAddCliente = (cli: Cliente) => {
    setClientes([...clientes, cli]);
  };
  const handleEditCliente = (cli: Cliente) => {
    setClientes(clientes.map(c => c.id === cli.id ? cli : c));
  };
  const handleDeleteCliente = (id: string) => {
    setClientes(clientes.filter(c => c.id !== id));
  };

  // Pedidos
  const handleAddPedido = (pedido: Pedido) => {
    setPedidos([pedido, ...pedidos]);
  };
  const handleEditPedido = (pedido: Pedido) => {
    setPedidos(pedidos.map(p => p.id === pedido.id ? pedido : p));
  };
  const handleDeletePedido = (id: string) => {
    setPedidos(pedidos.filter(p => p.id !== id));
  };

  // Produtos
  const handleAddProduto = (prod: Produto) => {
    setProdutos([...produtos, prod]);
  };
  const handleEditProduto = (prod: Produto) => {
    setProdutos(produtos.map(p => p.id === prod.id ? prod : p));
  };
  const handleDeleteProduto = (id: string) => {
    setProdutos(produtos.filter(p => p.id !== id));
  };

  // Transition helper from dashboard view link
  const handleViewAndEditPedido = (pedido: Pedido) => {
    setActivePedidoToEdit(pedido);
    setActiveTab('pedidos');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Banner & Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm shadow-emerald-200">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-extrabold text-lg text-slate-900 tracking-tight">RepresentaPRO</h1>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">Gestor Oficial</span>
              </div>
              <p className="text-xs text-slate-500">Sistema Integrado de Gestão de Representação Comercial</p>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-right">
              <span className="text-[9px] uppercase text-slate-400 block font-bold">Representadas</span>
              <strong className="text-slate-800 font-extrabold">{representadas.length} ativas</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-right">
              <span className="text-[9px] uppercase text-slate-400 block font-bold">Carteira de Clientes</span>
              <strong className="text-slate-800 font-extrabold">{clientes.length} lojistas</strong>
            </div>
          </div>

        </div>
      </header>

      {/* Alerta de erro da API do Gemini */}
      {errorMessage && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 py-2.5 px-6 text-xs flex items-center justify-center gap-2 font-medium sticky top-[73px] z-30 shadow-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
          
          {/* Tab 1: Painel Geral */}
          <button 
            id="tab-dashboard"
            onClick={() => { setActiveTab('dashboard'); setActivePedidoToEdit(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Painel Geral</span>
          </button>

          {/* Tab 2: Representadas */}
          <button 
            id="tab-representadas"
            onClick={() => { setActiveTab('representadas'); setActivePedidoToEdit(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'representadas' 
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Representadas / Fábricas</span>
          </button>

          {/* Tab 3: Clientes */}
          <button 
            id="tab-clientes"
            onClick={() => { setActiveTab('clientes'); setActivePedidoToEdit(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'clientes' 
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Carteira de Clientes</span>
          </button>

          {/* Tab: Produtos */}
          <button 
            id="tab-produtos"
            onClick={() => { setActiveTab('produtos'); setActivePedidoToEdit(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'produtos' 
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Produtos / Catálogo</span>
          </button>

          {/* Tab 4: Pedidos / Vendas */}
          <button 
            id="tab-pedidos"
            onClick={() => { setActiveTab('pedidos'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pedidos' 
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Pedidos de Venda</span>
          </button>

        </div>

        {/* Tab Contents Frame */}
        <div className="flex-1 min-h-[450px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  pedidos={pedidos}
                  clientes={clientes}
                  representadas={representadas}
                  meta={meta}
                  setMeta={setMeta}
                  onNavigateToTab={setActiveTab}
                  onEditPedido={handleViewAndEditPedido}
                />
              )}

              {activeTab === 'representadas' && (
                <RepresentadasTab 
                  representadas={representadas}
                  pedidos={pedidos}
                  onAdd={handleAddRepresentada}
                  onEdit={handleEditRepresentada}
                  onDelete={handleDeleteRepresentada}
                />
              )}

              {activeTab === 'clientes' && (
                <ClientesTab 
                  clientes={clientes}
                  pedidos={pedidos}
                  onAdd={handleAddCliente}
                  onEdit={handleEditCliente}
                  onDelete={handleDeleteCliente}
                />
              )}

              {activeTab === 'produtos' && (
                <ProdutosTab 
                  produtos={produtos}
                  representadas={representadas}
                  onAdd={handleAddProduto}
                  onEdit={handleEditProduto}
                  onDelete={handleDeleteProduto}
                />
              )}

              {activeTab === 'pedidos' && (
                <PedidosTab 
                  pedidos={pedidos}
                  clientes={clientes}
                  representadas={representadas}
                  activePedidoToEdit={activePedidoToEdit}
                  onClearActiveEdit={() => setActivePedidoToEdit(null)}
                  onAdd={handleAddPedido}
                  onEdit={handleEditPedido}
                  onDelete={handleDeletePedido}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <span>&copy; {new Date().getFullYear()} RepresentaPRO - Gestão & Inteligência Comercial.</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Todos os dados são persistidos localmente de forma segura.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
