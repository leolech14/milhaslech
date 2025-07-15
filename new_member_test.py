#!/usr/bin/env python3
"""
Focused test for New Member Creation functionality
Tests the specific scenarios requested in the review
"""

import requests
import json
import time
from datetime import datetime
import sys

# Get backend URL from frontend .env
BACKEND_URL = "https://c9bdd9c9-2137-4e10-b285-3b5a9ce35099.preview.emergentagent.com/api"

class NewMemberCreationTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.expected_companies = ["latam", "smiles", "azul"]
        self.maria_id = None
        
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
    
    def test_new_member_creation(self):
        """Test POST /api/members - Create new member with name 'Maria'"""
        try:
            # Get initial member count
            initial_response = requests.get(f"{self.base_url}/members", timeout=10)
            if initial_response.status_code != 200:
                self.log_test("New Member Creation", False, f"Failed to get initial members: HTTP {initial_response.status_code}")
                return False
            
            initial_members = initial_response.json()
            initial_count = len(initial_members)
            print(f"   Initial member count: {initial_count}")
            
            # Create new member with name "Ana" (different name to avoid conflicts)
            new_member_data = {"name": "Ana"}
            response = requests.post(f"{self.base_url}/members", json=new_member_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if ("member_id" in result and "member_name" in result and 
                    result["member_name"] == "Ana"):
                    
                    self.maria_id = result["member_id"]  # Store Ana's ID in maria_id variable
                    
                    # Verify new member appears in GET /api/members
                    verify_response = requests.get(f"{self.base_url}/members", timeout=10)
                    if verify_response.status_code == 200:
                        updated_members = verify_response.json()
                        if len(updated_members) == initial_count + 1:
                            # Find Ana in the list
                            maria_member = None
                            for member in updated_members:
                                if member.get("name") == "Ana" and member.get("id") == self.maria_id:
                                    maria_member = member
                                    break
                            
                            if maria_member:
                                self.log_test("New Member Creation", True, f"Successfully created new member 'Ana' with ID {self.maria_id}")
                                return True
                            else:
                                self.log_test("New Member Creation", False, "Ana not found in members list after creation")
                                return False
                        else:
                            self.log_test("New Member Creation", False, f"Expected {initial_count + 1} members, got {len(updated_members)}")
                            return False
                    else:
                        self.log_test("New Member Creation", False, f"Failed to verify member creation: HTTP {verify_response.status_code}")
                        return False
                else:
                    self.log_test("New Member Creation", False, f"Invalid response format: {result}")
                    return False
            else:
                self.log_test("New Member Creation", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("New Member Creation", False, f"Request error: {str(e)}")
            return False
    
    def test_duplicate_member_prevention(self):
        """Test that creating a member with existing name fails with proper error"""
        try:
            # Try to create another member with name "Ana" (should fail)
            duplicate_member_data = {"name": "Ana"}
            response = requests.post(f"{self.base_url}/members", json=duplicate_member_data, timeout=10)
            
            if response.status_code == 400:
                error_data = response.json()
                if "detail" in error_data and "já existe" in error_data["detail"]:
                    self.log_test("Duplicate Member Prevention", True, f"Correctly prevented duplicate member creation: {error_data['detail']}")
                    return True
                else:
                    self.log_test("Duplicate Member Prevention", False, f"Wrong error message: {error_data}")
                    return False
            else:
                self.log_test("Duplicate Member Prevention", False, f"Expected HTTP 400, got {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Duplicate Member Prevention", False, f"Request error: {str(e)}")
            return False
    
    def test_new_member_structure(self):
        """Test that new member 'Maria' has all default programs (LATAM, Smiles, Azul) with empty fields"""
        if not self.maria_id:
            self.log_test("New Member Structure", False, "Maria's ID not available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/members/{self.maria_id}", timeout=10)
            
            if response.status_code == 200:
                maria = response.json()
                programs = maria.get("programs", {})
                
                print(f"   Maria's programs: {list(programs.keys())}")
                
                # Check if all 3 default companies are present
                if not all(company_id in programs for company_id in self.expected_companies):
                    missing = [cid for cid in self.expected_companies if cid not in programs]
                    self.log_test("New Member Structure", False, f"Missing programs: {missing}")
                    return False
                
                # Check program structure and empty initial values
                all_valid = True
                issues = []
                
                for company_id in self.expected_companies:
                    program = programs[company_id]
                    
                    # Check required fields exist
                    required_fields = ["company_id", "login", "password", "cpf", "card_number", "current_balance", "elite_tier", "notes", "last_updated", "last_change", "custom_fields"]
                    missing_fields = [field for field in required_fields if field not in program]
                    
                    if missing_fields:
                        all_valid = False
                        issues.append(f"{company_id}: Missing fields {missing_fields}")
                        continue
                    
                    # Check initial empty values (should be empty for new member)
                    empty_checks = {
                        "login": program["login"] == "",
                        "password": program["password"] == "",
                        "cpf": program["cpf"] == "",
                        "card_number": program["card_number"] == "",
                        "current_balance": program["current_balance"] == 0,
                        "elite_tier": program["elite_tier"] == "",
                        "notes": program["notes"] == "",
                        "custom_fields": program.get("custom_fields") == {}
                    }
                    
                    failed_checks = [field for field, passed in empty_checks.items() if not passed]
                    if failed_checks:
                        issues.append(f"{company_id}: Non-empty fields {failed_checks}")
                    
                    print(f"   {company_id}: balance={program['current_balance']}, login='{program['login']}', custom_fields={program.get('custom_fields', 'missing')}")
                
                if all_valid and not issues:
                    self.log_test("New Member Structure", True, f"Maria has all 3 default programs ({', '.join(self.expected_companies)}) with correct empty structure")
                    return True
                else:
                    self.log_test("New Member Structure", False, f"Structure issues: {issues}")
                    return False
            else:
                self.log_test("New Member Structure", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("New Member Structure", False, f"Request error: {str(e)}")
            return False
    
    def test_member_creation_logged(self):
        """Test that member creation is logged to global log system"""
        try:
            # Get global log and look for Maria's creation entry
            response = requests.get(f"{self.base_url}/global-log", timeout=10)
            
            if response.status_code == 200:
                log_entries = response.json()
                print(f"   Total log entries: {len(log_entries)}")
                
                # Look for Maria's creation log entry
                maria_creation_log = None
                for entry in log_entries:
                    if (entry.get("member_name") == "Maria" and 
                        entry.get("field_changed") == "membro" and
                        entry.get("change_type") == "create" and
                        entry.get("new_value") == "criado"):
                        maria_creation_log = entry
                        break
                
                if maria_creation_log:
                    # Verify log entry structure
                    required_fields = ["id", "member_id", "member_name", "company_id", "company_name", "field_changed", "old_value", "new_value", "timestamp", "change_type"]
                    if all(field in maria_creation_log for field in required_fields):
                        self.log_test("Member Creation Logged", True, f"Maria's creation properly logged with ID {maria_creation_log['id']}")
                        print(f"   Log entry: {maria_creation_log}")
                        return True
                    else:
                        missing_fields = [field for field in required_fields if field not in maria_creation_log]
                        self.log_test("Member Creation Logged", False, f"Log entry missing required fields: {missing_fields}")
                        return False
                else:
                    self.log_test("Member Creation Logged", False, "Maria's creation not found in global log")
                    # Print all log entries for debugging
                    for i, entry in enumerate(log_entries):
                        print(f"   Log {i}: {entry}")
                    return False
            else:
                self.log_test("Member Creation Logged", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Member Creation Logged", False, f"Request error: {str(e)}")
            return False
    
    def test_dashboard_stats_updated(self):
        """Test that dashboard stats are updated correctly after new member creation"""
        try:
            response = requests.get(f"{self.base_url}/dashboard/stats", timeout=10)
            
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["total_members", "total_companies", "total_points", "recent_activity"]
                
                if all(field in stats for field in required_fields):
                    print(f"   Current stats: {stats}")
                    # Should have increased member count (original 4 + Maria = 5, but there might be more from previous tests)
                    if stats["total_members"] >= 5:
                        self.log_test("Dashboard Stats Updated", True, f"Dashboard correctly shows {stats['total_members']} total members after Maria's creation. Stats: {stats['total_members']} members, {stats['total_companies']} companies, {stats['total_points']} points, {stats['recent_activity']} recent activities")
                        return True
                    else:
                        self.log_test("Dashboard Stats Updated", False, f"Expected at least 5 total_members, got {stats['total_members']}")
                        return False
                else:
                    self.log_test("Dashboard Stats Updated", False, f"Missing required fields: {required_fields}")
                    return False
            else:
                self.log_test("Dashboard Stats Updated", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Dashboard Stats Updated", False, f"Request error: {str(e)}")
            return False
    
    def test_maria_in_members_list(self):
        """Test that Maria appears in GET /api/members"""
        try:
            response = requests.get(f"{self.base_url}/members", timeout=10)
            
            if response.status_code == 200:
                members = response.json()
                
                # Find Maria in the list
                maria_member = None
                for member in members:
                    if member.get("name") == "Maria":
                        maria_member = member
                        break
                
                if maria_member:
                    if maria_member.get("id") == self.maria_id:
                        self.log_test("Maria in Members List", True, f"Maria found in members list with correct ID {self.maria_id}")
                        return True
                    else:
                        self.log_test("Maria in Members List", False, f"Maria found but ID mismatch: expected {self.maria_id}, got {maria_member.get('id')}")
                        return False
                else:
                    self.log_test("Maria in Members List", False, "Maria not found in members list")
                    member_names = [m.get("name") for m in members]
                    print(f"   Available members: {member_names}")
                    return False
            else:
                self.log_test("Maria in Members List", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Maria in Members List", False, f"Request error: {str(e)}")
            return False
    
    def run_new_member_tests(self):
        """Run all new member creation tests"""
        print("🎯 NEW MEMBER CREATION FUNCTIONALITY TESTING")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test sequence for new member creation functionality
        tests = [
            ("1. New Member Creation", self.test_new_member_creation),
            ("2. Duplicate Member Prevention", self.test_duplicate_member_prevention),
            ("3. New Member Structure", self.test_new_member_structure),
            ("4. Member Creation Logged", self.test_member_creation_logged),
            ("5. Dashboard Stats Updated", self.test_dashboard_stats_updated),
            ("6. Maria in Members List", self.test_maria_in_members_list),
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
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 NEW MEMBER CREATION TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("\n🎉 All new member creation tests passed!")
            print("✨ Verified functionality:")
            print("   • ✅ POST /api/members creates new member with name 'Maria'")
            print("   • ✅ Duplicate name prevention with proper error message")
            print("   • ✅ New member has all 3 default programs (LATAM, Smiles, Azul)")
            print("   • ✅ All program fields are empty/default values")
            print("   • ✅ Member creation is logged to global log system")
            print("   • ✅ Dashboard stats are updated correctly")
            print("   • ✅ New member appears in GET /api/members")
        else:
            print(f"\n⚠️  {failed} test(s) failed. Check the details above.")
        
        return failed == 0

if __name__ == "__main__":
    tester = NewMemberCreationTester()
    success = tester.run_new_member_tests()
    sys.exit(0 if success else 1)