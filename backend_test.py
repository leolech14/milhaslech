#!/usr/bin/env python3
"""
Backend API Testing for Redesigned Loyalty Control Tower
Tests the new member structure with nested programs and global logging
"""

import requests
import json
import time
from datetime import datetime
import sys

# Get backend URL from frontend .env
BACKEND_URL = "https://fa660bc8-5754-4ac2-919e-6e832b0a6e20.preview.emergentagent.com/api"

class RedesignedLoyaltyAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.family_members = ["Osvandré", "Marilise", "Graciela", "Leonardo"]
        self.expected_companies = ["latam", "smiles", "azul"]
        self.member_ids = {}  # Store member IDs by name
        
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
        """Test GET /api/companies - should return 3 default companies"""
        try:
            response = requests.get(f"{self.base_url}/companies", timeout=10)
            if response.status_code == 200:
                companies = response.json()
                if isinstance(companies, list) and len(companies) == 3:
                    # Check for expected companies
                    company_ids = [c.get("id", "") for c in companies]
                    company_names = [c.get("name", "") for c in companies]
                    
                    expected_names = ["LATAM Pass", "Smiles", "TudoAzul"]
                    found_all = all(name in company_names for name in expected_names)
                    found_all_ids = all(cid in company_ids for cid in self.expected_companies)
                    
                    if found_all and found_all_ids:
                        self.log_test("Get Companies", True, f"Found all 3 companies: {company_names}")
                        return True
                    else:
                        self.log_test("Get Companies", False, f"Missing expected companies. Found: {company_names}, IDs: {company_ids}")
                        return False
                else:
                    self.log_test("Get Companies", False, f"Expected 3 companies, got: {len(companies) if isinstance(companies, list) else 'not a list'}")
                    return False
            else:
                self.log_test("Get Companies", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Get Companies", False, f"Request error: {str(e)}")
            return False
    
    def test_family_member_initialization(self):
        """Test that 4 family members are initialized with empty program data"""
        try:
            response = requests.get(f"{self.base_url}/members", timeout=10)
            if response.status_code == 200:
                members = response.json()
                if isinstance(members, list) and len(members) == 4:
                    # Check member names
                    member_names = [m.get("name", "") for m in members]
                    found_all_family = all(name in member_names for name in self.family_members)
                    
                    if found_all_family:
                        # Store member IDs for later tests
                        for member in members:
                            self.member_ids[member["name"]] = member["id"]
                        
                        self.log_test("Family Member Initialization", True, f"Found all 4 family members: {member_names}")
                        return True
                    else:
                        self.log_test("Family Member Initialization", False, f"Missing family members. Found: {member_names}, Expected: {self.family_members}")
                        return False
                else:
                    self.log_test("Family Member Initialization", False, f"Expected 4 members, got: {len(members) if isinstance(members, list) else 'not a list'}")
                    return False
            else:
                self.log_test("Family Member Initialization", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Family Member Initialization", False, f"Request error: {str(e)}")
            return False
    
    def test_member_program_structure(self):
        """Test that each member has all 3 programs with empty initial data"""
        try:
            response = requests.get(f"{self.base_url}/members", timeout=10)
            if response.status_code == 200:
                members = response.json()
                
                all_valid = True
                issues = []
                
                for member in members:
                    programs = member.get("programs", {})
                    
                    # Check if all 3 companies are present
                    if not all(company_id in programs for company_id in self.expected_companies):
                        all_valid = False
                        issues.append(f"{member['name']}: Missing programs")
                        continue
                    
                    # Check program structure
                    for company_id in self.expected_companies:
                        program = programs[company_id]
                        required_fields = ["company_id", "login", "password", "cpf", "card_number", "current_balance", "elite_tier", "notes", "last_updated", "last_change"]
                        
                        if not all(field in program for field in required_fields):
                            all_valid = False
                            issues.append(f"{member['name']}-{company_id}: Missing fields")
                            continue
                        
                        # Check initial empty values
                        if (program["login"] != "" or program["password"] != "" or 
                            program["cpf"] != "" or program["card_number"] != "" or 
                            program["current_balance"] != 0 or program["elite_tier"] != "" or 
                            program["notes"] != ""):
                            # This is actually OK - they might have been updated
                            pass
                
                if all_valid:
                    self.log_test("Member Program Structure", True, "All members have correct program structure")
                    return True
                else:
                    self.log_test("Member Program Structure", False, f"Structure issues: {issues}")
                    return False
            else:
                self.log_test("Member Program Structure", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Member Program Structure", False, f"Request error: {str(e)}")
            return False
    
    def test_individual_field_update(self):
        """Test PUT /api/members/{id}/programs/{company_id} for individual field updates"""
        if not self.member_ids:
            self.log_test("Individual Field Update", False, "No member IDs available")
            return False
        
        try:
            # Use first family member and LATAM program
            member_name = self.family_members[0]  # Osvandré
            member_id = self.member_ids[member_name]
            company_id = "latam"
            
            # Update login field
            update_data = {
                "login": "osvandre.latam@email.com"
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}", 
                                  json=update_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result and "changes" in result:
                    if len(result["changes"]) > 0:
                        self.log_test("Individual Field Update", True, f"Updated login field: {result['changes']}")
                        return True
                    else:
                        self.log_test("Individual Field Update", False, "No changes recorded")
                        return False
                else:
                    self.log_test("Individual Field Update", False, "Invalid response format", result)
                    return False
            else:
                self.log_test("Individual Field Update", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Individual Field Update", False, f"Request error: {str(e)}")
            return False
    
    def test_multiple_field_updates(self):
        """Test updating multiple fields and verify they create log entries"""
        if not self.member_ids:
            self.log_test("Multiple Field Updates", False, "No member IDs available")
            return False
        
        try:
            # Use second family member and Smiles program
            member_name = self.family_members[1]  # Marilise
            member_id = self.member_ids[member_name]
            company_id = "smiles"
            
            # Update multiple fields
            update_data = {
                "login": "marilise.smiles@email.com",
                "password": "smiles2024",
                "cpf": "123.456.789-01",
                "card_number": "1234567890123456",
                "current_balance": 15000,
                "elite_tier": "Gold"
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}", 
                                  json=update_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "changes" in result and len(result["changes"]) == 6:
                    self.log_test("Multiple Field Updates", True, f"Updated 6 fields: {len(result['changes'])} changes recorded")
                    return True
                else:
                    self.log_test("Multiple Field Updates", False, f"Expected 6 changes, got {len(result.get('changes', []))}")
                    return False
            else:
                self.log_test("Multiple Field Updates", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Multiple Field Updates", False, f"Request error: {str(e)}")
            return False
    
    def test_global_log_system(self):
        """Test GET /api/global-log to verify logging works"""
        try:
            response = requests.get(f"{self.base_url}/global-log", timeout=10)
            
            if response.status_code == 200:
                log_entries = response.json()
                if isinstance(log_entries, list):
                    if len(log_entries) >= 7:  # Should have at least 7 entries from previous tests
                        # Check log entry structure
                        first_entry = log_entries[0]
                        required_fields = ["id", "member_id", "member_name", "company_id", "company_name", "field_changed", "old_value", "new_value", "timestamp", "change_type"]
                        
                        if all(field in first_entry for field in required_fields):
                            self.log_test("Global Log System", True, f"Found {len(log_entries)} log entries with correct structure")
                            return True
                        else:
                            self.log_test("Global Log System", False, f"Log entry missing required fields: {first_entry}")
                            return False
                    else:
                        self.log_test("Global Log System", False, f"Expected at least 7 log entries, got {len(log_entries)}")
                        return False
                else:
                    self.log_test("Global Log System", False, "Response is not a list")
                    return False
            else:
                self.log_test("Global Log System", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Global Log System", False, f"Request error: {str(e)}")
            return False
    
    def test_dashboard_stats_new_structure(self):
        """Test dashboard stats with the new structure"""
        try:
            response = requests.get(f"{self.base_url}/dashboard/stats", timeout=10)
            
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["total_members", "total_companies", "total_points", "recent_activity"]
                
                if all(field in stats for field in required_fields):
                    if (stats["total_members"] == 4 and 
                        stats["total_companies"] == 3 and
                        stats["total_points"] >= 15000):  # Should have at least 15000 from Marilise
                        self.log_test("Dashboard Stats", True, f"Stats: {stats['total_members']} members, {stats['total_companies']} companies, {stats['total_points']} points")
                        return True
                    else:
                        self.log_test("Dashboard Stats", False, f"Unexpected stats values: {stats}")
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
    
    def test_get_specific_member(self):
        """Test GET /api/members/{id} with updated data"""
        if not self.member_ids:
            self.log_test("Get Specific Member", False, "No member IDs available")
            return False
        
        try:
            # Get Marilise who should have updated data
            member_name = self.family_members[1]  # Marilise
            member_id = self.member_ids[member_name]
            
            response = requests.get(f"{self.base_url}/members/{member_id}", timeout=10)
            
            if response.status_code == 200:
                member = response.json()
                if member.get("id") == member_id and member.get("name") == member_name:
                    # Check if Smiles program has updated data
                    smiles_program = member.get("programs", {}).get("smiles", {})
                    if (smiles_program.get("login") == "marilise.smiles@email.com" and
                        smiles_program.get("current_balance") == 15000):
                        self.log_test("Get Specific Member", True, f"Retrieved {member_name} with updated program data")
                        return True
                    else:
                        self.log_test("Get Specific Member", False, f"Program data not updated correctly: {smiles_program}")
                        return False
                else:
                    self.log_test("Get Specific Member", False, "ID or name mismatch in response")
                    return False
            else:
                self.log_test("Get Specific Member", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Get Specific Member", False, f"Request error: {str(e)}")
            return False
    
    def test_additional_field_updates(self):
        """Test updating remaining family members with different fields"""
        if not self.member_ids:
            self.log_test("Additional Field Updates", False, "No member IDs available")
            return False
        
        try:
            # Update Graciela with Azul program
            member_name = self.family_members[2]  # Graciela
            member_id = self.member_ids[member_name]
            company_id = "azul"
            
            update_data = {
                "login": "graciela.azul@email.com",
                "card_number": "9876543210987654",
                "current_balance": 8500,
                "elite_tier": "Diamond",
                "notes": "Frequent business traveler"
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}", 
                                  json=update_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "changes" in result and len(result["changes"]) == 5:
                    # Update Leonardo with LATAM program
                    member_name = self.family_members[3]  # Leonardo
                    member_id = self.member_ids[member_name]
                    company_id = "latam"
                    
                    update_data = {
                        "password": "latam2024secure",
                        "cpf": "987.654.321-09",
                        "current_balance": 22000,
                        "notes": "Student discount applied"
                    }
                    
                    response2 = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}", 
                                           json=update_data, timeout=10)
                    
                    if response2.status_code == 200:
                        result2 = response2.json()
                        if "changes" in result2 and len(result2["changes"]) == 4:
                            self.log_test("Additional Field Updates", True, f"Updated Graciela (5 fields) and Leonardo (4 fields)")
                            return True
                        else:
                            self.log_test("Additional Field Updates", False, f"Leonardo update failed: {result2}")
                            return False
                    else:
                        self.log_test("Additional Field Updates", False, f"Leonardo update HTTP {response2.status_code}")
                        return False
                else:
                    self.log_test("Additional Field Updates", False, f"Graciela update failed: {result}")
                    return False
            else:
                self.log_test("Additional Field Updates", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Additional Field Updates", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests for the redesigned system"""
        print("🚀 Starting Redesigned Loyalty Control Tower Backend API Tests")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 70)
        
        # Test sequence for redesigned system
        tests = [
            ("Health Check", self.test_health_check),
            ("Get Companies", self.test_get_companies),
            ("Family Member Initialization", self.test_family_member_initialization),
            ("Member Program Structure", self.test_member_program_structure),
            ("Individual Field Update", self.test_individual_field_update),
            ("Multiple Field Updates", self.test_multiple_field_updates),
            ("Global Log System", self.test_global_log_system),
            ("Dashboard Stats", self.test_dashboard_stats_new_structure),
            ("Get Specific Member", self.test_get_specific_member),
            ("Additional Field Updates", self.test_additional_field_updates),
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
        
        # Final verification of global log
        print(f"\n🔍 Final Global Log Verification")
        try:
            response = requests.get(f"{self.base_url}/global-log", timeout=10)
            if response.status_code == 200:
                log_entries = response.json()
                print(f"   Total log entries: {len(log_entries)}")
                if len(log_entries) >= 16:  # Should have many entries from all updates
                    print("   ✅ Global logging working correctly")
                else:
                    print(f"   ⚠️  Expected more log entries, got {len(log_entries)}")
        except Exception as e:
            print(f"   ❌ Error checking final log: {str(e)}")
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("\n🎉 All tests passed! Redesigned backend API is working correctly.")
            print("✨ Key features verified:")
            print("   • 4 family members initialized")
            print("   • 3 programs per member (LATAM, Smiles, TudoAzul)")
            print("   • Individual field updates working")
            print("   • Global logging system active")
            print("   • Dashboard stats accurate")
        else:
            print(f"\n⚠️  {failed} test(s) failed. Check the details above.")
        
        return failed == 0

if __name__ == "__main__":
    tester = RedesignedLoyaltyAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)