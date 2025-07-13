#!/usr/bin/env python3
"""
Backend API Testing for Loyalty Control Tower
Tests all backend endpoints and functionality
"""

import requests
import json
import time
from datetime import datetime
import sys

# Get backend URL from frontend .env
BACKEND_URL = "https://1460d612-5445-408c-93d2-b62359b06602.preview.emergentagent.com/api"

class LoyaltyAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.created_members = []  # Track created members for cleanup
        self.created_companies = []  # Track created companies for cleanup
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        })
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_test("Health Check", True, "API is healthy")
                    return True
                else:
                    self.log_test("Health Check", False, "Invalid health response format", data)
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_get_companies(self):
        """Test GET /api/companies - should return default companies"""
        try:
            response = requests.get(f"{self.base_url}/companies", timeout=10)
            if response.status_code == 200:
                companies = response.json()
                if isinstance(companies, list) and len(companies) >= 3:
                    # Check for default companies
                    company_names = [c.get("name", "") for c in companies]
                    expected_companies = ["LATAM Pass", "GOL Smiles", "Azul TudoAzul"]
                    
                    found_companies = []
                    for expected in expected_companies:
                        if expected in company_names:
                            found_companies.append(expected)
                    
                    if len(found_companies) == 3:
                        self.log_test("Get Companies", True, f"Found all 3 default companies: {found_companies}")
                        return True
                    else:
                        self.log_test("Get Companies", False, f"Missing default companies. Found: {company_names}")
                        return False
                else:
                    self.log_test("Get Companies", False, f"Expected list with 3+ companies, got: {len(companies) if isinstance(companies, list) else 'not a list'}")
                    return False
            else:
                self.log_test("Get Companies", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Get Companies", False, f"Request error: {str(e)}")
            return False
    
    def test_create_company(self):
        """Test POST /api/companies"""
        try:
            new_company = {
                "name": "Test Airlines Rewards",
                "color": "#00ff00",
                "max_members": 4
            }
            
            response = requests.post(f"{self.base_url}/companies", 
                                   json=new_company, timeout=10)
            
            if response.status_code == 200:
                company = response.json()
                if (company.get("name") == new_company["name"] and 
                    company.get("color") == new_company["color"] and
                    "id" in company):
                    self.created_companies.append(company["id"])
                    self.log_test("Create Company", True, f"Created company: {company['name']}")
                    return True
                else:
                    self.log_test("Create Company", False, "Invalid response format", company)
                    return False
            else:
                self.log_test("Create Company", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Create Company", False, f"Request error: {str(e)}")
            return False
    
    def test_get_specific_company(self):
        """Test GET /api/companies/{id}"""
        try:
            # First get all companies to get a valid ID
            response = requests.get(f"{self.base_url}/companies", timeout=10)
            if response.status_code != 200:
                self.log_test("Get Specific Company", False, "Could not get companies list")
                return False
            
            companies = response.json()
            if not companies:
                self.log_test("Get Specific Company", False, "No companies found")
                return False
            
            # Test with first company
            company_id = companies[0]["id"]
            response = requests.get(f"{self.base_url}/companies/{company_id}", timeout=10)
            
            if response.status_code == 200:
                company = response.json()
                if company.get("id") == company_id:
                    self.log_test("Get Specific Company", True, f"Retrieved company: {company.get('name')}")
                    return True
                else:
                    self.log_test("Get Specific Company", False, "ID mismatch in response")
                    return False
            else:
                self.log_test("Get Specific Company", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Get Specific Company", False, f"Request error: {str(e)}")
            return False
    
    def test_get_members_empty(self):
        """Test GET /api/members when no members exist"""
        try:
            response = requests.get(f"{self.base_url}/members", timeout=10)
            if response.status_code == 200:
                members = response.json()
                if isinstance(members, list):
                    self.log_test("Get Members (Empty)", True, f"Retrieved {len(members)} members")
                    return True
                else:
                    self.log_test("Get Members (Empty)", False, "Response is not a list")
                    return False
            else:
                self.log_test("Get Members (Empty)", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Get Members (Empty)", False, f"Request error: {str(e)}")
            return False
    
    def test_create_member(self):
        """Test POST /api/members"""
        try:
            # Get a company ID first
            response = requests.get(f"{self.base_url}/companies", timeout=10)
            if response.status_code != 200:
                self.log_test("Create Member", False, "Could not get companies")
                return False
            
            companies = response.json()
            if not companies:
                self.log_test("Create Member", False, "No companies available")
                return False
            
            company_id = companies[0]["id"]  # Use first company (LATAM)
            
            new_member = {
                "company_id": company_id,
                "owner_name": "Maria Silva",
                "loyalty_number": "LATAM123456789",
                "current_balance": 25000,
                "elite_tier": "Gold",
                "notes": "Frequent traveler to São Paulo"
            }
            
            response = requests.post(f"{self.base_url}/members", 
                                   json=new_member, timeout=10)
            
            if response.status_code == 200:
                member = response.json()
                if (member.get("owner_name") == new_member["owner_name"] and
                    member.get("company_id") == company_id and
                    "id" in member):
                    self.created_members.append(member["id"])
                    self.log_test("Create Member", True, f"Created member: {member['owner_name']}")
                    return True
                else:
                    self.log_test("Create Member", False, "Invalid response format", member)
                    return False
            else:
                self.log_test("Create Member", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Create Member", False, f"Request error: {str(e)}")
            return False
    
    def test_get_specific_member(self):
        """Test GET /api/members/{id}"""
        if not self.created_members:
            self.log_test("Get Specific Member", False, "No members created to test with")
            return False
        
        try:
            member_id = self.created_members[0]
            response = requests.get(f"{self.base_url}/members/{member_id}", timeout=10)
            
            if response.status_code == 200:
                member = response.json()
                if member.get("id") == member_id:
                    self.log_test("Get Specific Member", True, f"Retrieved member: {member.get('owner_name')}")
                    return True
                else:
                    self.log_test("Get Specific Member", False, "ID mismatch in response")
                    return False
            else:
                self.log_test("Get Specific Member", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Get Specific Member", False, f"Request error: {str(e)}")
            return False
    
    def test_update_member_balance(self):
        """Test PUT /api/members/{id} with balance change"""
        if not self.created_members:
            self.log_test("Update Member Balance", False, "No members created to test with")
            return False
        
        try:
            member_id = self.created_members[0]
            
            # Update balance
            update_data = {
                "current_balance": 30000,
                "notes": "Balance updated after recent trip"
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}", 
                                  json=update_data, timeout=10)
            
            if response.status_code == 200:
                member = response.json()
                if member.get("current_balance") == 30000:
                    self.log_test("Update Member Balance", True, f"Updated balance to {member['current_balance']}")
                    return True
                else:
                    self.log_test("Update Member Balance", False, f"Balance not updated correctly: {member.get('current_balance')}")
                    return False
            else:
                self.log_test("Update Member Balance", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Update Member Balance", False, f"Request error: {str(e)}")
            return False
    
    def test_balance_history_tracking(self):
        """Test balance history is created when balance changes"""
        if not self.created_members:
            self.log_test("Balance History Tracking", False, "No members created to test with")
            return False
        
        try:
            member_id = self.created_members[0]
            response = requests.get(f"{self.base_url}/members/{member_id}/history", timeout=10)
            
            if response.status_code == 200:
                history = response.json()
                if isinstance(history, list) and len(history) >= 2:
                    # Should have initial balance + update
                    self.log_test("Balance History Tracking", True, f"Found {len(history)} history entries")
                    return True
                else:
                    self.log_test("Balance History Tracking", False, f"Expected 2+ history entries, got {len(history) if isinstance(history, list) else 'not a list'}")
                    return False
            else:
                self.log_test("Balance History Tracking", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Balance History Tracking", False, f"Request error: {str(e)}")
            return False
    
    def test_member_limit_validation(self):
        """Test that companies can't exceed 4 members"""
        try:
            # Get a company ID
            response = requests.get(f"{self.base_url}/companies", timeout=10)
            companies = response.json()
            company_id = companies[1]["id"]  # Use second company (Smiles)
            
            # Create 4 members
            created_for_limit_test = []
            for i in range(4):
                member_data = {
                    "company_id": company_id,
                    "owner_name": f"Test User {i+1}",
                    "loyalty_number": f"SMILES{i+1:06d}",
                    "current_balance": 10000 + (i * 1000)
                }
                
                response = requests.post(f"{self.base_url}/members", json=member_data, timeout=10)
                if response.status_code == 200:
                    member = response.json()
                    created_for_limit_test.append(member["id"])
                    self.created_members.append(member["id"])
            
            # Try to create 5th member (should fail)
            member_data = {
                "company_id": company_id,
                "owner_name": "Test User 5",
                "loyalty_number": "SMILES000005",
                "current_balance": 15000
            }
            
            response = requests.post(f"{self.base_url}/members", json=member_data, timeout=10)
            
            if response.status_code == 400:
                self.log_test("Member Limit Validation", True, "Correctly rejected 5th member")
                return True
            else:
                self.log_test("Member Limit Validation", False, f"Expected 400 error, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Member Limit Validation", False, f"Request error: {str(e)}")
            return False
    
    def test_member_filtering_by_company(self):
        """Test GET /api/members?company_id=X"""
        try:
            # Get companies
            response = requests.get(f"{self.base_url}/companies", timeout=10)
            companies = response.json()
            company_id = companies[1]["id"]  # Smiles company (should have 4 members from previous test)
            
            response = requests.get(f"{self.base_url}/members?company_id={company_id}", timeout=10)
            
            if response.status_code == 200:
                members = response.json()
                if isinstance(members, list) and len(members) == 4:
                    # Verify all members belong to the company
                    all_correct_company = all(m.get("company_id") == company_id for m in members)
                    if all_correct_company:
                        self.log_test("Member Filtering by Company", True, f"Found {len(members)} members for company")
                        return True
                    else:
                        self.log_test("Member Filtering by Company", False, "Some members don't belong to requested company")
                        return False
                else:
                    self.log_test("Member Filtering by Company", False, f"Expected 4 members, got {len(members) if isinstance(members, list) else 'not a list'}")
                    return False
            else:
                self.log_test("Member Filtering by Company", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Member Filtering by Company", False, f"Request error: {str(e)}")
            return False
    
    def test_dashboard_stats(self):
        """Test GET /api/dashboard/stats"""
        try:
            response = requests.get(f"{self.base_url}/dashboard/stats", timeout=10)
            
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["total_members", "total_companies", "company_stats"]
                
                if all(field in stats for field in required_fields):
                    if (isinstance(stats["company_stats"], list) and 
                        len(stats["company_stats"]) >= 3):
                        self.log_test("Dashboard Stats", True, f"Stats: {stats['total_members']} members, {stats['total_companies']} companies")
                        return True
                    else:
                        self.log_test("Dashboard Stats", False, "Invalid company_stats format")
                        return False
                else:
                    self.log_test("Dashboard Stats", False, f"Missing required fields: {required_fields}")
                    return False
            else:
                self.log_test("Dashboard Stats", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Dashboard Stats", False, f"Request error: {str(e)}")
            return False
    
    def test_delete_member(self):
        """Test DELETE /api/members/{id}"""
        if not self.created_members:
            self.log_test("Delete Member", False, "No members created to test with")
            return False
        
        try:
            member_id = self.created_members[0]
            response = requests.delete(f"{self.base_url}/members/{member_id}", timeout=10)
            
            if response.status_code == 200:
                # Verify member is deleted
                verify_response = requests.get(f"{self.base_url}/members/{member_id}", timeout=10)
                if verify_response.status_code == 404:
                    self.log_test("Delete Member", True, "Member successfully deleted")
                    self.created_members.remove(member_id)
                    return True
                else:
                    self.log_test("Delete Member", False, "Member still exists after deletion")
                    return False
            else:
                self.log_test("Delete Member", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Delete Member", False, f"Request error: {str(e)}")
            return False
    
    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete remaining members
        for member_id in self.created_members:
            try:
                requests.delete(f"{self.base_url}/members/{member_id}", timeout=5)
            except:
                pass
        
        # Note: We don't delete companies as they might be needed by the app
        print("✅ Cleanup completed")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Loyalty Control Tower Backend API Tests")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("MongoDB Connection (via companies)", self.test_get_companies),
            ("Default Company Initialization", self.test_get_companies),
            ("Create Company", self.test_create_company),
            ("Get Specific Company", self.test_get_specific_company),
            ("Get Members (Empty)", self.test_get_members_empty),
            ("Create Member", self.test_create_member),
            ("Get Specific Member", self.test_get_specific_member),
            ("Update Member Balance", self.test_update_member_balance),
            ("Balance History Tracking", self.test_balance_history_tracking),
            ("Member Limit Validation", self.test_member_limit_validation),
            ("Member Filtering by Company", self.test_member_filtering_by_company),
            ("Dashboard Statistics", self.test_dashboard_stats),
            ("Delete Member", self.test_delete_member),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running: {test_name}")
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
                failed += 1
            
            time.sleep(0.5)  # Brief pause between tests
        
        # Cleanup
        self.cleanup()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("\n🎉 All tests passed! Backend API is working correctly.")
        else:
            print(f"\n⚠️  {failed} test(s) failed. Check the details above.")
        
        return failed == 0

if __name__ == "__main__":
    tester = LoyaltyAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)