import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

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
  const [saveFeedback, setSaveFeedback] = useState({});
  const [postits, setPostits] = useState([]);
  const [editingPostit, setEditingPostit] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState({});
  const [newCompanyData, setNewCompanyData] = useState({});
  const [editingFields, setEditingFields] = useState({});
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, memberId: null, companyId: null });
  const [deleteMemberModal, setDeleteMemberModal] = useState({ show: false, memberId: null, memberName: null });
  const [whatsappModal, setWhatsappModal] = useState({
    show: false,
    exportType: 'all', // 'all', 'user', 'program'
    selectedUser: 'Osvandré',
    selectedProgram: 'LATAM Pass',
    customProgram: ''
  });
  const [uiSmartSystem, setUiSmartSystem] = useState({
    isActive: true,
    detectedIssues: [],
    fixedIssues: [],
    lastCheck: Date.now()
  });
  const [fieldRenaming, setFieldRenaming] = useState({
    isActive: false,
    memberId: null,
    companyId: null,
    fieldName: '',
    newName: ''
  });
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    name: ''
  });

  // Fixed order for family members
  const familyOrder = ["Osvandré", "Marilise", "Graciela", "Leonardo"];

  // UI-Smart System - Continuously monitor and fix UI issues
  useEffect(() => {
    if (!uiSmartSystem.isActive) return;

    const checkUIHealth = () => {
      const issues = [];
      const fixes = [];

      // Check for contrast issues
      const checkContrast = () => {
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          const computedStyle = window.getComputedStyle(el);
          const bgColor = computedStyle.backgroundColor;
          const color = computedStyle.color;
          
          // Convert colors to luminance and check contrast ratio
          if (bgColor && color && bgColor !== 'rgba(0, 0, 0, 0)') {
            const bgLuminance = getLuminance(bgColor);
            const textLuminance = getLuminance(color);
            const contrast = (Math.max(bgLuminance, textLuminance) + 0.05) / (Math.min(bgLuminance, textLuminance) + 0.05);
            
            if (contrast < 4.5) {
              issues.push({
                type: 'contrast',
                element: el,
                issue: `Low contrast ratio: ${contrast.toFixed(2)}`,
                severity: 'medium'
              });
              
              // Auto-fix: Adjust text color for better contrast
              if (darkMode) {
                el.style.color = '#ffffff';
              } else {
                el.style.color = '#1a1a1a';
              }
              fixes.push(`Fixed contrast for ${el.tagName.toLowerCase()}`);
            }
          }
        });
      };

      // Check for overlapping elements
      const checkOverlaps = () => {
        const buttons = document.querySelectorAll('button, .clickable');
        buttons.forEach(button => {
          const rect = button.getBoundingClientRect();
          const elementsAtPoint = document.elementsFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
          
          if (elementsAtPoint.length > 1 && elementsAtPoint[0] !== button) {
            issues.push({
              type: 'overlap',
              element: button,
              issue: 'Element is overlapped by other elements',
              severity: 'high'
            });
            
            // Auto-fix: Increase z-index
            button.style.zIndex = '10';
            button.style.position = 'relative';
            fixes.push(`Fixed overlap for ${button.textContent || button.className}`);
          }
        });
      };

      // Check for text positioning issues
      const checkTextPositioning = () => {
        const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, label');
        textElements.forEach(el => {
          const computedStyle = window.getComputedStyle(el);
          const lineHeight = parseFloat(computedStyle.lineHeight);
          const fontSize = parseFloat(computedStyle.fontSize);
          
          // Check if line-height is too small
          if (lineHeight < fontSize * 1.2) {
            issues.push({
              type: 'text-spacing',
              element: el,
              issue: 'Line height too small for readability',
              severity: 'low'
            });
            
            // Auto-fix: Improve line height
            el.style.lineHeight = '1.4';
            fixes.push(`Fixed line height for text element`);
          }
          
          // Check if text is cut off
          if (el.scrollHeight > el.clientHeight) {
            issues.push({
              type: 'text-overflow',
              element: el,
              issue: 'Text is cut off',
              severity: 'medium'
            });
            
            // Auto-fix: Adjust container
            el.style.overflow = 'visible';
            el.style.whiteSpace = 'normal';
            fixes.push(`Fixed text overflow`);
          }
        });
      };

      // Check for hidden elements that should be visible
      const checkHiddenElements = () => {
        const importantElements = document.querySelectorAll('.important, [data-important="true"]');
        importantElements.forEach(el => {
          const computedStyle = window.getComputedStyle(el);
          if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            issues.push({
              type: 'hidden-element',
              element: el,
              issue: 'Important element is hidden',
              severity: 'high'
            });
            
            // Auto-fix: Make visible
            el.style.display = 'block';
            el.style.visibility = 'visible';
            fixes.push(`Made important element visible`);
          }
        });
      };

      // Check for responsive issues
      const checkResponsive = () => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          const elements = document.querySelectorAll('*');
          elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width > window.innerWidth) {
              issues.push({
                type: 'responsive',
                element: el,
                issue: 'Element wider than viewport',
                severity: 'medium'
              });
              
              // Auto-fix: Add responsive styling
              el.style.maxWidth = '100%';
              el.style.boxSizing = 'border-box';
              fixes.push(`Fixed responsive width for element`);
            }
          });
        }
      };

      // Run all checks
      checkContrast();
      checkOverlaps();
      checkTextPositioning();
      checkHiddenElements();
      checkResponsive();

      // Update UI system state
      setUiSmartSystem(prev => ({
        ...prev,
        detectedIssues: issues,
        fixedIssues: [...prev.fixedIssues, ...fixes],
        lastCheck: Date.now()
      }));
    };

    // Helper function to calculate luminance
    const getLuminance = (color) => {
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;
      
      const [r, g, b] = rgb.map(x => {
        x = x / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    // Run initial check
    checkUIHealth();

    // Set up periodic checks
    const interval = setInterval(checkUIHealth, 5000); // Check every 5 seconds

    // Also run checks when DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(checkUIHealth, 100); // Debounce
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [uiSmartSystem.isActive, darkMode]);
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

    // Handle scroll - removed WhatsApp button logic
    const handleScroll = () => {
      // Scroll handling logic can be added here if needed
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
        [field]: field === 'current_balance' ? (value === '' ? '' : parseInt(value) || 0) : value
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

    // Ensure current_balance is a number when saving
    const changesForSave = { ...changes };
    if ('current_balance' in changesForSave) {
      changesForSave.current_balance = parseInt(changesForSave.current_balance) || 0;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/programs/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changesForSave),
      });
      
      if (response.ok) {
        await fetchMembers();
        await fetchGlobalLog();
        await fetchDashboardStats();
        cancelEditing(memberId, companyId);
        
        // Show save feedback
        const feedbackKey = `${memberId}-${companyId}`;
        setSaveFeedback(prev => ({ ...prev, [feedbackKey]: true }));
        setTimeout(() => {
          setSaveFeedback(prev => {
            const newFeedback = { ...prev };
            delete newFeedback[feedbackKey];
            return newFeedback;
          });
        }, 2000);
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
      // Force repaint to ensure all styles are properly updated
      document.body.style.display = 'none';
      document.body.offsetHeight; // Force reflow
      document.body.style.display = '';
    }
    
    // Don't reload data when switching themes - this was causing data disappearance
    // The data should persist across theme changes
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
      // Backend supports field deletion by setting value to null
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/programs/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [fieldName]: null
        }),
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

  // Field renaming functions
  const startFieldRenaming = (memberId, companyId, fieldName) => {
    setFieldRenaming({
      isActive: true,
      memberId: memberId,
      companyId: companyId,
      fieldName: fieldName,
      newName: fieldName
    });
  };

  const cancelFieldRenaming = () => {
    setFieldRenaming({
      isActive: false,
      memberId: null,
      companyId: null,
      fieldName: '',
      newName: ''
    });
  };

  const confirmFieldRenaming = async () => {
    const { memberId, companyId, fieldName, newName } = fieldRenaming;
    
    if (!newName.trim() || newName === fieldName) {
      cancelFieldRenaming();
      return;
    }

    try {
      // Get current member data
      const member = members.find(m => m.id === memberId);
      const program = member.programs[companyId];
      
      // Get the current value from the field
      let currentValue = '';
      if (program[fieldName] !== undefined) {
        currentValue = program[fieldName];
      } else if (program.custom_fields && program.custom_fields[fieldName] !== undefined) {
        currentValue = program.custom_fields[fieldName];
      }
      
      // Manual renaming: add new field and remove old field
      // Step 1: Add new field with the current value
      const addResponse = await fetch(`${API_BASE_URL}/api/members/${memberId}/programs/${companyId}/fields`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [newName]: currentValue
        }),
      });
      
      if (addResponse.ok) {
        // Step 2: Remove old field by setting it to null
        const deleteResponse = await fetch(`${API_BASE_URL}/api/members/${memberId}/programs/${companyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            [fieldName]: null
          }),
        });
        
        if (deleteResponse.ok) {
          await fetchMembers();
          await fetchGlobalLog();
          cancelFieldRenaming();
        } else {
          console.error('Erro ao remover campo antigo durante renomeação');
        }
      } else {
        console.error('Erro ao adicionar novo campo durante renomeação');
      }
    } catch (error) {
      console.error('Erro ao renomear campo:', error);
    }
  };

  // New member creation functions
  const showAddMemberModal = () => {
    setShowAddMember(true);
    setNewMemberData({ name: '' });
  };

  const hideAddMemberModal = () => {
    setShowAddMember(false);
    setNewMemberData({ name: '' });
  };

  const updateNewMemberField = (field, value) => {
    setNewMemberData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const createNewMember = async () => {
    if (!newMemberData.name.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newMemberData.name.trim() }),
      });
      
      if (response.ok) {
        await fetchMembers();
        await fetchGlobalLog();
        await fetchDashboardStats();
        hideAddMemberModal();
      } else {
        const error = await response.json();
        alert(error.detail || 'Erro ao criar novo membro');
      }
    } catch (error) {
      console.error('Erro ao criar novo membro:', error);
      alert('Erro ao criar novo membro');
    }
  };

  // Debounced save for post-its to improve performance
  const debouncedSavePostit = useCallback(
    debounce(async (postitId, content) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/postits/${postitId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
        
        if (response.ok) {
          // Update local state immediately for better UX
          setPostits(prevPostits => 
            prevPostits.map(postit => 
              postit.id === postitId 
                ? { ...postit, content }
                : postit
            )
          );
          setEditingPostit(null);
        }
      } catch (error) {
        console.error('Erro ao atualizar post-it:', error);
      }
    }, 500),
    []
  );

  const createPostit = async (content) => {
    if (!content || !content.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/postits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim() }),
      });
      
      if (response.ok) {
        const newPostit = await response.json();
        // Update local state immediately for better UX
        setPostits(prevPostits => [...prevPostits, newPostit]);
      }
    } catch (error) {
      console.error('Erro ao criar post-it:', error);
    }
  };

  const updatePostit = async (postitId, content) => {
    if (!content.trim()) return;
    
    // Use debounced save for better performance
    debouncedSavePostit(postitId, content.trim());
  };

  const deletePostit = async (postitId) => {
    try {
      // Optimistic update - remove from UI immediately
      setPostits(prevPostits => prevPostits.filter(postit => postit.id !== postitId));
      
      const response = await fetch(`${API_BASE_URL}/api/postits/${postitId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // If deletion failed, restore the post-it
        fetchPostits();
      }
    } catch (error) {
      console.error('Erro ao excluir post-it:', error);
      // Restore post-its on error
      fetchPostits();
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
        showWhatsappModal={showWhatsappModal}
      />
      
      <main className="main-content">
        <TopBar 
          dashboardStats={dashboardStats}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
        
        <QuoteSection />
        
        <div className="members-container">
          <div className="add-member-section">
            <button 
              className="add-member-btn"
              onClick={showAddMemberModal}
              title="Adicionar novo membro da família"
            >
              <span className="add-member-icon">👤</span>
              <span className="add-member-text">Adicionar Membro</span>
            </button>
          </div>
          
          {members.map(member => (
            <MemberCard 
              key={member.id}
              member={member}
              companies={companies}
              expandedPrograms={expandedPrograms}
              editingPrograms={editingPrograms}
              programChanges={programChanges}
              saveFeedback={saveFeedback}
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
              onRenameField={(companyId, fieldName) => startFieldRenaming(member.id, companyId, fieldName)}
              onAddNewField={(companyId) => addNewField(member.id, companyId)}
            />
          ))}
          
          <BottomActions 
            onShowGlobalLog={() => setShowGlobalLog(true)}
            onLogout={handleLogout}
            onShowWhatsappModal={showWhatsappModal}
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
      {/* Field Renaming Modal */}
      {fieldRenaming.isActive && (
        <div className="modal-overlay">
          <div className="modal-content field-rename-modal">
            <h3>✏️ Renomear Campo</h3>
            <p>Renomeie o campo "{fieldRenaming.fieldName}":</p>
            
            <div className="form-group">
              <label>Novo nome:</label>
              <input
                type="text"
                value={fieldRenaming.newName}
                onChange={(e) => setFieldRenaming(prev => ({ ...prev, newName: e.target.value }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    confirmFieldRenaming();
                  } else if (e.key === 'Escape') {
                    cancelFieldRenaming();
                  }
                }}
                autoFocus
                placeholder="Digite o novo nome do campo"
              />
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={cancelFieldRenaming}>
                Cancelar
              </button>
              <button className="confirm-btn" onClick={confirmFieldRenaming}>
                ✏️ Renomear
              </button>
            </div>
          </div>
        </div>
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

      {/* Add New Member Modal */}
      {showAddMember && (
        <div className="modal-overlay">
          <div className="modal-content add-member-modal">
            <h3>👤 Adicionar Novo Membro</h3>
            <p>Insira o nome do novo membro da família:</p>
            
            <div className="form-group">
              <label>Nome:</label>
              <input
                type="text"
                value={newMemberData.name}
                onChange={(e) => updateNewMemberField('name', e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createNewMember();
                  } else if (e.key === 'Escape') {
                    hideAddMemberModal();
                  }
                }}
                autoFocus
                placeholder="Digite o nome do novo membro"
              />
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={hideAddMemberModal}>
                Cancelar
              </button>
              <button 
                className="confirm-btn" 
                onClick={createNewMember}
                disabled={!newMemberData.name.trim()}
              >
                👤 Criar Membro
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
const Sidebar = ({ onShowGlobalLog, onLogout, dashboardStats, postits, onCreatePostit, onUpdatePostit, onDeletePostit, editingPostit, setEditingPostit, showWhatsappModal }) => {
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
        <button className="add-postit-btn" onClick={() => setEditingPostit('new')}>
          ➕ Adicionar
        </button>
        
        <div className="postits-grid">
          {/* New post-it form */}
          {editingPostit === 'new' && (
            <div className="postit new-postit">
              <button 
                className="postit-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPostit(null);
                }}
                aria-label="Cancelar novo post-it"
              >
                ×
              </button>
              <textarea 
                placeholder="Digite seu post-it aqui..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const content = e.target.value.trim();
                    if (content) {
                      onCreatePostit(content);
                      setEditingPostit(null);
                    }
                  }
                  if (e.key === 'Escape') {
                    setEditingPostit(null);
                  }
                }}
                onBlur={(e) => {
                  const content = e.target.value.trim();
                  if (content) {
                    onCreatePostit(content);
                    setEditingPostit(null);
                  }
                }}
                autoFocus
              />
              <div className="postit-actions">
                <button 
                  className="postit-save"
                  onClick={(e) => {
                    e.stopPropagation();
                    const textarea = e.target.closest('.postit').querySelector('textarea');
                    const content = textarea.value.trim();
                    if (content) {
                      onCreatePostit(content);
                      setEditingPostit(null);
                    }
                  }}
                >
                  ✓
                </button>
                <button 
                  className="postit-cancel"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPostit(null);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          {postits.map(postit => (
            <div key={postit.id} className="postit">
              {editingPostit === postit.id ? (
                <div>
                  <textarea 
                    defaultValue={postit.content}
                    onBlur={(e) => handleSavePostit(postit.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSavePostit(postit.id, e.target.value);
                      }
                      if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    autoFocus
                  />
                  <div className="postit-actions">
                    <button 
                      className="postit-save"
                      onClick={(e) => {
                        e.stopPropagation();
                        const textarea = e.target.closest('.postit').querySelector('textarea');
                        handleSavePostit(postit.id, textarea.value);
                      }}
                    >
                      ✓
                    </button>
                    <button 
                      className="postit-cancel"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="postit-content"
                  onClick={() => handleEditPostit(postit.id)}
                >
                  <button 
                    className="postit-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePostit(postit.id);
                    }}
                    aria-label="Deletar post-it"
                  >
                    ×
                  </button>
                  <div className="postit-text">{postit.content}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ dashboardStats, darkMode, onToggleDarkMode }) => (
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
      <a href="https://www.latampass.latam.com/pt_br/clube-latampass" target="_blank" rel="noopener noreferrer" className="program-link">
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

const BottomActions = ({ onShowGlobalLog, onLogout, onShowWhatsappModal }) => (
  <div className="bottom-actions">
    <button className="action-btn log-btn" onClick={onShowGlobalLog}>
      📋 Histórico
    </button>
    <button className="action-btn logout-btn" onClick={onLogout}>
      🚪 Sair
    </button>
    <button className="action-btn whatsapp-btn" onClick={onShowWhatsappModal}>
      <svg 
        viewBox="0 0 24 24" 
        width="18" 
        height="18" 
        fill="currentColor"
        style={{ marginRight: '0.5rem' }}
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
      </svg>
      WhatsApp
    </button>
  </div>
);

const MemberCard = ({ 
  member, companies, expandedPrograms, editingPrograms, programChanges, saveFeedback,
  onToggleProgram, onStartEditing, onCancelEditing, onUpdateField, onSaveChanges,
  onCopyToClipboard, formatDate, formatNumber, getCompanyById,
  showAddCompany, newCompanyData, onShowAddCompany, onHideAddCompany,
  onUpdateNewCompanyField, onCreateNewCompany, editingFields, setEditingFields,
  onDeleteProgram, onToggleFieldEditing, onConfirmFieldEditing, onCancelFieldEditing,
  onDeleteField, onRenameField, onAddNewField
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
          const hasSaveFeedback = saveFeedback[`${member.id}-${company.id}`];
          
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
              hasSaveFeedback={hasSaveFeedback}
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
              onRenameField={(fieldName) => onRenameField(company.id, fieldName)}
              onAddNewField={() => onAddNewField(company.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

const ProgramBlock = ({ 
  member, company, program, isExpanded, isEditing, isEditingFields, changes, hasSaveFeedback,
  onToggle, onStartEditing, onCancelEditing, onUpdateField, onSaveChanges,
  onCopyToClipboard, formatDate, formatNumber, onDeleteProgram, onToggleFieldEditing,
  onConfirmFieldEditing, onCancelFieldEditing, onDeleteField, onRenameField, onAddNewField
}) => {
  const currentData = { ...program, ...changes };

  return (
    <div className={`program-block ${isExpanded ? 'expanded' : ''}`}>
      <div className="program-header" onClick={onToggle}>
        <div className="program-info">
          <span className="program-title">
            {company.name} → {formatNumber(currentData.current_balance)} pontos
          </span>
          {hasSaveFeedback && (
            <span className="save-feedback">✔️ Salvo!</span>
          )}
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
                  onRename={onRenameField}
                  canDelete={isEditingFields}
                  canRename={isEditingFields}
                  onSave={onSaveChanges}
                  onCancel={onCancelEditing}
                />
                <EditableFieldWithDelete 
                  label="Senha" 
                  value={currentData.password} 
                  onChange={(value) => onUpdateField('password', value)}
                  onDelete={onDeleteField}
                  onRename={onRenameField}
                  canDelete={isEditingFields}
                  canRename={isEditingFields}
                  onSave={onSaveChanges}
                  onCancel={onCancelEditing}
                />
                <EditableFieldWithDelete 
                  label="CPF" 
                  value={currentData.cpf} 
                  onChange={(value) => onUpdateField('cpf', value)}
                  onDelete={onDeleteField}
                  onRename={onRenameField}
                  canDelete={isEditingFields}
                  canRename={isEditingFields}
                  onSave={onSaveChanges}
                  onCancel={onCancelEditing}
                />
                <EditableFieldWithDelete 
                  label="Nº do Cartão" 
                  value={currentData.card_number} 
                  onChange={(value) => onUpdateField('card_number', value)}
                  onDelete={onDeleteField}
                  onRename={onRenameField}
                  canDelete={isEditingFields}
                  canRename={isEditingFields}
                  onSave={onSaveChanges}
                  onCancel={onCancelEditing}
                />
                <EditableFieldWithDelete 
                  label="Saldo (pontos)" 
                  value={currentData.current_balance} 
                  onChange={(value) => onUpdateField('current_balance', value)}
                  type="number"
                  onDelete={onDeleteField}
                  onRename={onRenameField}
                  canDelete={isEditingFields}
                  canRename={isEditingFields}
                  onSave={onSaveChanges}
                  onCancel={onCancelEditing}
                />
                <EditableFieldWithDelete 
                  label="Categoria" 
                  value={currentData.elite_tier} 
                  onChange={(value) => onUpdateField('elite_tier', value)}
                  onDelete={onDeleteField}
                  onRename={onRenameField}
                  canDelete={isEditingFields}
                  canRename={isEditingFields}
                  onSave={onSaveChanges}
                  onCancel={onCancelEditing}
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

const EditableFieldWithDelete = ({ 
  label, 
  value, 
  onChange, 
  onDelete, 
  onRename, 
  type = "text", 
  canDelete = false,
  canRename = false,
  onSave,
  onCancel 
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSave) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="field-group">
      <div className="field-container">
        <label className="field-label">
          {label}:
          {canRename && (
            <button 
              className="rename-field-btn" 
              onClick={() => onRename(label)}
              title="Renomear campo"
            >
              ✏️
            </button>
          )}
        </label>
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
        onKeyDown={handleKeyDown}
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