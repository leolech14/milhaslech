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
      console.error('Error fetching companies:', error);
    }
  };

  const fetchMembers = async (companyId = null) => {
    try {
      const url = companyId ? `${API_BASE_URL}/api/members?company_id=${companyId}` : `${API_BASE_URL}/api/members`;
      const response = await fetch(url);
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
      console.error('Error fetching member history:', error);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
        alert(error.detail || 'Error creating member');
      }
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Error creating member');
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
        alert(error.detail || 'Error updating member');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Error updating member');
    }
  }

  async function deleteMember(memberId) {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/members/${memberId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          fetchMembers();
          fetchDashboardStats();
        } else {
          alert('Error deleting member');
        }
      } catch (error) {
        console.error('Error deleting member:', error);
        alert('Error deleting member');
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
        alert(error.detail || 'Error creating company');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Error creating company');
    }
  }
}

// Components
const Sidebar = ({ companies, selectedCompany, onCompanySelect, onAddCompany, dashboardStats }) => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <h1>Loyalty Control</h1>
      <p>Tower Dashboard</p>
    </div>
    
    <nav className="sidebar-nav">
      <button 
        className={selectedCompany === 'all' ? 'active' : ''}
        onClick={() => onCompanySelect('all')}
      >
        All Programs
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
            <span>Total Members</span>
            <span>{dashboardStats.total_members}</span>
          </div>
          <div className="stat-item">
            <span>Programs</span>
            <span>{dashboardStats.total_companies}</span>
          </div>
        </>
      )}
    </div>
    
    <button className="add-company-btn" onClick={onAddCompany}>
      + Add Company
    </button>
  </aside>
);

const TopBar = ({ onAddMember, onRefresh }) => (
  <header className="top-bar">
    <div className="top-bar-left">
      <h2>Dashboard</h2>
    </div>
    <div className="top-bar-right">
      <button className="refresh-btn" onClick={onRefresh}>
        ↻ Refresh
      </button>
      <button className="add-member-btn" onClick={onAddMember}>
        + Add Member
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

  return (
    <div className="member-card" style={{ borderTop: `4px solid ${company?.color}` }}>
      <div className="member-header">
        <div className="member-info">
          <h3>{member.owner_name}</h3>
          <p>{company?.name}</p>
          <p>#{member.loyalty_number}</p>
        </div>
        <div className="member-actions">
          <button onClick={onEdit}>Edit</button>
          <button onClick={onDelete} className="delete-btn">Delete</button>
        </div>
      </div>
      
      <div className="member-balance">
        <div className="balance-main">
          <span className="balance-label">Current Balance</span>
          <span className="balance-value">{formatNumber(member.current_balance)}</span>
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
        <span>Updated: {formatDate(member.last_updated)}</span>
        <button onClick={handleViewHistory}>
          {showHistory ? 'Hide' : 'View'} History
        </button>
      </div>
      
      {showHistory && (
        <div className="member-history">
          {history.length > 0 ? (
            history.map(entry => (
              <div key={entry.id} className="history-entry">
                <span>{formatNumber(entry.balance)} points</span>
                <span className={entry.change > 0 ? 'positive' : 'negative'}>
                  {entry.change > 0 ? '+' : ''}{formatNumber(entry.change)}
                </span>
                <span>{formatDate(entry.updated_at)}</span>
              </div>
            ))
          ) : (
            <p>No history available</p>
          )}
        </div>
      )}
      
      {member.notes && (
        <div className="member-notes">
          <p>{member.notes}</p>
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
        <h2>Add New Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company</label>
            <select 
              value={formData.company_id} 
              onChange={(e) => setFormData({...formData, company_id: e.target.value})}
              required
            >
              <option value="">Select Company</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Owner Name</label>
            <input 
              type="text" 
              value={formData.owner_name}
              onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Loyalty Number</label>
            <input 
              type="text" 
              value={formData.loyalty_number}
              onChange={(e) => setFormData({...formData, loyalty_number: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Current Balance</label>
            <input 
              type="number" 
              value={formData.current_balance}
              onChange={(e) => setFormData({...formData, current_balance: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Elite Tier</label>
            <input 
              type="text" 
              value={formData.elite_tier}
              onChange={(e) => setFormData({...formData, elite_tier: e.target.value})}
              placeholder="e.g., Gold, Platinum"
            />
          </div>
          
          <div className="form-group">
            <label>Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Add Member</button>
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

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Owner Name</label>
            <input 
              type="text" 
              value={formData.owner_name}
              onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Loyalty Number</label>
            <input 
              type="text" 
              value={formData.loyalty_number}
              onChange={(e) => setFormData({...formData, loyalty_number: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Current Balance</label>
            <input 
              type="number" 
              value={formData.current_balance}
              onChange={(e) => setFormData({...formData, current_balance: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Elite Tier</label>
            <input 
              type="text" 
              value={formData.elite_tier}
              onChange={(e) => setFormData({...formData, elite_tier: e.target.value})}
              placeholder="e.g., Gold, Platinum"
            />
          </div>
          
          <div className="form-group">
            <label>Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Update Member</button>
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
    max_members: 4
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add New Company</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Brand Color</label>
            <input 
              type="color" 
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Max Members</label>
            <input 
              type="number" 
              value={formData.max_members}
              onChange={(e) => setFormData({...formData, max_members: parseInt(e.target.value)})}
              min="1"
              max="10"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Add Company</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;