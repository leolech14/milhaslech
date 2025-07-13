import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [members, setMembers] = useState([]);
  const [globalLog, setGlobalLog] = useState([]);
  const [showGlobalLog, setShowGlobalLog] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [expandedPrograms, setExpandedPrograms] = useState({});
  const [editingPrograms, setEditingPrograms] = useState({});
  const [programChanges, setProgramChanges] = useState({});
  const [copyFeedback, setCopyFeedback] = useState('');
  const [postits, setPostits] = useState([]);
  const [editingPostit, setEditingPostit] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Fixed order for family members
  const familyOrder = ["Osvandré", "Marilise", "Graciela", "Leonardo"];

  // Check if user is already authenticated and load dark mode preference
  useEffect(() => {
    const authStatus = localStorage.getItem('lech_authenticated');
    const darkModePreference = localStorage.getItem('lech_dark_mode');
    
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    
    if (darkModePreference === 'true') {
      setDarkMode(true);
    }
  }, []);

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    
    // Case-insensitive login check
    if (loginForm.username.toLowerCase() === 'lech' && loginForm.password.toLowerCase() === 'world') {
      setIsAuthenticated(true);
      localStorage.setItem('lech_authenticated', 'true');
    } else {
      setLoginError('Login ou senha incorretos');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('lech_authenticated');
  };

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

  const fetchPostits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/postits`);
      const data = await response.json();
      setPostits(data);
    } catch (error) {
      console.error('Erro ao buscar post-its:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanies();
      fetchMembers();
      fetchGlobalLog();
      fetchDashboardStats();
      fetchPostits();
    }
  }, [isAuthenticated]);

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

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('lech_dark_mode', newDarkMode.toString());
  };
  const createPostit = async (content) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/postits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (response.ok) {
        fetchPostits();
      }
    } catch (error) {
      console.error('Erro ao criar post-it:', error);
    }
  };

  const updatePostit = async (postitId, content) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/postits/${postitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (response.ok) {
        fetchPostits();
        setEditingPostit(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar post-it:', error);
    }
  };

  const deletePostit = async (postitId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/postits/${postitId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchPostits();
      }
    } catch (error) {
      console.error('Erro ao excluir post-it:', error);
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

  // Render login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={`login-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="login-box">
          <h1>Programas de Milhas</h1>
          <h2>lech.world</h2>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Login:</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Senha:</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
            </div>
            {loginError && <div className="login-error">{loginError}</div>}
            <button type="submit" className="login-btn">Entrar</button>
          </form>
          <button className="dark-mode-toggle login-dark-toggle" onClick={toggleDarkMode}>
            {darkMode ? '🔆' : '🌚'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar 
        onShowGlobalLog={() => setShowGlobalLog(true)}
        onLogout={handleLogout}
        dashboardStats={dashboardStats}
        postits={postits}
        onCreatePostit={createPostit}
        onUpdatePostit={updatePostit}
        onDeletePostit={deletePostit}
        editingPostit={editingPostit}
        setEditingPostit={setEditingPostit}
      />
      
      <main className="main-content">
        <TopBar 
          onRefresh={() => {
            fetchMembers();
            fetchGlobalLog();
            fetchDashboardStats();
            fetchPostits();
          }}
          dashboardStats={dashboardStats}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
        
        <QuoteSection />
        
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
          
          <BottomActions 
            onShowGlobalLog={() => setShowGlobalLog(true)}
            onLogout={handleLogout}
          />
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
const Sidebar = ({ onShowGlobalLog, onLogout, dashboardStats, postits, onCreatePostit, onUpdatePostit, onDeletePostit, editingPostit, setEditingPostit }) => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <h1>Programas de Milhas</h1>
      <p>Família Lech</p>
    </div>
    
    <PostItSection 
      postits={postits}
      onCreatePostit={onCreatePostit}
      onUpdatePostit={onUpdatePostit}
      onDeletePostit={onDeletePostit}
      editingPostit={editingPostit}
      setEditingPostit={setEditingPostit}
    />
  </aside>
);

const TopBar = ({ onRefresh, dashboardStats, darkMode, onToggleDarkMode }) => (
  <header className="top-bar">
    <div className="top-bar-left">
      <h2>Painel de pontos</h2>
      {dashboardStats && (
        <div className="total-points-inline">
          <span>Total:</span>
          <span>{dashboardStats.total_points.toLocaleString('pt-BR')} pontos</span>
        </div>
      )}
    </div>
    <div className="top-bar-center">
      <a href="https://www.latamairlines.com/br/pt" target="_blank" rel="noopener noreferrer" className="program-link">
        Login LATAM
      </a>
      <a href="https://b2c.voegol.com.br/minhas-viagens/login" target="_blank" rel="noopener noreferrer" className="program-link">
        Login Smiles
      </a>
      <a href="https://www.voeazul.com.br/br/pt/programa-fidelidade" target="_blank" rel="noopener noreferrer" className="program-link">
        Login Azul
      </a>
    </div>
    <div className="top-bar-right">
      <button className="dark-mode-toggle" onClick={onToggleDarkMode}>
        {darkMode ? '🔆' : '🌚'}
      </button>
      <button className="refresh-btn" onClick={onRefresh}>
        ↻ Atualizar
      </button>
    </div>
  </header>
);

const QuoteSection = () => (
  <div className="quote-section">
    <p>"Quem ta ponto ta ponto, quem não ta ponto não ta ponto" - João Lech (um viajante)</p>
  </div>
);

const PostItSection = ({ postits, onCreatePostit, onUpdatePostit, onDeletePostit, editingPostit, setEditingPostit }) => {
  const [newPostit, setNewPostit] = useState('');
  const [showNewPostit, setShowNewPostit] = useState(false);

  const handleCreatePostit = () => {
    if (newPostit.trim()) {
      onCreatePostit(newPostit.trim());
      setNewPostit('');
      setShowNewPostit(false);
    }
  };

  const handleUpdatePostit = (postitId, content) => {
    if (content.trim()) {
      onUpdatePostit(postitId, content.trim());
    }
  };

  return (
    <div className="postit-section">
      <div className="postit-header">
        <h3>Post-its</h3>
        <button className="add-postit-btn" onClick={() => setShowNewPostit(true)}>
          + Adicionar
        </button>
      </div>
      
      <div className="postits-container">
        {showNewPostit && (
          <div className="postit new-postit">
            <button className="postit-delete" onClick={() => setShowNewPostit(false)}>×</button>
            <textarea
              value={newPostit}
              onChange={(e) => setNewPostit(e.target.value)}
              placeholder="Digite seu recado..."
              autoFocus
            />
            <button className="postit-save" onClick={handleCreatePostit}>Salvar</button>
          </div>
        )}
        
        {postits.map(postit => (
          <PostItCard
            key={postit.id}
            postit={postit}
            isEditing={editingPostit === postit.id}
            onEdit={() => setEditingPostit(postit.id)}
            onSave={(content) => handleUpdatePostit(postit.id, content)}
            onCancel={() => setEditingPostit(null)}
            onDelete={() => onDeletePostit(postit.id)}
          />
        ))}
      </div>
    </div>
  );
};

const PostItCard = ({ postit, isEditing, onEdit, onSave, onCancel, onDelete }) => {
  const [editContent, setEditContent] = useState(postit.content);

  const handleSave = () => {
    onSave(editContent);
  };

  if (isEditing) {
    return (
      <div className="postit editing">
        <button className="postit-delete" onClick={onCancel}>×</button>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          autoFocus
        />
        <div className="postit-actions">
          <button className="postit-save" onClick={handleSave}>Salvar</button>
          <button className="postit-cancel" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="postit" onClick={onEdit}>
      <button className="postit-delete" onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}>×</button>
      <div className="postit-content">
        {postit.content}
      </div>
    </div>
  );
};

const BottomActions = ({ onShowGlobalLog, onLogout }) => (
  <div className="bottom-actions">
    <button className="action-btn log-btn" onClick={onShowGlobalLog}>
      📋 Histórico
    </button>
    <button className="action-btn logout-btn" onClick={onLogout}>
      🚪 Sair
    </button>
  </div>
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
      <div className="program-header" onClick={onToggle}>
        <div className="program-info">
          <span className="program-title">
            {company.name} → {formatNumber(currentData.current_balance)} {company.points_name}
          </span>
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
                <FieldDisplay label="Senha" value={currentData.password} onCopy={onCopyToClipboard} />
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

const FieldDisplay = ({ label, value, onCopy }) => (
  <div className="detail-item">
    <label>{label}:</label>
    <div className="field-with-copy">
      <span className="field-value">
        {value || "Não informado"}
      </span>
      <button 
        className="copy-btn" 
        onClick={() => onCopy(value || '')}
        title="Copiar"
      >
        📋
      </button>
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
                <span className="log-company">
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