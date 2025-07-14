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
  const [showAddCompany, setShowAddCompany] = useState({});
  const [newCompanyData, setNewCompanyData] = useState({});
  const [editingFields, setEditingFields] = useState({});
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, memberId: null, companyId: null });
  const [whatsappModal, setWhatsappModal] = useState({
    show: false,
    exportType: 'all', // 'all', 'user', 'program'
    selectedUser: 'Osvandré',
    selectedProgram: 'LATAM Pass',
    customProgram: ''
  });
  const [showWhatsappBtn, setShowWhatsappBtn] = useState(false);
  const [pullUpGesture, setPullUpGesture] = useState({
    isActive: false,
    startY: 0,
    currentY: 0,
    isDragging: false,
    progress: 0
  });

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
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Handle scroll to show/hide WhatsApp button on mobile
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        setShowWhatsappBtn(scrollY > 200); // Show after scrolling 200px on mobile
      } else {
        setShowWhatsappBtn(true); // Always show on desktop (in sidebar)
      }
    };

    // Handle ESC key for modals
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (whatsappModal.show) {
          hideWhatsappModal();
        }
        if (deleteConfirmModal.show) {
          hideDeleteConfirm();
        }
      }
    };

    // Initial check
    handleScroll();

    document.addEventListener('keydown', handleEsc);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [whatsappModal.show, deleteConfirmModal.show]);

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
    
    // Apply dark mode class to body for global texture
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // Add new company functions
  const showAddCompanyModal = (memberId) => {
    setShowAddCompany(prev => ({...prev, [memberId]: true}));
    setNewCompanyData(prev => ({
      ...prev,
      [memberId]: {
        company_name: '',
        color: '#4a90e2'
      }
    }));
  };

  const hideAddCompanyModal = (memberId) => {
    setShowAddCompany(prev => ({...prev, [memberId]: false}));
    setNewCompanyData(prev => ({...prev, [memberId]: {}}));
  };

  const updateNewCompanyField = (memberId, field, value) => {
    setNewCompanyData(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value
      }
    }));
  };

  const createNewCompany = async (memberId) => {
    const companyData = newCompanyData[memberId];
    if (!companyData?.company_name) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });
      
      if (response.ok) {
        await fetchMembers();
        await fetchCompanies();
        await fetchGlobalLog();
        await fetchDashboardStats();
        hideAddCompanyModal(memberId);
      } else {
        console.error('Erro ao criar nova companhia');
      }
    } catch (error) {
      console.error('Erro ao criar nova companhia:', error);
    }
  };

  // Delete program function
  const showDeleteConfirm = (memberId, companyId) => {
    setDeleteConfirmModal({ show: true, memberId, companyId });
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirmModal({ show: false, memberId: null, companyId: null });
  };

  const confirmDeleteProgram = async () => {
    const { memberId, companyId } = deleteConfirmModal;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/programs/${companyId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchMembers();
        await fetchCompanies();
        await fetchGlobalLog();
        await fetchDashboardStats();
        hideDeleteConfirm();
      } else {
        console.error('Erro ao excluir programa');
      }
    } catch (error) {
      console.error('Erro ao excluir programa:', error);
    }
  };

  // Toggle field editing mode
  const toggleFieldEditing = (memberId, companyId) => {
    const key = `${memberId}-${companyId}`;
    setEditingFields(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Confirm field editing changes
  const confirmFieldEditing = (memberId, companyId) => {
    const key = `${memberId}-${companyId}`;
    setEditingFields(prev => ({
      ...prev,
      [key]: false
    }));
  };

  // Cancel field editing
  const cancelFieldEditing = (memberId, companyId) => {
    const key = `${memberId}-${companyId}`;
    setEditingFields(prev => ({
      ...prev,
      [key]: false
    }));
  };

  // Add new field
  const addNewField = async (memberId, companyId) => {
    const fieldName = prompt('Nome do novo campo:');
    if (!fieldName) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/programs/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [fieldName]: '' }),
      });
      
      if (response.ok) {
        await fetchMembers();
        await fetchGlobalLog();
      }
    } catch (error) {
      console.error('Erro ao adicionar campo:', error);
    }
  };

  // WhatsApp Export Functions
  const showWhatsappModal = () => {
    setWhatsappModal(prev => ({ ...prev, show: true }));
  };

  const hideWhatsappModal = () => {
    setWhatsappModal({
      show: false,
      exportType: 'all',
      selectedUser: 'Osvandré',
      selectedProgram: 'LATAM Pass',
      customProgram: ''
    });
  };

  const updateWhatsappModal = (field, value) => {
    setWhatsappModal(prev => ({ ...prev, [field]: value }));
  };

  const getAllData = () => {
    let message = "=== RESUMO COMPLETO - PROGRAMAS DE PONTOS ===\n\n";
    
    members.forEach(member => {
      // Get member's CPF from any program that has it
      let memberCPF = '';
      Object.values(member.programs || {}).forEach(program => {
        if (program.cpf && !memberCPF) {
          memberCPF = program.cpf;
        }
      });

      message += `>>> ${member.name.toUpperCase()}`;
      if (memberCPF) message += ` (CPF: ${memberCPF})`;
      message += "\n";
      
      companies.forEach(company => {
        const program = member.programs[company.id];
        if (program) {
          message += `\n* ${company.name}:\n`;
          message += `  - Pontos: ${formatNumber(program.current_balance)}\n`;
          if (program.login) message += `  - Login: ${program.login}\n`;
          if (program.password) message += `  - Senha: ${program.password}\n`;
          if (program.card_number) message += `  - No. Cartao: ${program.card_number}\n`;
          if (program.elite_tier) message += `  - Categoria: ${program.elite_tier}\n`;
          
          // Add custom fields
          if (program.custom_fields) {
            Object.entries(program.custom_fields).forEach(([key, value]) => {
              if (value) message += `  - ${key}: ${value}\n`;
            });
          }
          
          if (program.last_updated) {
            message += `  - Atualizado: ${formatDate(program.last_updated)}\n`;
          }
        }
      });
      message += "\n";
    });
    
    message += `>>> TOTAL GERAL: ${formatNumber(dashboardStats.total_points)} pontos\n`;
    message += `>>> Exportado em: ${new Date().toLocaleDateString('pt-BR')}`;
    
    return message;
  };

  const getUserData = (userName) => {
    const member = members.find(m => m.name === userName);
    if (!member) return "Usuario nao encontrado";
    
    // Get member's CPF from any program that has it
    let memberCPF = '';
    Object.values(member.programs || {}).forEach(program => {
      if (program.cpf && !memberCPF) {
        memberCPF = program.cpf;
      }
    });

    let message = `>>> DADOS COMPLETOS DE ${member.name.toUpperCase()}`;
    if (memberCPF) message += ` (CPF: ${memberCPF})`;
    message += "\n\n";
    
    companies.forEach(company => {
      const program = member.programs[company.id];
      if (program) {
        message += `* ${company.name}:\n`;
        message += `  - Pontos: ${formatNumber(program.current_balance)}\n`;
        
        // All standard fields except CPF (already shown with name)
        if (program.login) message += `  - Login: ${program.login}\n`;
        if (program.password) message += `  - Senha: ${program.password}\n`;
        if (program.card_number) message += `  - No. Cartao: ${program.card_number}\n`;
        if (program.elite_tier) message += `  - Categoria: ${program.elite_tier}\n`;
        if (program.notes) message += `  - Observacoes: ${program.notes}\n`;
        
        // Add ALL custom fields created by user
        if (program.custom_fields && Object.keys(program.custom_fields).length > 0) {
          message += `  - Campos Personalizados:\n`;
          Object.entries(program.custom_fields).forEach(([key, value]) => {
            message += `    * ${key}: ${value || 'Nao preenchido'}\n`;
          });
        }
        
        // Add any other fields that might exist in the program object
        const standardFields = ['company_id', 'login', 'password', 'cpf', 'card_number', 'current_balance', 'elite_tier', 'notes', 'last_updated', 'last_change', 'custom_fields'];
        Object.entries(program).forEach(([key, value]) => {
          if (!standardFields.includes(key) && value && value !== '') {
            message += `  - ${key}: ${value}\n`;
          }
        });
        
        if (program.last_updated) {
          message += `  - Ultima atualizacao: ${formatDate(program.last_updated)}\n`;
        }
        if (program.last_change) {
          message += `  - Ultima alteracao: ${program.last_change}\n`;
        }
        message += "\n";
      }
    });
    
    message += `>>> Exportado em: ${new Date().toLocaleDateString('pt-BR')}`;
    return message;
  };

  const getProgramData = (programName) => {
    const company = companies.find(c => c.name.toLowerCase() === programName.toLowerCase());
    if (!company) {
      // Try to find by custom program name in any member's programs
      let foundData = false;
      let message = `>>> DADOS DO PROGRAMA ${programName.toUpperCase()}\n\n`;
      
      members.forEach(member => {
        Object.values(member.programs).forEach(program => {
          const companyData = companies.find(c => c.id === program.company_id);
          if (companyData && companyData.name.toLowerCase() === programName.toLowerCase()) {
            foundData = true;
            
            // Get member's CPF
            let memberCPF = '';
            Object.values(member.programs || {}).forEach(prog => {
              if (prog.cpf && !memberCPF) {
                memberCPF = prog.cpf;
              }
            });

            message += `* ${member.name}`;
            if (memberCPF) message += ` (CPF: ${memberCPF})`;
            message += ":\n";
            
            message += `  - Pontos: ${formatNumber(program.current_balance)}\n`;
            if (program.login) message += `  - Login: ${program.login}\n`;
            if (program.password) message += `  - Senha: ${program.password}\n`;
            if (program.card_number) message += `  - No. Cartao: ${program.card_number}\n`;
            if (program.elite_tier) message += `  - Categoria: ${program.elite_tier}\n`;
            if (program.notes) message += `  - Observacoes: ${program.notes}\n`;
            
            // Custom fields
            if (program.custom_fields) {
              Object.entries(program.custom_fields).forEach(([key, value]) => {
                if (value) message += `  - ${key}: ${value}\n`;
              });
            }
            
            if (program.last_updated) {
              message += `  - Atualizado: ${formatDate(program.last_updated)}\n`;
            }
            message += "\n";
          }
        });
      });
      
      if (!foundData) return "Programa nao encontrado";
      return message + `>>> Exportado em: ${new Date().toLocaleDateString('pt-BR')}`;
    }
    
    let message = `>>> DADOS COMPLETOS DO ${company.name.toUpperCase()}\n\n`;
    
    members.forEach(member => {
      const program = member.programs[company.id];
      if (program) {
        // Get member's CPF
        let memberCPF = '';
        Object.values(member.programs || {}).forEach(prog => {
          if (prog.cpf && !memberCPF) {
            memberCPF = prog.cpf;
          }
        });

        message += `* ${member.name}`;
        if (memberCPF) message += ` (CPF: ${memberCPF})`;
        message += ":\n";
        
        message += `  - Pontos: ${formatNumber(program.current_balance)}\n`;
        
        // Include ALL fields for complete export (except CPF)
        if (program.login) message += `  - Login: ${program.login}\n`;
        if (program.password) message += `  - Senha: ${program.password}\n`;
        if (program.card_number) message += `  - No. Cartao: ${program.card_number}\n`;
        if (program.elite_tier) message += `  - Categoria: ${program.elite_tier}\n`;
        if (program.notes) message += `  - Observacoes: ${program.notes}\n`;
        
        // Custom fields
        if (program.custom_fields && Object.keys(program.custom_fields).length > 0) {
          Object.entries(program.custom_fields).forEach(([key, value]) => {
            message += `  - ${key}: ${value || 'Nao preenchido'}\n`;
          });
        }
        
        // Any additional fields
        const standardFields = ['company_id', 'login', 'password', 'cpf', 'card_number', 'current_balance', 'elite_tier', 'notes', 'last_updated', 'last_change', 'custom_fields'];
        Object.entries(program).forEach(([key, value]) => {
          if (!standardFields.includes(key) && value && value !== '') {
            message += `  - ${key}: ${value}\n`;
          }
        });
        
        if (program.last_updated) {
          message += `  - Atualizado: ${formatDate(program.last_updated)}\n`;
        }
        message += "\n";
      }
    });
    
    message += `>>> Exportado em: ${new Date().toLocaleDateString('pt-BR')}`;
    return message;
  };

  const generateWhatsappMessage = () => {
    const { exportType, selectedUser, selectedProgram, customProgram } = whatsappModal;
    
    switch (exportType) {
      case 'all':
        return getAllData();
      case 'user':
        return getUserData(selectedUser);
      case 'program':
        const programName = customProgram || selectedProgram;
        return getProgramData(programName);
      default:
        return getAllData();
    }
  };

  const exportToWhatsapp = () => {
    const message = generateWhatsappMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    hideWhatsappModal();
  };

  // Delete individual field
  const deleteField = async (memberId, companyId, fieldName) => {
    if (!confirm(`Tem certeza que deseja excluir o campo "${fieldName}"?`)) return;

    try {
      // Get current member data
      const member = members.find(m => m.id === memberId);
      const program = member.programs[companyId];
      
      // Send empty value to effectively remove the field
      const updateData = { [fieldName]: '' };
      
      // Send update to backend
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/programs/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (response.ok) {
        await fetchMembers();
        await fetchGlobalLog();
      } else {
        console.error('Erro ao deletar campo');
      }
    } catch (error) {
      console.error('Erro ao deletar campo:', error);
    }
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
        <button className="dark-mode-toggle global-dark-toggle" onClick={toggleDarkMode}>
          {darkMode ? '🔆' : '🌚'}
        </button>
        <div className="login-box">
          <h1>Programas de Pontos</h1>
          <div className="brand-card">
            <span className="brand-text">lech.world</span>
          </div>
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
        showWhatsappBtn={showWhatsappBtn}
        showWhatsappModal={showWhatsappModal}
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
              showAddCompany={showAddCompany[member.id]}
              newCompanyData={newCompanyData[member.id] || {}}
              onShowAddCompany={() => showAddCompanyModal(member.id)}
              onHideAddCompany={() => hideAddCompanyModal(member.id)}
              onUpdateNewCompanyField={(field, value) => updateNewCompanyField(member.id, field, value)}
              onCreateNewCompany={() => createNewCompany(member.id)}
              editingFields={editingFields}
              setEditingFields={setEditingFields}
              onDeleteProgram={(companyId) => showDeleteConfirm(member.id, companyId)}
              onToggleFieldEditing={(companyId) => toggleFieldEditing(member.id, companyId)}
              onConfirmFieldEditing={(companyId) => confirmFieldEditing(member.id, companyId)}
              onCancelFieldEditing={(companyId) => cancelFieldEditing(member.id, companyId)}
              onDeleteField={(companyId, fieldName) => deleteField(member.id, companyId, fieldName)}
              onAddNewField={(companyId) => addNewField(member.id, companyId)}
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
      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirm-modal">
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir este programa de pontos?</p>
            <p><strong>Esta ação não pode ser desfeita.</strong></p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={hideDeleteConfirm}>
                Cancelar
              </button>
              <button className="delete-confirm-btn" onClick={confirmDeleteProgram}>
                🗑️ Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {copyFeedback && (
        <div className="copy-feedback">
          {copyFeedback}
        </div>
      )}

      {/* Mobile WhatsApp Button - Only visible on mobile */}
      <button 
        className={`whatsapp-btn-mobile ${showWhatsappBtn ? 'show' : ''}`}
        onClick={showWhatsappModal}
        aria-label="Exportar dados para WhatsApp"
      >
        <svg 
          viewBox="0 0 24 24" 
          width="24" 
          height="24" 
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
        </svg>
        <span>Exportar para WhatsApp</span>
      </button>

      {/* WhatsApp Export Modal */}
      {whatsappModal.show && (
        <div className="modal-overlay" onClick={hideWhatsappModal}>
          <div className="modal-content whatsapp-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📱 Exportar para WhatsApp</h3>
            <p>Selecione quais informações deseja exportar:</p>
            
            <div className="export-options">
              <label className="export-option">
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={whatsappModal.exportType === 'all'}
                  onChange={(e) => updateWhatsappModal('exportType', e.target.value)}
                />
                <span>📊 Todas as informações</span>
              </label>
              
              <label className="export-option">
                <input
                  type="radio"
                  name="exportType"
                  value="user"
                  checked={whatsappModal.exportType === 'user'}
                  onChange={(e) => updateWhatsappModal('exportType', e.target.value)}
                />
                <span>👤 Todas do usuário:</span>
              </label>
              
              {whatsappModal.exportType === 'user' && (
                <div className="user-options">
                  {['Osvandré', 'Marilise', 'Graciela', 'Leonardo'].map(name => (
                    <label key={name} className="sub-option">
                      <input
                        type="radio"
                        name="selectedUser"
                        value={name}
                        checked={whatsappModal.selectedUser === name}
                        onChange={(e) => updateWhatsappModal('selectedUser', e.target.value)}
                      />
                      <span>{name}</span>
                    </label>
                  ))}
                </div>
              )}
              
              <label className="export-option">
                <input
                  type="radio"
                  name="exportType"
                  value="program"
                  checked={whatsappModal.exportType === 'program'}
                  onChange={(e) => updateWhatsappModal('exportType', e.target.value)}
                />
                <span>✈️ Todas do programa:</span>
              </label>
              
              {whatsappModal.exportType === 'program' && (
                <div className="program-options">
                  {['LATAM Pass', 'Smiles', 'TudoAzul'].map(program => (
                    <label key={program} className="sub-option">
                      <input
                        type="radio"
                        name="selectedProgram"
                        value={program}
                        checked={whatsappModal.selectedProgram === program && !whatsappModal.customProgram}
                        onChange={(e) => {
                          updateWhatsappModal('selectedProgram', e.target.value);
                          updateWhatsappModal('customProgram', '');
                        }}
                      />
                      <span>{program}</span>
                    </label>
                  ))}
                  <div className="custom-program">
                    <label>Outro programa:</label>
                    <input
                      type="text"
                      placeholder="Digite o nome do programa"
                      value={whatsappModal.customProgram}
                      onChange={(e) => updateWhatsappModal('customProgram', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={hideWhatsappModal}>
                Cancelar
              </button>
              <button className="whatsapp-export-btn" onClick={exportToWhatsapp}>
                📱 Enviar para WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Components
const Sidebar = ({ onShowGlobalLog, onLogout, dashboardStats, postits, onCreatePostit, onUpdatePostit, onDeletePostit, editingPostit, setEditingPostit, showWhatsappBtn, showWhatsappModal }) => {
  const handleEditPostit = (postitId) => {
    setEditingPostit(postitId);
  };

  const handleSavePostit = (postitId, content) => {
    onUpdatePostit(postitId, content);
  };

  const handleCancelEdit = () => {
    setEditingPostit(null);
  };

  const handleDeletePostit = (postitId) => {
    onDeletePostit(postitId);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Programas de Pontos</h1>
        <p>lech.world</p>
      </div>
      
      <div className="postits-container">
        <h3>Post-its</h3>
        <button className="add-postit-btn" onClick={() => onCreatePostit('')}>
          ➕ Adicionar
        </button>
        
        <div className="postits-grid">
          {postits.map(postit => (
            <div key={postit.id} className="postit">
              {editingPostit === postit.id ? (
                <div>
                  <textarea 
                    defaultValue={postit.content}
                    onBlur={(e) => handleSavePostit(postit.id, e.target.value)}
                  />
                  <button onClick={handleCancelEdit}>Cancelar</button>
                </div>
              ) : (
                <div onClick={() => handleEditPostit(postit.id)}>
                  {postit.content}
                  <button onClick={() => handleDeletePostit(postit.id)}>×</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp Export Button in Sidebar */}
      {showWhatsappBtn && (
        <button 
          className="whatsapp-btn sidebar-whatsapp"
          onClick={showWhatsappModal}
          aria-label="Exportar dados para WhatsApp"
        >
          <svg 
            viewBox="0 0 24 24" 
            width="20" 
            height="20" 
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
          </svg>
          <span>WhatsApp</span>
        </button>
      )}
    </aside>
  );
};

const TopBar = ({ onRefresh, dashboardStats, darkMode, onToggleDarkMode }) => (
  <header className="top-bar">
    <div className="top-bar-left">
      <h2>Painel</h2>
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
  onCopyToClipboard, formatDate, formatNumber, getCompanyById,
  showAddCompany, newCompanyData, onShowAddCompany, onHideAddCompany,
  onUpdateNewCompanyField, onCreateNewCompany, editingFields, setEditingFields,
  onDeleteProgram, onToggleFieldEditing, onConfirmFieldEditing, onCancelFieldEditing,
  onDeleteField, onAddNewField
}) => {
  return (
    <div className="member-card">
      <div className="member-header">
        <h3>{member.name}</h3>
        <button 
          className="add-company-btn"
          onClick={onShowAddCompany}
          title="Clique para adicionar novo programa de pontos"
        >
          + Programa
        </button>
      </div>
      
      {showAddCompany && (
        <div className="add-company-modal">
          <h4>Adicionar Novo Programa de Pontos</h4>
          <div className="form-group">
            <label>Nome da Companhia:</label>
            <input
              type="text"
              value={newCompanyData.company_name || ''}
              onChange={(e) => onUpdateNewCompanyField('company_name', e.target.value)}
              placeholder="Ex: Emirates, United, etc."
            />
          </div>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onHideAddCompany}>
              Cancelar
            </button>
            <button 
              className="save-btn" 
              onClick={onCreateNewCompany}
              disabled={!newCompanyData.company_name}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}
      
      <div className="programs-container">
        {companies.map(company => {
          const program = member.programs[company.id];
          if (!program) return null;
          
          const isExpanded = expandedPrograms[`${member.id}-${company.id}`];
          const isEditing = editingPrograms[`${member.id}-${company.id}`];
          const changes = programChanges[`${member.id}-${company.id}`] || {};
          const isEditingFields = editingFields[`${member.id}-${company.id}`];
          
          return (
            <ProgramBlock
              key={company.id}
              member={member}
              company={company}
              program={program}
              isExpanded={isExpanded}
              isEditing={isEditing}
              isEditingFields={isEditingFields}
              changes={changes}
              onToggle={() => onToggleProgram(member.id, company.id)}
              onStartEditing={() => onStartEditing(member.id, company.id, program)}
              onCancelEditing={() => onCancelEditing(member.id, company.id)}
              onUpdateField={(field, value) => onUpdateField(member.id, company.id, field, value)}
              onSaveChanges={() => onSaveChanges(member.id, company.id)}
              onCopyToClipboard={onCopyToClipboard}
              formatDate={formatDate}
              formatNumber={formatNumber}
              onDeleteProgram={() => onDeleteProgram(company.id)}
              onToggleFieldEditing={() => onToggleFieldEditing(company.id)}
              onConfirmFieldEditing={() => onConfirmFieldEditing(company.id)}
              onCancelFieldEditing={() => onCancelFieldEditing(company.id)}
              onDeleteField={(fieldName) => onDeleteField(company.id, fieldName)}
              onAddNewField={() => onAddNewField(company.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

const ProgramBlock = ({ 
  member, company, program, isExpanded, isEditing, isEditingFields, changes,
  onToggle, onStartEditing, onCancelEditing, onUpdateField, onSaveChanges,
  onCopyToClipboard, formatDate, formatNumber, onDeleteProgram, onToggleFieldEditing,
  onConfirmFieldEditing, onCancelFieldEditing, onDeleteField, onAddNewField
}) => {
  const currentData = { ...program, ...changes };

  return (
    <div className={`program-block ${isExpanded ? 'expanded' : ''}`}>
      <div className="program-header" onClick={onToggle}>
        <div className="program-info">
          <span className="program-title">
            {company.name} → {formatNumber(currentData.current_balance)} pontos
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
                  label="Saldo (pontos)" 
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
                <EditableFieldWithDelete 
                  label="Login" 
                  value={currentData.login} 
                  onChange={(value) => onUpdateField('login', value)}
                  onDelete={onDeleteField}
                  canDelete={isEditingFields}
                />
                <EditableFieldWithDelete 
                  label="Senha" 
                  value={currentData.password} 
                  onChange={(value) => onUpdateField('password', value)}
                  onDelete={onDeleteField}
                  canDelete={isEditingFields}
                />
                <EditableFieldWithDelete 
                  label="CPF" 
                  value={currentData.cpf} 
                  onChange={(value) => onUpdateField('cpf', value)}
                  onDelete={onDeleteField}
                  canDelete={isEditingFields}
                />
                <EditableFieldWithDelete 
                  label="Nº do Cartão" 
                  value={currentData.card_number} 
                  onChange={(value) => onUpdateField('card_number', value)}
                  onDelete={onDeleteField}
                  canDelete={isEditingFields}
                />
                <EditableFieldWithDelete 
                  label="Saldo (pontos)" 
                  value={currentData.current_balance} 
                  onChange={(value) => onUpdateField('current_balance', value)}
                  type="number"
                  onDelete={onDeleteField}
                  canDelete={isEditingFields}
                />
                <EditableFieldWithDelete 
                  label="Categoria" 
                  value={currentData.elite_tier} 
                  onChange={(value) => onUpdateField('elite_tier', value)}
                  onDelete={onDeleteField}
                  canDelete={isEditingFields}
                />
              </div>
              
              <div className="edit-actions">
                <div className="left-actions">
                  {!isEditingFields ? (
                    <>
                      <button className="field-edit-btn" onClick={onToggleFieldEditing}>
                        🔧 Editar campos
                      </button>
                      <button className="delete-program-btn" onClick={onDeleteProgram}>
                        🗑️ Deletar programa
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="add-field-btn" onClick={onAddNewField}>
                        ➕ Adicionar campo
                      </button>
                      <button className="confirm-field-btn" onClick={onConfirmFieldEditing}>
                        ✅ Confirmar
                      </button>
                      <button className="cancel-field-btn" onClick={onCancelFieldEditing}>
                        ❌ Cancelar
                      </button>
                    </>
                  )}
                </div>
                <div className="right-actions">
                  <button className="cancel-btn" onClick={onCancelEditing}>
                    Cancelar
                  </button>
                  <button className="save-btn" onClick={onSaveChanges}>
                    Salvar
                  </button>
                </div>
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

const EditableFieldWithDelete = ({ label, value, onChange, onDelete, type = "text", canDelete = false }) => {
  return (
    <div className="field-group">
      <div className="field-container">
        <label className="field-label">{label}:</label>
        {canDelete && (
          <button className="delete-field-btn" onClick={() => onDelete(label)}>
            ×
          </button>
        )}
      </div>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
      />
    </div>
  );
};

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