#!/usr/bin/env python3
"""
Dark Mode Backend Verification Test
Comprehensive test to ensure dark mode implementation didn't break any backend functionality
"""

import requests
import json
import time
from datetime import datetime

BACKEND_URL = "https://f195c02b-eea2-4e49-99b1-e390926f58f6.preview.emergentagent.com/api"

class DarkModeBackendVerification:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.member_ids = {}
        
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
    
    def test_user_authentication_simulation(self):
        """Test 1: User authentication (frontend-only, but verify backend is accessible)"""
        try:
            # Since auth is frontend-only, we just verify backend is accessible
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                self.log_test("User Authentication Access", True, "Backend accessible for authenticated users (lech/milhas.online)")
                return True
            else:
                self.log_test("User Authentication Access", False, f"Backend not accessible: HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("User Authentication Access", False, f"Connection error: {str(e)}")
            return False
    
    def test_member_data_retrieval(self):
        """Test 2: Member data retrieval (GET /api/members)"""
        try:
            response = requests.get(f"{self.base_url}/members", timeout=10)
            if response.status_code == 200:
                members = response.json()
                if isinstance(members, list) and len(members) == 4:
                    # Store member IDs and verify family members
                    member_names = []
                    for member in members:
                        self.member_ids[member["name"]] = member["id"]
                        member_names.append(member["name"])
                    
                    expected_family = ["Osvandré", "Marilise", "Graciela", "Leonardo"]
                    if all(name in member_names for name in expected_family):
                        self.log_test("Member Data Retrieval", True, f"Retrieved all 4 family members: {member_names}")
                        return True
                    else:
                        self.log_test("Member Data Retrieval", False, f"Missing family members. Found: {member_names}")
                        return False
                else:
                    self.log_test("Member Data Retrieval", False, f"Expected 4 members, got: {len(members) if isinstance(members, list) else 'not a list'}")
                    return False
            else:
                self.log_test("Member Data Retrieval", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Member Data Retrieval", False, f"Request error: {str(e)}")
            return False
    
    def test_company_data_retrieval(self):
        """Test 3: Company data retrieval (GET /api/companies)"""
        try:
            response = requests.get(f"{self.base_url}/companies", timeout=10)
            if response.status_code == 200:
                companies = response.json()
                if isinstance(companies, list) and len(companies) == 3:
                    company_names = [c.get("name", "") for c in companies]
                    expected_companies = ["LATAM Pass", "Smiles", "TudoAzul"]
                    
                    if all(name in company_names for name in expected_companies):
                        self.log_test("Company Data Retrieval", True, f"Retrieved all 3 loyalty programs: {company_names}")
                        return True
                    else:
                        self.log_test("Company Data Retrieval", False, f"Missing companies. Found: {company_names}")
                        return False
                else:
                    self.log_test("Company Data Retrieval", False, f"Expected 3 companies, got: {len(companies) if isinstance(companies, list) else 'not a list'}")
                    return False
            else:
                self.log_test("Company Data Retrieval", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Company Data Retrieval", False, f"Request error: {str(e)}")
            return False
    
    def test_program_field_updates(self):
        """Test 4: Program field updates (PUT /api/members/{id}/programs/{company_id})"""
        if not self.member_ids:
            self.log_test("Program Field Updates", False, "No member IDs available")
            return False
        
        try:
            # Test updating Osvandré's LATAM program
            member_id = self.member_ids["Osvandré"]
            
            # Update multiple fields to ensure changes are detected
            update_data = {
                "login": f"osvandre.test.{int(time.time())}@latam.com",
                "password": "darkmode2024",
                "current_balance": 50000,
                "elite_tier": "Platinum"
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/latam", 
                                  json=update_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result and "changes" in result:
                    if len(result["changes"]) > 0:
                        self.log_test("Program Field Updates", True, f"Successfully updated {len(result['changes'])} fields: {result['changes']}")
                        return True
                    else:
                        self.log_test("Program Field Updates", False, "No changes recorded (fields may already have same values)")
                        return False
                else:
                    self.log_test("Program Field Updates", False, f"Invalid response format: {result}")
                    return False
            else:
                self.log_test("Program Field Updates", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Program Field Updates", False, f"Request error: {str(e)}")
            return False
    
    def test_global_log_system(self):
        """Test 5: Global log system (GET /api/global-log)"""
        try:
            response = requests.get(f"{self.base_url}/global-log", timeout=10)
            
            if response.status_code == 200:
                log_entries = response.json()
                if isinstance(log_entries, list):
                    if len(log_entries) > 0:
                        # Verify log entry structure
                        first_entry = log_entries[0]
                        required_fields = ["id", "member_id", "member_name", "company_id", "company_name", 
                                         "field_changed", "old_value", "new_value", "timestamp", "change_type"]
                        
                        if all(field in first_entry for field in required_fields):
                            self.log_test("Global Log System", True, f"Retrieved {len(log_entries)} log entries with correct structure")
                            return True
                        else:
                            missing_fields = [f for f in required_fields if f not in first_entry]
                            self.log_test("Global Log System", False, f"Log entry missing fields: {missing_fields}")
                            return False
                    else:
                        self.log_test("Global Log System", False, "No log entries found")
                        return False
                else:
                    self.log_test("Global Log System", False, "Response is not a list")
                    return False
            else:
                self.log_test("Global Log System", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Global Log System", False, f"Request error: {str(e)}")
            return False
    
    def test_dashboard_stats(self):
        """Test 6: Dashboard stats (GET /api/dashboard/stats)"""
        try:
            response = requests.get(f"{self.base_url}/dashboard/stats", timeout=10)
            
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["total_members", "total_companies", "total_points", "recent_activity"]
                
                if all(field in stats for field in required_fields):
                    if (stats["total_members"] == 4 and stats["total_companies"] == 3):
                        self.log_test("Dashboard Stats", True, 
                                    f"Stats correct: {stats['total_members']} members, {stats['total_companies']} companies, {stats['total_points']} points, {stats['recent_activity']} recent activities")
                        return True
                    else:
                        self.log_test("Dashboard Stats", False, f"Unexpected member/company counts: {stats}")
                        return False
                else:
                    missing_fields = [f for f in required_fields if f not in stats]
                    self.log_test("Dashboard Stats", False, f"Missing required fields: {missing_fields}")
                    return False
            else:
                self.log_test("Dashboard Stats", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Dashboard Stats", False, f"Request error: {str(e)}")
            return False
    
    def test_postit_crud_operations(self):
        """Test 7: Post-it CRUD operations (GET, POST, PUT, DELETE /api/postits)"""
        try:
            # Test GET (initial state)
            response = requests.get(f"{self.base_url}/postits", timeout=10)
            if response.status_code != 200:
                self.log_test("Post-it CRUD Operations", False, f"GET failed: HTTP {response.status_code}")
                return False
            
            initial_count = len(response.json())
            
            # Test POST (create)
            create_data = {"content": "Dark mode verification test post-it"}
            response = requests.post(f"{self.base_url}/postits", json=create_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Post-it CRUD Operations", False, f"POST failed: HTTP {response.status_code}")
                return False
            
            new_postit = response.json()
            postit_id = new_postit["id"]
            
            # Test PUT (update)
            update_data = {"content": "Updated post-it after dark mode implementation"}
            response = requests.put(f"{self.base_url}/postits/{postit_id}", json=update_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Post-it CRUD Operations", False, f"PUT failed: HTTP {response.status_code}")
                return False
            
            # Test DELETE
            response = requests.delete(f"{self.base_url}/postits/{postit_id}", timeout=10)
            if response.status_code != 200:
                self.log_test("Post-it CRUD Operations", False, f"DELETE failed: HTTP {response.status_code}")
                return False
            
            # Verify final state
            response = requests.get(f"{self.base_url}/postits", timeout=10)
            final_count = len(response.json())
            
            if final_count == initial_count:
                self.log_test("Post-it CRUD Operations", True, "All CRUD operations (GET, POST, PUT, DELETE) working correctly")
                return True
            else:
                self.log_test("Post-it CRUD Operations", False, f"Count mismatch: initial={initial_count}, final={final_count}")
                return False
                
        except Exception as e:
            self.log_test("Post-it CRUD Operations", False, f"Request error: {str(e)}")
            return False
    
    def run_verification(self):
        """Run all verification tests"""
        print("🌙 Dark Mode Backend Verification Tests")
        print("Ensuring dark mode implementation didn't break backend functionality")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 80)
        
        tests = [
            ("User Authentication Access", self.test_user_authentication_simulation),
            ("Member Data Retrieval", self.test_member_data_retrieval),
            ("Company Data Retrieval", self.test_company_data_retrieval),
            ("Program Field Updates", self.test_program_field_updates),
            ("Global Log System", self.test_global_log_system),
            ("Dashboard Stats", self.test_dashboard_stats),
            ("Post-it CRUD Operations", self.test_postit_crud_operations),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            print(f"\n🧪 Testing: {test_name}")
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
                failed += 1
            
            time.sleep(0.5)
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 DARK MODE BACKEND VERIFICATION SUMMARY")
        print("=" * 80)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("\n🎉 ALL BACKEND ENDPOINTS WORKING CORRECTLY!")
            print("✨ Dark mode implementation did not break any backend functionality")
            print("🔒 Authentication: Frontend-only (lech/milhas.online)")
            print("👥 Family members: Osvandré, Marilise, Graciela, Leonardo")
            print("🏢 Loyalty programs: LATAM, Smiles, Azul")
            print("📝 All CRUD operations functional")
        else:
            print(f"\n⚠️  {failed} test(s) failed. Backend may have issues.")
        
        return failed == 0

if __name__ == "__main__":
    verifier = DarkModeBackendVerification()
    success = verifier.run_verification()
    exit(0 if success else 1)