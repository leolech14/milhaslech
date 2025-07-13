import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [companies, setCompanies] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [memberHistory, setMemberHistory] = useState({});

  // Fetch data functions
  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies`);
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('Erro ao buscar programas:', error);
    }
  };

  const fetchMembers = async (companyId = null) => {
    try {
      const url = companyId ? `${API_BASE_URL}/api/members?company_id=${companyId}` : `${API_BASE_URL}/api/members`;
      const response = await fetch(url);
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const fetchMemberHistory = async (memberId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/history`);
      const data = await response.json();
      setMemberHistory(prev => ({
        ...prev,
        [memberId]: data
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCompanies();
    fetchMembers();
    fetchDashboardStats();
  }, []);

  // Handle company selection
  const handleCompanySelect = (companyId) => {
    setSelectedCompany(companyId);
    if (companyId === 'all') {
      fetchMembers();
    } else {
      fetchMembers(companyId);
    }
  };

  // Get filtered members
  const getFilteredMembers = () => {
    if (selectedCompany === 'all') {
      return members;
    }
    return members.filter(member => member.company_id === selectedCompany);
  };

  // Get company by ID
  const getCompanyById = (id) => {
    return companies.find(c => c.id === id);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div className="app">
      <Sidebar 
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanySelect={handleCompanySelect}
        onAddCompany={() => setShowAddCompany(true)}
        dashboardStats={dashboardStats}
      />
      
      <main className="main-content">
        <TopBar 
          onAddMember={() => setShowAddMember(true)}
          onRefresh={() => {
            fetchMembers();
            fetchDashboardStats();
          }}
        />
        
        <div className="dashboard-grid">
          {getFilteredMembers().map(member => (
            <MemberCard 
              key={member.id}
              member={member}
              company={getCompanyById(member.company_id)}
              onEdit={() => setEditingMember(member)}
              onDelete={() => deleteMember(member.id)}
              onViewHistory={() => fetchMemberHistory(member.id)}
              history={memberHistory[member.id] || []}
              formatDate={formatDate}
              formatNumber={formatNumber}
            />
          ))}
        </div>
      </main>

      {showAddMember && (
        <AddMemberModal 
          companies={companies}
          onClose={() => setShowAddMember(false)}
          onSubmit={createMember}
        />
      )}

      {showAddCompany && (
        <AddCompanyModal 
          onClose={() => setShowAddCompany(false)}
          onSubmit={createCompany}
        />
      )}

      {editingMember && (
        <EditMemberModal 
          member={editingMember}
          companies={companies}
          onClose={() => setEditingMember(null)}
          onSubmit={updateMember}
        />
      )}
    </div>
  );

  // CRUD operations
  async function createMember(memberData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });
      
      if (response.ok) {
        fetchMembers();
        fetchDashboardStats();
        setShowAddMember(false);
      } else {
        const error = await response.json();
        alert(error.detail || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      alert('Erro ao criar conta');
    }
  }

  async function updateMember(memberId, memberData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });
      
      if (response.ok) {
        fetchMembers();
        fetchDashboardStats();
        setEditingMember(null);
      } else {
        const error = await response.json();
        alert(error.detail || 'Erro ao atualizar conta');
      }
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      alert('Erro ao atualizar conta');
    }
  }

  async function deleteMember(memberId) {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/members/${memberId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          fetchMembers();
          fetchDashboardStats();
        } else {
          alert('Erro ao excluir conta');
        }
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
        alert('Erro ao excluir conta');
      }
    }
  }

  async function createCompany(companyData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });
      
      if (response.ok) {
        fetchCompanies();
        setShowAddCompany(false);
      } else {
        const error = await response.json();
        alert(error.detail || 'Erro ao criar programa');
      }
    } catch (error) {
      console.error('Erro ao criar programa:', error);
      alert('Erro ao criar programa');
    }
  }
}

// Components
const Sidebar = ({ companies, selectedCompany, onCompanySelect, onAddCompany, dashboardStats }) => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <h1>Programas de Milhas</h1>
      <p>Família Lech</p>
    </div>
    
    <nav className="sidebar-nav">
      <button 
        className={selectedCompany === 'all' ? 'active' : ''}
        onClick={() => onCompanySelect('all')}
      >
        Todos os Programas
      </button>
      
      {companies.map(company => (
        <button
          key={company.id}
          className={selectedCompany === company.id ? 'active' : ''}
          onClick={() => onCompanySelect(company.id)}
          style={{ borderLeft: `4px solid ${company.color}` }}
        >
          {company.name}
        </button>
      ))}
    </nav>
    
    <div className="sidebar-stats">
      {dashboardStats && (
        <>
          <div className="stat-item">
            <span>Total de Contas</span>
            <span>{dashboardStats.total_members}</span>
          </div>
          <div className="stat-item">
            <span>Programas</span>
            <span>{dashboardStats.total_companies}</span>
          </div>
        </>
      )}
    </div>
    
    <button className="add-company-btn" onClick={onAddCompany}>
      +
    </button>
  </aside>
);

const TopBar = ({ onAddMember, onRefresh }) => (
  <header className="top-bar">
    <div className="top-bar-left">
      <h2>Painel de Controle</h2>
    </div>
    <div className="top-bar-right">
      <button className="refresh-btn" onClick={onRefresh}>
        ↻ Atualizar
      </button>
      <button className="add-member-btn" onClick={onAddMember}>
        + Nova Conta
      </button>
    </div>
  </header>
);

const MemberCard = ({ member, company, onEdit, onDelete, onViewHistory, history, formatDate, formatNumber }) => {
  const [showHistory, setShowHistory] = useState(false);
  
  const handleViewHistory = () => {
    onViewHistory();
    setShowHistory(!showHistory);
  };

  const getBalanceChange = () => {
    if (history.length < 2) return null;
    const latest = history[0];
    return latest.change;
  };

  const getPointsLabel = () => {
    return company?.points_name || 'pontos';
  };

  const isEmptyMember = () => {
    return !member.loyalty_number && member.current_balance === 0;
  };

  return (
    <div className={`member-card ${isEmptyMember() ? 'empty-member' : ''}`} style={{ borderTop: `4px solid ${company?.color}` }}>
      <div className="member-header">
        <div className="member-info">
          <h3>{member.owner_name}</h3>
          <p>{company?.name}</p>
          {member.loyalty_number ? (
            <p>#{member.loyalty_number}</p>
          ) : (
            <p className="empty-field">Número não cadastrado</p>
          )}
        </div>
        <div className="member-actions">
          <button onClick={onEdit}>Editar</button>
          <button onClick={onDelete} className="delete-btn">Excluir</button>
        </div>
      </div>
      
      <div className="member-balance">
        <div className="balance-main">
          <span className="balance-label">Saldo Atual</span>
          <span className="balance-value">
            {formatNumber(member.current_balance)} {getPointsLabel()}
          </span>
        </div>
        
        {getBalanceChange() && (
          <div className={`balance-change ${getBalanceChange() > 0 ? 'positive' : 'negative'}`}>
            {getBalanceChange() > 0 ? '+' : ''}{formatNumber(getBalanceChange())}
          </div>
        )}
      </div>
      
      {member.elite_tier && (
        <div className="elite-tier">
          <span>{member.elite_tier}</span>
        </div>
      )}
      
      <div className="member-footer">
        <span>Atualizado: {formatDate(member.last_updated)}</span>
        <button onClick={handleViewHistory}>
          {showHistory ? 'Ocultar' : 'Ver'} Histórico
        </button>
      </div>
      
      {showHistory && (
        <div className="member-history">
          {history.length > 0 ? (
            history.map(entry => (
              <div key={entry.id} className="history-entry">
                <span>{formatNumber(entry.balance)} {getPointsLabel()}</span>
                <span className={entry.change > 0 ? 'positive' : 'negative'}>
                  {entry.change > 0 ? '+' : ''}{formatNumber(entry.change)}
                </span>
                <span>{formatDate(entry.updated_at)}</span>
              </div>
            ))
          ) : (
            <p>Nenhum histórico disponível</p>
          )}
        </div>
      )}
      
      {member.notes && (
        <div className="member-notes">
          <p>{member.notes}</p>
        </div>
      )}

      {isEmptyMember() && (
        <div className="empty-prompt">
          <p>Clique em "Editar" para adicionar os dados desta conta</p>
        </div>
      )}
    </div>
  );
};

const AddMemberModal = ({ companies, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    company_id: '',
    owner_name: '',
    loyalty_number: '',
    current_balance: 0,
    elite_tier: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      current_balance: parseInt(formData.current_balance) || 0
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Nova Conta</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Programa</label>
            <select 
              value={formData.company_id} 
              onChange={(e) => setFormData({...formData, company_id: e.target.value})}
              required
            >
              <option value="">Selecione o Programa</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Nome do Titular</label>
            <input 
              type="text" 
              value={formData.owner_name}
              onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Número da Conta</label>
            <input 
              type="text" 
              value={formData.loyalty_number}
              onChange={(e) => setFormData({...formData, loyalty_number: e.target.value})}
              placeholder="Ex: 123456789"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Saldo Atual</label>
            <input 
              type="number" 
              value={formData.current_balance}
              onChange={(e) => setFormData({...formData, current_balance: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Categoria/Status</label>
            <input 
              type="text" 
              value={formData.elite_tier}
              onChange={(e) => setFormData({...formData, elite_tier: e.target.value})}
              placeholder="Ex: Gold, Platinum, Diamond"
            />
          </div>
          
          <div className="form-group">
            <label>Observações</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
              placeholder="Informações adicionais..."
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit">Adicionar Conta</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditMemberModal = ({ member, companies, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    owner_name: member.owner_name,
    loyalty_number: member.loyalty_number,
    current_balance: member.current_balance,
    elite_tier: member.elite_tier || '',
    notes: member.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(member.id, {
      ...formData,
      current_balance: parseInt(formData.current_balance) || 0
    });
  };

  const company = companies.find(c => c.id === member.company_id);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Editar Conta - {member.owner_name}</h2>
        <p className="modal-subtitle">{company?.name}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do Titular</label>
            <input 
              type="text" 
              value={formData.owner_name}
              onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Número da Conta</label>
            <input 
              type="text" 
              value={formData.loyalty_number}
              onChange={(e) => setFormData({...formData, loyalty_number: e.target.value})}
              placeholder="Ex: 123456789"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Saldo Atual ({company?.points_name || 'pontos'})</label>
            <input 
              type="number" 
              value={formData.current_balance}
              onChange={(e) => setFormData({...formData, current_balance: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Categoria/Status</label>
            <input 
              type="text" 
              value={formData.elite_tier}
              onChange={(e) => setFormData({...formData, elite_tier: e.target.value})}
              placeholder="Ex: Gold, Platinum, Diamond"
            />
          </div>
          
          <div className="form-group">
            <label>Observações</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
              placeholder="Informações adicionais..."
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddCompanyModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#000000',
    max_members: 4,
    points_name: 'pontos'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Novo Programa</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do Programa</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: TAP Miles&Go"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Cor da Marca</label>
            <input 
              type="color" 
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Nome dos Pontos</label>
            <select 
              value={formData.points_name}
              onChange={(e) => setFormData({...formData, points_name: e.target.value})}
            >
              <option value="milhas">Milhas</option>
              <option value="pontos">Pontos</option>
              <option value="miles">Miles</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Máximo de Contas</label>
            <input 
              type="number" 
              value={formData.max_members}
              onChange={(e) => setFormData({...formData, max_members: parseInt(e.target.value)})}
              min="1"
              max="10"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit">Criar Programa</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;