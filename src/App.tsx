import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  ShoppingCart, 
  Landmark, 
  TrendingUp, 
  AlertCircle,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Import Types
import { Representada, Cliente, Pedido, MetaVendas, Produto, Usuario, EmpresaRepresentacao } from './types';

// Import Seeds
import { 
  SEED_REPRESENTADAS, 
  SEED_CLIENTES, 
  SEED_PEDIDOS, 
  SEED_METAS,
  SEED_PRODUTOS,
  SEED_EMPRESAS,
  SEED_USUARIOS
} from './data';

import { 
  seedDatabaseIfNeeded,
  getRepresentadas,
  saveRepresentada,
  deleteRepresentada,
  getClientes,
  saveCliente,
  deleteCliente,
  getPedidos,
  savePedido,
  deletePedido,
  getProdutos,
  saveProduto,
  deleteProduto,
  getEmpresas,
  saveEmpresa,
  deleteEmpresa,
  getUsuarios,
  saveUsuario,
  deleteUsuario,
  getMeta,
  saveMeta,
  db,
  testarConexaoFirebase
} from './firebase';

// Import Subcomponents
import DashboardTab from './components/DashboardTab';
import RepresentadasTab from './components/RepresentadasTab';
import ClientesTab from './components/ClientesTab';
import PedidosTab from './components/PedidosTab';
import ProdutosTab from './components/ProdutosTab';
import AdminTab from './components/AdminTab';
import LoginScreen from './components/LoginScreen';

export default function App() {
  // --- Core Persistent States ---
  const [representadas, setRepresentadas] = useState<Representada[]>(() => {
    const saved = localStorage.getItem('rep_representadas');
    const items = saved ? JSON.parse(saved) : SEED_REPRESENTADAS;
    return items.map((i: any) => ({ ...i, empresaRepresentacaoId: i.empresaRepresentacaoId || 'emp-1' }));
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('rep_clientes');
    const items = saved ? JSON.parse(saved) : SEED_CLIENTES;
    return items.map((i: any) => ({ ...i, empresaRepresentacaoId: i.empresaRepresentacaoId || 'emp-1' }));
  });

  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const saved = localStorage.getItem('rep_pedidos');
    const items = saved ? JSON.parse(saved) : SEED_PEDIDOS;
    return items.map((i: any) => ({ ...i, empresaRepresentacaoId: i.empresaRepresentacaoId || 'emp-1' }));
  });

  const [meta, setMeta] = useState<MetaVendas>(() => {
    const saved = localStorage.getItem('rep_meta');
    return saved ? JSON.parse(saved) : SEED_METAS;
  });

  const [produtos, setProdutos] = useState<Produto[]>(() => {
    const saved = localStorage.getItem('rep_produtos');
    const items = saved ? JSON.parse(saved) : SEED_PRODUTOS;
    return items.map((i: any) => ({ ...i, empresaRepresentacaoId: i.empresaRepresentacaoId || 'emp-1' }));
  });

  // --- Multi-Company & User Access Management States ---
  const [empresas, setEmpresas] = useState<EmpresaRepresentacao[]>(() => {
    const saved = localStorage.getItem('rep_empresas');
    return saved ? JSON.parse(saved) : SEED_EMPRESAS;
  });

  const [activeEmpresaId, setActiveEmpresaId] = useState<string>(() => {
    const saved = localStorage.getItem('rep_active_empresa_id');
    if (saved) return saved;
    const defaultEmp = SEED_EMPRESAS.find(e => e.isDefault);
    return defaultEmp?.id || 'emp-1';
  });

  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const saved = localStorage.getItem('rep_usuarios');
    return saved ? JSON.parse(saved) : SEED_USUARIOS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('rep_current_user_id');
    return saved || 'usr-1';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('rep_is_authenticated');
    return saved === 'true';
  });

  // --- UI Navigation & Active States ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'representadas' | 'clientes' | 'pedidos' | 'produtos' | 'admin'>('dashboard');
  const [activePedidoToEdit, setActivePedidoToEdit] = useState<Pedido | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    localStorage.setItem('rep_empresas', JSON.stringify(empresas));
  }, [empresas]);

  useEffect(() => {
    localStorage.setItem('rep_active_empresa_id', activeEmpresaId);
  }, [activeEmpresaId]);

  useEffect(() => {
    localStorage.setItem('rep_usuarios', JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    localStorage.setItem('rep_current_user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('rep_is_authenticated', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    async function initFirestoreData() {
      try {
        await seedDatabaseIfNeeded();

        const [
          repData,
          cliData,
          pedData,
          prodData,
          empData,
          usrData,
          metaData
        ] = await Promise.all([
          getRepresentadas(),
          getClientes(),
          getPedidos(),
          getProdutos(),
          getEmpresas(),
          getUsuarios(),
          getMeta()
        ]);

        if (repData.length > 0) setRepresentadas(repData);
        if (cliData.length > 0) setClientes(cliData);
        if (pedData.length > 0) setPedidos(pedData);
        if (prodData.length > 0) setProdutos(prodData);
        if (empData.length > 0) setEmpresas(empData);
        if (usrData.length > 0) setUsuarios(usrData);
        if (metaData) setMeta(metaData);
      } catch (err) {
        console.error('Error synchronizing with Firestore:', err);
        setErrorMessage('Falha ao sincronizar dados com o Firestore. Rodando em modo local offline.');
      } finally {
        setLoading(false);
      }
    }
    initFirestoreData();
  }, []);

  // --- Active Selections and Helpers ---
  const activeEmpresa = empresas.find(e => e.id === activeEmpresaId) || empresas[0];
  const currentUser = usuarios.find(u => u.id === currentUserId) || usuarios[0];

  const handleSelectEmpresa = (id: string) => {
    setActiveEmpresaId(id);
    // Auto-select corresponding company user when switching to keep consistency
    const companyUser = usuarios.find(u => u.empresaRepresentacaoId === id && u.ativo);
    if (companyUser) {
      setCurrentUserId(companyUser.id);
    }
  };

  const handleSelectUsuario = (id: string) => {
    setCurrentUserId(id);
    const selectedUsr = usuarios.find(u => u.id === id);
    if (selectedUsr && selectedUsr.empresaRepresentacaoId !== activeEmpresaId) {
      setActiveEmpresaId(selectedUsr.empresaRepresentacaoId);
    }
  };

  // --- Data Isolation Filter Layers ---
  // We filter all business collections by activeEmpresaId so different companies NEVER see each other's data!
  const filteredRepresentadas = representadas.filter(r => r.empresaRepresentacaoId === activeEmpresaId);
  const filteredClientes = clientes.filter(c => c.empresaRepresentacaoId === activeEmpresaId);
  const filteredPedidos = pedidos.filter(p => p.empresaRepresentacaoId === activeEmpresaId);
  const filteredProdutos = produtos.filter(p => p.empresaRepresentacaoId === activeEmpresaId);

  // --- Handlers for CRUD ---
  
  // Representadas
  const handleAddRepresentada = async (rep: Representada) => {
    const withEmp = { ...rep, empresaRepresentacaoId: activeEmpresaId };
    setRepresentadas([...representadas, withEmp]);
    await saveRepresentada(withEmp);
  };
  const handleEditRepresentada = async (rep: Representada) => {
    setRepresentadas(representadas.map(r => r.id === rep.id ? rep : r));
    await saveRepresentada(rep);
  };
  const handleDeleteRepresentada = async (id: string) => {
    setRepresentadas(representadas.filter(r => r.id !== id));
    await deleteRepresentada(id);
  };

  // Clientes
  const handleAddCliente = async (cli: Cliente) => {
    const withEmp = { ...cli, empresaRepresentacaoId: activeEmpresaId };
    setClientes([...clientes, withEmp]);
    await saveCliente(withEmp);
  };
  const handleEditCliente = async (cli: Cliente) => {
    setClientes(clientes.map(c => c.id === cli.id ? cli : c));
    await saveCliente(cli);
  };
  const handleDeleteCliente = async (id: string) => {
    setClientes(clientes.filter(c => c.id !== id));
    await deleteCliente(id);
  };

  // Pedidos
  const handleAddPedido = async (pedido: Pedido) => {
    const withEmp = { ...pedido, empresaRepresentacaoId: activeEmpresaId };
    setPedidos([withEmp, ...pedidos]);
    await savePedido(withEmp);
  };
  const handleEditPedido = async (pedido: Pedido) => {
    setPedidos(pedidos.map(p => p.id === pedido.id ? pedido : p));
    await savePedido(pedido);
  };
  const handleDeletePedido = async (id: string) => {
    setPedidos(pedidos.filter(p => p.id !== id));
    await deletePedido(id);
  };

  // Produtos
  const handleAddProduto = async (prod: Produto) => {
    const withEmp = { ...prod, empresaRepresentacaoId: activeEmpresaId };
    setProdutos([...produtos, withEmp]);
    await saveProduto(withEmp);
  };
  const handleEditProduto = async (prod: Produto) => {
    setProdutos(produtos.map(p => p.id === prod.id ? prod : p));
    await saveProduto(prod);
  };
  const handleDeleteProduto = async (id: string) => {
    setProdutos(produtos.filter(p => p.id !== id));
    await deleteProduto(id);
  };

  // Empresas de Representação (Razões Sociais)
  const handleAddEmpresa = async (emp: EmpresaRepresentacao) => {
    setEmpresas([...empresas, emp]);
    await saveEmpresa(emp);
  };
  const handleEditEmpresa = async (emp: EmpresaRepresentacao) => {
    setEmpresas(empresas.map(e => e.id === emp.id ? emp : e));
    await saveEmpresa(emp);
  };
  const handleDeleteEmpresa = async (id: string) => {
    setEmpresas(empresas.filter(e => e.id !== id));
    await deleteEmpresa(id);
  };

  // Usuários do Sistema
  const handleAddUsuario = async (usr: Usuario) => {
    setUsuarios([...usuarios, usr]);
    await saveUsuario(usr);
  };
  const handleEditUsuario = async (usr: Usuario) => {
    setUsuarios(usuarios.map(u => u.id === usr.id ? usr : u));
    await saveUsuario(usr);
  };
  const handleDeleteUsuario = async (id: string) => {
    setUsuarios(usuarios.filter(u => u.id !== id));
    await deleteUsuario(id);
  };

  const handleSetMeta = async (newMeta: MetaVendas) => {
    setMeta(newMeta);
    await saveMeta(newMeta);
  };

  // Transition helper from dashboard view link
  const handleViewAndEditPedido = (pedido: Pedido) => {
    setActivePedidoToEdit(pedido);
    setActiveTab('pedidos');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h3 className="font-serif font-extrabold text-lg text-white">RepresentaPRO</h3>
            <p className="text-xs text-slate-400 mt-1">Sincronizando portal com o Firestore...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen 
        usuarios={usuarios}
        empresas={empresas}
        onLoginSuccess={(userId, empresaId) => {
          setCurrentUserId(userId);
          setActiveEmpresaId(empresaId);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Banner & Header */}
      <header className="bg-white border-b border-slate-200 py-3 sm:py-4 px-4 sm:px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            {activeEmpresa?.logoUrl ? (
              <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                <img src={activeEmpresa.logoUrl} alt="Logo" className="object-contain max-w-full max-h-full" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm shadow-emerald-200">
                <Briefcase className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif font-extrabold text-lg text-slate-900 tracking-tight">RepresentaPRO</h1>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold shadow-xs">
                  🏢 {activeEmpresa?.nomeFantasia}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold shadow-xs">
                  👤 {currentUser?.nome} ({currentUser?.role})
                </span>
              </div>
              <p className="text-xs text-slate-500">Sistema Integrado de Gestão de Representação Comercial</p>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-right hidden sm:block">
              <span className="text-[9px] uppercase text-slate-400 block font-bold">Representadas</span>
              <strong className="text-slate-800 font-extrabold">{filteredRepresentadas.length} ativas</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-right hidden sm:block">
              <span className="text-[9px] uppercase text-slate-400 block font-bold">Clientes Carteira</span>
              <strong className="text-slate-800 font-extrabold">{filteredClientes.length} lojistas</strong>
            </div>
            
            <button
              onClick={async () => {
                try {
                  const docId = await testarConexaoFirebase(currentUser?.email);
                  alert(`Sucesso! Conectado ao Firestore "representapro-b84c3".\nDocumento criado na coleção "teste_conexao" com o ID: ${docId}`);
                } catch (err: any) {
                  alert(`Erro ao conectar ao Firestore: ${err.message}`);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-200"
              title="Testar Conexão Firebase"
            >
              <span>Testar Firebase</span>
            </button>

            <button
              onClick={() => {
                setIsAuthenticated(false);
              }}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-red-100/50"
              title="Sair do sistema"
            >
              <span>Sair</span>
            </button>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 pb-24 sm:pb-6">
        
        {/* Navigation Tabs Bar */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
          
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

          {/* Tab 5: Administração & Multiempresas */}
          <button 
            id="tab-admin"
            onClick={() => { setActiveTab('admin'); setActivePedidoToEdit(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ml-auto ${
              activeTab === 'admin' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-dashed border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Configurações & Acesso</span>
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
                  pedidos={filteredPedidos}
                  clientes={filteredClientes}
                  representadas={filteredRepresentadas}
                  meta={meta}
                  setMeta={handleSetMeta}
                  onNavigateToTab={setActiveTab}
                  onEditPedido={handleViewAndEditPedido}
                  empresaRepresentacao={activeEmpresa}
                />
              )}

              {activeTab === 'representadas' && (
                <RepresentadasTab 
                  representadas={filteredRepresentadas}
                  pedidos={filteredPedidos}
                  onAdd={handleAddRepresentada}
                  onEdit={handleEditRepresentada}
                  onDelete={handleDeleteRepresentada}
                />
              )}

              {activeTab === 'clientes' && (
                <ClientesTab 
                  clientes={filteredClientes}
                  pedidos={filteredPedidos}
                  representadas={filteredRepresentadas}
                  onAdd={handleAddCliente}
                  onEdit={handleEditCliente}
                  onDelete={handleDeleteCliente}
                />
              )}

              {activeTab === 'produtos' && (
                <ProdutosTab 
                  produtos={filteredProdutos}
                  representadas={filteredRepresentadas}
                  onAdd={handleAddProduto}
                  onEdit={handleEditProduto}
                  onDelete={handleDeleteProduto}
                />
              )}

              {activeTab === 'pedidos' && (
                <PedidosTab 
                  pedidos={filteredPedidos}
                  clientes={filteredClientes}
                  representadas={filteredRepresentadas}
                  activePedidoToEdit={activePedidoToEdit}
                  onClearActiveEdit={() => setActivePedidoToEdit(null)}
                  onAdd={handleAddPedido}
                  onEdit={handleEditPedido}
                  onDelete={handleDeletePedido}
                  empresaRepresentacao={activeEmpresa}
                />
              )}

              {activeTab === 'admin' && (
                <AdminTab 
                  empresas={empresas}
                  usuarios={usuarios}
                  activeEmpresaId={activeEmpresaId}
                  currentUserId={currentUserId}
                  onAddEmpresa={handleAddEmpresa}
                  onEditEmpresa={handleEditEmpresa}
                  onDeleteEmpresa={handleDeleteEmpresa}
                  onAddUsuario={handleAddUsuario}
                  onEditUsuario={handleEditUsuario}
                  onDeleteUsuario={handleDeleteUsuario}
                  onSelectEmpresa={handleSelectEmpresa}
                  onSelectUsuario={handleSelectUsuario}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 px-6 hidden sm:block">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <span>&copy; {new Date().getFullYear()} RepresentaPRO - Gestão & Inteligência Comercial.</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Multiempresas: <strong className="text-slate-600">{empresas.length} cadastradas</strong> | Banco de dados isolado com criptografia local.</span>
          </div>
        </div>
      </footer>

      {/* Bottom Tab Bar for Mobile & PWA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/85 px-2 py-2 flex justify-around items-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)] sm:hidden">
        
        {/* Mobile Tab 1: Painel */}
        <button
          onClick={() => { setActiveTab('dashboard'); setActivePedidoToEdit(null); }}
          className={`flex flex-col items-center justify-center w-12 py-1 text-center transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-emerald-600 scale-105' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[8px] font-bold mt-0.5">Painel</span>
        </button>

        {/* Mobile Tab 2: Representadas */}
        <button
          onClick={() => { setActiveTab('representadas'); setActivePedidoToEdit(null); }}
          className={`flex flex-col items-center justify-center w-12 py-1 text-center transition-all cursor-pointer ${
            activeTab === 'representadas' ? 'text-emerald-600 scale-105' : 'text-slate-500'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span className="text-[8px] font-bold mt-0.5">Fábricas</span>
        </button>

        {/* Mobile Tab 3: Clientes */}
        <button
          onClick={() => { setActiveTab('clientes'); setActivePedidoToEdit(null); }}
          className={`flex flex-col items-center justify-center w-12 py-1 text-center transition-all cursor-pointer ${
            activeTab === 'clientes' ? 'text-emerald-600 scale-105' : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[8px] font-bold mt-0.5">Clientes</span>
        </button>

        {/* Mobile Tab 4: Produtos */}
        <button
          onClick={() => { setActiveTab('produtos'); setActivePedidoToEdit(null); }}
          className={`flex flex-col items-center justify-center w-12 py-1 text-center transition-all cursor-pointer ${
            activeTab === 'produtos' ? 'text-emerald-600 scale-105' : 'text-slate-500'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span className="text-[8px] font-bold mt-0.5">Produtos</span>
        </button>

        {/* Mobile Tab 5: Pedidos */}
        <button
          onClick={() => { setActiveTab('pedidos'); }}
          className={`flex flex-col items-center justify-center w-12 py-1 text-center transition-all cursor-pointer ${
            activeTab === 'pedidos' ? 'text-emerald-600 scale-105' : 'text-slate-500'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-[8px] font-bold mt-0.5">Pedidos</span>
        </button>

        {/* Mobile Tab 6: Admin */}
        <button
          onClick={() => { setActiveTab('admin'); }}
          className={`flex flex-col items-center justify-center w-12 py-1 text-center transition-all cursor-pointer ${
            activeTab === 'admin' ? 'text-slate-800 scale-105' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-[8px] font-bold mt-0.5">Acesso</span>
        </button>

      </div>

    </div>
  );
}
