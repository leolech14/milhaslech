import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [companies, setCompanies] = useState([]);
  const [members, setMembers] = useState([]);
  const [globalLog, setGlobalLog] = useState([]);
  const [showGlobalLog, setShowGlobalLog] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [expandedPrograms, setExpandedPrograms] = useState({});

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

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members`);
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    }
  };

  const fetchGlobalLog = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/global-log`);
      const data = await response.json();
      setGlobalLog(data);
    } catch (error) {
      console.error('Erro ao buscar log global:', error);
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

  // Load data on component mount
  useEffect(() => {
    fetchCompanies();
    fetchMembers();
    fetchGlobalLog();
    fetchDashboardStats();
  }, []);

  // Get company by ID
  const getCompanyById = (id) => {
    return companies.find(c => c.id === id);
  };

  // Toggle program expansion
  const toggleProgram = (memberId, companyId) => {
    const key = `${memberId}-${companyId}`;
    setExpandedPrograms(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format number with dots
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Update program field
  const updateProgramField = async (memberId, companyId, field, value) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/programs/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: field === 'current_balance' ? parseInt(value) || 0 : value
        }),
      });
      
      if (response.ok) {
        await fetchMembers();
        await fetchGlobalLog();
        await fetchDashboardStats();
      } else {
        console.error('Erro ao atualizar campo');
      }
    } catch (error) {
      console.error('Erro ao atualizar campo:', error);
    }
  };

  return (
    <div className="app">
      <Sidebar 
        onShowGlobalLog={() => setShowGlobalLog(true)}
        dashboardStats={dashboardStats}
      />
      
      <main className="main-content">
        <TopBar 
          onRefresh={() => {
            fetchMembers();
            fetchGlobalLog();
            fetchDashboardStats();
          }}
        />
        
        <div className="members-grid">
          {members.map(member => (
            <MemberCard 
              key={member.id}
              member={member}
              companies={companies}
              expandedPrograms={expandedPrograms}
              onToggleProgram={toggleProgram}
              onUpdateField={updateProgramField}
              formatDate={formatDate}
              formatNumber={formatNumber}
              getCompanyById={getCompanyById}
            />
          ))}
        </div>
      </main>

      {showGlobalLog && (
        <GlobalLogModal 
          globalLog={globalLog}
          onClose={() => setShowGlobalLog(false)}
          formatDate={formatDate}
          getCompanyById={getCompanyById}
        />
      )}
    </div>
  );
}

// Components
const Sidebar = ({ onShowGlobalLog, dashboardStats }) => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <h1>Programas de Milhas</h1>
      <p>Família Lech</p>
    </div>
    
    <div className="sidebar-stats">
      {dashboardStats && (
        <>
          <div className="stat-item">
            <span>Membros</span>
            <span>{dashboardStats.total_members}</span>
          </div>
          <div className="stat-item">
            <span>Programas</span>
            <span>{dashboardStats.total_companies}</span>
          </div>
          <div className="stat-item">
            <span>Total de Pontos</span>
            <span>{dashboardStats.total_points.toLocaleString('pt-BR')}</span>
          </div>
          <div className="stat-item">
            <span>Atividade Hoje</span>
            <span>{dashboardStats.recent_activity}</span>
          </div>
        </>
      )}
    </div>
    
    <button className="log-btn" onClick={onShowGlobalLog}>
      📋 Log Global
    </button>
  </aside>
);

const TopBar = ({ onRefresh }) => (
  <header className="top-bar">
    <div className="top-bar-left">
      <h2>Painel de Controle</h2>
    </div>
    <div className="top-bar-right">
      <button className="refresh-btn" onClick={onRefresh}>
        ↻ Atualizar
      </button>
    </div>
  </header>
);

const MemberCard = ({ member, companies, expandedPrograms, onToggleProgram, onUpdateField, formatDate, formatNumber, getCompanyById }) => {
  return (
    <div className="member-card">
      <div className="member-header">
        <h3>{member.name}</h3>
      </div>
      
      <div className="programs-container">
        {companies.map(company => {
          const program = member.programs[company.id];
          const isExpanded = expandedPrograms[`${member.id}-${company.id}`];
          
          return (
            <ProgramBlock
              key={company.id}
              member={member}
              company={company}
              program={program}
              isExpanded={isExpanded}
              onToggle={() => onToggleProgram(member.id, company.id)}
              onUpdateField={onUpdateField}
              formatDate={formatDate}
              formatNumber={formatNumber}
            />
          );
        })}
      </div>
    </div>
  );
};

const ProgramBlock = ({ member, company, program, isExpanded, onToggle, onUpdateField, formatDate, formatNumber }) => {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleFieldEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleFieldSave = async (field) => {
    await onUpdateField(member.id, company.id, field, editValue);
    setEditingField(null);
    setEditValue('');
  };

  const handleKeyPress = (e, field) => {
    if (e.key === 'Enter') {
      handleFieldSave(field);
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setEditValue('');
    }
  };

  return (
    <div className={`program-block ${isExpanded ? 'expanded' : ''}`} style={{ borderLeft: `4px solid ${company.color}` }}>
      <div className="program-header" onClick={onToggle}>
        <div className="program-info">
          <h4>{company.name}</h4>
          <p className="program-balance">
            {formatNumber(program.current_balance)} {company.points_name}
          </p>
        </div>
        <div className="expand-icon">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="program-details">
          <div className="detail-grid">
            <div className="detail-item">
              <label>Login:</label>
              {editingField === 'login' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleFieldSave('login')}
                  onKeyPress={(e) => handleKeyPress(e, 'login')}
                  autoFocus
                />
              ) : (
                <span 
                  className="editable-field"
                  onClick={() => handleFieldEdit('login', program.login)}
                >
                  {program.login || 'Clique para editar'}
                </span>
              )}
            </div>
            
            <div className="detail-item">
              <label>Senha:</label>
              {editingField === 'password' ? (
                <input
                  type="password"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleFieldSave('password')}
                  onKeyPress={(e) => handleKeyPress(e, 'password')}
                  autoFocus
                />
              ) : (
                <span 
                  className="editable-field"
                  onClick={() => handleFieldEdit('password', program.password)}
                >
                  {program.password ? '••••••••' : 'Clique para editar'}
                </span>
              )}
            </div>
            
            <div className="detail-item">
              <label>CPF:</label>
              {editingField === 'cpf' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleFieldSave('cpf')}
                  onKeyPress={(e) => handleKeyPress(e, 'cpf')}
                  autoFocus
                />
              ) : (
                <span 
                  className="editable-field"
                  onClick={() => handleFieldEdit('cpf', program.cpf)}
                >
                  {program.cpf || 'Clique para editar'}
                </span>
              )}
            </div>
            
            <div className="detail-item">
              <label>Nº do Cartão:</label>
              {editingField === 'card_number' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleFieldSave('card_number')}
                  onKeyPress={(e) => handleKeyPress(e, 'card_number')}
                  autoFocus
                />
              ) : (
                <span 
                  className="editable-field"
                  onClick={() => handleFieldEdit('card_number', program.card_number)}
                >
                  {program.card_number || 'Clique para editar'}
                </span>
              )}
            </div>
            
            <div className="detail-item">
              <label>Saldo ({company.points_name}):</label>
              {editingField === 'current_balance' ? (
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleFieldSave('current_balance')}
                  onKeyPress={(e) => handleKeyPress(e, 'current_balance')}
                  autoFocus
                />
              ) : (
                <span 
                  className="editable-field balance-field"
                  onClick={() => handleFieldEdit('current_balance', program.current_balance)}
                >
                  {formatNumber(program.current_balance)}
                </span>
              )}
            </div>
            
            <div className="detail-item">
              <label>Categoria:</label>
              {editingField === 'elite_tier' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleFieldSave('elite_tier')}
                  onKeyPress={(e) => handleKeyPress(e, 'elite_tier')}
                  autoFocus
                />
              ) : (
                <span 
                  className="editable-field"
                  onClick={() => handleFieldEdit('elite_tier', program.elite_tier)}
                >
                  {program.elite_tier || 'Clique para editar'}
                </span>
              )}
            </div>
          </div>
          
          <div className="program-footer">
            <div className="last-change">
              <small>
                Última atualização: {formatDate(program.last_updated)}
              </small>
              {program.last_change && (
                <small className="change-info">
                  {program.last_change}
                </small>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GlobalLogModal = ({ globalLog, onClose, formatDate, getCompanyById }) => (
  <div className="modal-overlay">
    <div className="modal log-modal">
      <div className="modal-header">
        <h2>Log Global de Alterações</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="log-entries">
        {globalLog.length > 0 ? (
          globalLog.map(entry => (
            <div key={entry.id} className="log-entry">
              <div className="log-main">
                <span className="log-member">{entry.member_name}</span>
                <span className="log-company" style={{ color: getCompanyById(entry.company_id)?.color }}>
                  {entry.company_name}
                </span>
                <span className="log-change">
                  {entry.field_changed}: {entry.old_value} → {entry.new_value}
                </span>
              </div>
              <div className="log-time">
                {formatDate(entry.timestamp)}
              </div>
            </div>
          ))
        ) : (
          <p className="no-logs">Nenhuma alteração registrada</p>
        )}
      </div>
    </div>
  </div>
);

export default App;