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
  const [editingPrograms, setEditingPrograms] = useState({});
  const [programChanges, setProgramChanges] = useState({});
  const [copyFeedback, setCopyFeedback] = useState('');

  // Fixed order for family members
  const familyOrder = ["Osvandré", "Marilise", "Graciela", "Leonardo"];

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
      // Sort members according to family order
      const sortedMembers = data.sort((a, b) => {
        const indexA = familyOrder.indexOf(a.name);
        const indexB = familyOrder.indexOf(b.name);
        return indexA - indexB;
      });
      setMembers(sortedMembers);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    }
  };

  const fetchGlobalLog = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/global-log`);
      const data = await response.json();
      // Reverse the log so newest entries appear at the bottom
      setGlobalLog(data.reverse());
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
    
    // Clear any editing state when collapsing
    if (expandedPrograms[key]) {
      setEditingPrograms(prev => ({
        ...prev,
        [key]: false
      }));
      setProgramChanges(prev => ({
        ...prev,
        [key]: {}
      }));
    }
  };

  // Start editing a program
  const startEditing = (memberId, companyId, currentData) => {
    const key = `${memberId}-${companyId}`;
    setEditingPrograms(prev => ({
      ...prev,
      [key]: true
    }));
    setProgramChanges(prev => ({
      ...prev,
      [key]: { ...currentData }
    }));
  };

  // Cancel editing
  const cancelEditing = (memberId, companyId) => {
    const key = `${memberId}-${companyId}`;
    setEditingPrograms(prev => ({
      ...prev,
      [key]: false
    }));
    setProgramChanges(prev => ({
      ...prev,
      [key]: {}
    }));
  };

  // Update field in editing state
  const updateEditingField = (memberId, companyId, field, value) => {
    const key = `${memberId}-${companyId}`;
    setProgramChanges(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'current_balance' ? parseInt(value) || 0 : value
      }
    }));
  };

  // Save changes
  const saveChanges = async (memberId, companyId) => {
    const key = `${memberId}-${companyId}`;
    const changes = programChanges[key];
    
    if (!changes || Object.keys(changes).length === 0) {
      cancelEditing(memberId, companyId);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/programs/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
      });
      
      if (response.ok) {
        await fetchMembers();
        await fetchGlobalLog();
        await fetchDashboardStats();
        cancelEditing(memberId, companyId);
      } else {
        console.error('Erro ao salvar alterações');
      }
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback('Copiado com sucesso');
      setTimeout(() => setCopyFeedback(''), 1000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
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
        
        <div className="members-container">
          {members.map(member => (
            <MemberCard 
              key={member.id}
              member={member}
              companies={companies}
              expandedPrograms={expandedPrograms}
              editingPrograms={editingPrograms}
              programChanges={programChanges}
              onToggleProgram={toggleProgram}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onUpdateField={updateEditingField}
              onSaveChanges={saveChanges}
              onCopyToClipboard={copyToClipboard}
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

      {copyFeedback && (
        <div className="copy-feedback">
          {copyFeedback}
        </div>
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
      📋 Histórico de Atualizações
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

const MemberCard = ({ 
  member, companies, expandedPrograms, editingPrograms, programChanges,
  onToggleProgram, onStartEditing, onCancelEditing, onUpdateField, onSaveChanges,
  onCopyToClipboard, formatDate, formatNumber, getCompanyById 
}) => {
  return (
    <div className="member-card">
      <div className="member-header">
        <h3>{member.name}</h3>
      </div>
      
      <div className="programs-container">
        {companies.map(company => {
          const program = member.programs[company.id];
          const isExpanded = expandedPrograms[`${member.id}-${company.id}`];
          const isEditing = editingPrograms[`${member.id}-${company.id}`];
          const changes = programChanges[`${member.id}-${company.id}`] || {};
          
          return (
            <ProgramBlock
              key={company.id}
              member={member}
              company={company}
              program={program}
              isExpanded={isExpanded}
              isEditing={isEditing}
              changes={changes}
              onToggle={() => onToggleProgram(member.id, company.id)}
              onStartEditing={() => onStartEditing(member.id, company.id, program)}
              onCancelEditing={() => onCancelEditing(member.id, company.id)}
              onUpdateField={(field, value) => onUpdateField(member.id, company.id, field, value)}
              onSaveChanges={() => onSaveChanges(member.id, company.id)}
              onCopyToClipboard={onCopyToClipboard}
              formatDate={formatDate}
              formatNumber={formatNumber}
            />
          );
        })}
      </div>
    </div>
  );
};

const ProgramBlock = ({ 
  member, company, program, isExpanded, isEditing, changes,
  onToggle, onStartEditing, onCancelEditing, onUpdateField, onSaveChanges,
  onCopyToClipboard, formatDate, formatNumber 
}) => {
  const currentData = { ...program, ...changes };

  return (
    <div className={`program-block ${isExpanded ? 'expanded' : ''}`}>
      <div className="program-header" onClick={onToggle} style={{ borderLeft: `4px solid ${company.color}` }}>
        <div className="program-info">
          <h4>{company.name}</h4>
          <p className="program-balance">
            {formatNumber(currentData.current_balance)} {company.points_name}
          </p>
        </div>
        <div className="expand-icon">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="program-details">
          {!isEditing ? (
            <div className="view-mode">
              <div className="detail-grid">
                <FieldDisplay label="Login" value={currentData.login} onCopy={onCopyToClipboard} />
                <FieldDisplay label="Senha" value={currentData.password} onCopy={onCopyToClipboard} type="password" />
                <FieldDisplay label="CPF" value={currentData.cpf} onCopy={onCopyToClipboard} />
                <FieldDisplay label="Nº do Cartão" value={currentData.card_number} onCopy={onCopyToClipboard} />
                <FieldDisplay 
                  label={`Saldo (${company.points_name})`} 
                  value={formatNumber(currentData.current_balance)} 
                  onCopy={onCopyToClipboard} 
                />
                <FieldDisplay label="Categoria" value={currentData.elite_tier} onCopy={onCopyToClipboard} />
              </div>
              
              <button className="edit-btn" onClick={onStartEditing}>
                ✏️ Editar
              </button>
              
              <div className="program-footer">
                <div className="last-change">
                  <small>Última atualização: {formatDate(program.last_updated)}</small>
                  {program.last_change && (
                    <small className="change-info">{program.last_change}</small>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="edit-mode">
              <div className="detail-grid">
                <EditableField 
                  label="Login" 
                  value={currentData.login} 
                  onChange={(value) => onUpdateField('login', value)}
                />
                <EditableField 
                  label="Senha" 
                  value={currentData.password} 
                  onChange={(value) => onUpdateField('password', value)}
                  type="password"
                />
                <EditableField 
                  label="CPF" 
                  value={currentData.cpf} 
                  onChange={(value) => onUpdateField('cpf', value)}
                />
                <EditableField 
                  label="Nº do Cartão" 
                  value={currentData.card_number} 
                  onChange={(value) => onUpdateField('card_number', value)}
                />
                <EditableField 
                  label={`Saldo (${company.points_name})`} 
                  value={currentData.current_balance} 
                  onChange={(value) => onUpdateField('current_balance', value)}
                  type="number"
                />
                <EditableField 
                  label="Categoria" 
                  value={currentData.elite_tier} 
                  onChange={(value) => onUpdateField('elite_tier', value)}
                />
              </div>
              
              <div className="edit-actions">
                <button className="cancel-btn" onClick={onCancelEditing}>
                  Cancelar
                </button>
                <button className="save-btn" onClick={onSaveChanges}>
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FieldDisplay = ({ label, value, onCopy, type = "text" }) => (
  <div className="detail-item">
    <label>{label}:</label>
    <div className="field-with-copy">
      <span className="field-value">
        {type === "password" && value ? "••••••••" : (value || "Não informado")}
      </span>
      {value && (
        <button 
          className="copy-btn" 
          onClick={() => onCopy(value)}
          title="Copiar"
        >
          📋
        </button>
      )}
    </div>
  </div>
);

const EditableField = ({ label, value, onChange, type = "text" }) => (
  <div className="detail-item">
    <label>{label}:</label>
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="edit-input"
    />
  </div>
);

const GlobalLogModal = ({ globalLog, onClose, formatDate, getCompanyById }) => (
  <div className="modal-overlay">
    <div className="modal log-modal">
      <div className="modal-header">
        <h2>Histórico de Atualizações</h2>
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
          <p className="no-logs">Nenhuma atualização registrada</p>
        )}
      </div>
    </div>
  </div>
);

export default App;