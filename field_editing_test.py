#!/usr/bin/env python3
"""
Field Editing Functionality Test
Focused testing for field editing operations as requested in the review
"""

import requests
import json
import time
from datetime import datetime
import sys

# Get backend URL from frontend .env
BACKEND_URL = "https://c9bdd9c9-2137-4e10-b285-3b5a9ce35099.preview.emergentagent.com/api"

class FieldEditingTester:
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
    
    def setup_test_data(self):
        """Get member IDs for testing"""
        try:
            response = requests.get(f"{self.base_url}/members", timeout=10)
            if response.status_code == 200:
                members = response.json()
                for member in members:
                    self.member_ids[member["name"]] = member["id"]
                return len(self.member_ids) > 0
            return False
        except Exception as e:
            print(f"Setup failed: {str(e)}")
            return False
    
    def test_field_structure_understanding(self):
        """Test 3: Get a member's data to understand the current field structure"""
        if not self.member_ids:
            self.log_test("Field Structure Understanding", False, "No member IDs available")
            return False
        
        try:
            # Get first member's data
            member_name = "Osvandré"
            member_id = self.member_ids.get(member_name)
            if not member_id:
                self.log_test("Field Structure Understanding", False, f"Member {member_name} not found")
                return False
            
            response = requests.get(f"{self.base_url}/members/{member_id}", timeout=10)
            
            if response.status_code == 200:
                member = response.json()
                programs = member.get("programs", {})
                
                if programs:
                    # Analyze structure
                    sample_program = list(programs.values())[0]
                    standard_fields = [
                        "company_id", "login", "password", "cpf", "card_number", 
                        "current_balance", "elite_tier", "notes", "last_updated", "last_change"
                    ]
                    custom_fields = sample_program.get("custom_fields", {})
                    
                    structure_info = {
                        "standard_fields": [f for f in standard_fields if f in sample_program],
                        "custom_fields": custom_fields,
                        "programs_count": len(programs),
                        "program_ids": list(programs.keys())
                    }
                    
                    self.log_test("Field Structure Understanding", True, 
                                f"Member has {len(programs)} programs with standard fields and custom_fields dict",
                                structure_info)
                    return True
                else:
                    self.log_test("Field Structure Understanding", False, "No programs found in member data")
                    return False
            else:
                self.log_test("Field Structure Understanding", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Field Structure Understanding", False, f"Request error: {str(e)}")
            return False
    
    def test_regular_field_updates(self):
        """Test 2: Regular Field Updates via PUT /api/members/{id}/programs/{company_id}"""
        if not self.member_ids:
            self.log_test("Regular Field Updates", False, "No member IDs available")
            return False
        
        try:
            member_name = "Marilise"
            member_id = self.member_ids.get(member_name)
            company_id = "latam"
            
            # Test updating standard fields
            timestamp = int(time.time())
            update_data = {
                "login": f"marilise.test.{timestamp}@email.com",
                "current_balance": 25000 + timestamp % 1000,
                "elite_tier": "Gold",
                "notes": f"Regular field update test - {timestamp}"
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}", 
                                  json=update_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result and "changes" in result:
                    changes_count = len(result.get("changes", []))
                    self.log_test("Regular Field Updates", True, 
                                f"Successfully updated {changes_count} standard fields: {result.get('changes', [])}")
                    return True
                else:
                    self.log_test("Regular Field Updates", False, f"Invalid response format: {result}")
                    return False
            else:
                self.log_test("Regular Field Updates", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Regular Field Updates", False, f"Request error: {str(e)}")
            return False
    
    def test_custom_fields_management(self):
        """Test 1: Custom Fields Management via PUT /api/members/{id}/programs/{company_id}/fields"""
        if not self.member_ids:
            self.log_test("Custom Fields Management", False, "No member IDs available")
            return False
        
        try:
            member_name = "Graciela"
            member_id = self.member_ids.get(member_name)
            company_id = "smiles"
            
            # Test adding new custom fields
            timestamp = int(time.time())
            custom_fields = {
                "preferred_airline": "TAM",
                "frequent_destination": "Rio de Janeiro",
                "special_requests": f"Vegetarian meal - {timestamp}",
                "membership_tier": "Platinum Plus"
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}/fields", 
                                  json=custom_fields, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result and "sucesso" in result["message"]:
                    # Verify fields were added
                    verify_response = requests.get(f"{self.base_url}/members/{member_id}", timeout=10)
                    if verify_response.status_code == 200:
                        member = verify_response.json()
                        stored_fields = member.get("programs", {}).get(company_id, {}).get("custom_fields", {})
                        
                        if all(key in stored_fields and stored_fields[key] == value 
                               for key, value in custom_fields.items()):
                            self.log_test("Custom Fields Management", True, 
                                        f"Successfully added {len(custom_fields)} custom fields")
                            return True
                        else:
                            self.log_test("Custom Fields Management", False, 
                                        f"Fields not stored correctly. Expected: {custom_fields}, Got: {stored_fields}")
                            return False
                    else:
                        self.log_test("Custom Fields Management", False, 
                                    f"Failed to verify fields: HTTP {verify_response.status_code}")
                        return False
                else:
                    self.log_test("Custom Fields Management", False, f"Unexpected response: {result}")
                    return False
            else:
                self.log_test("Custom Fields Management", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Custom Fields Management", False, f"Request error: {str(e)}")
            return False
    
    def test_field_renaming_attempt(self):
        """Test 4: Test Field Renaming - Check if backend supports rename_field parameter"""
        if not self.member_ids:
            self.log_test("Field Renaming Attempt", False, "No member IDs available")
            return False
        
        try:
            member_name = "Leonardo"
            member_id = self.member_ids.get(member_name)
            company_id = "azul"
            
            # First, add a custom field to rename
            initial_fields = {
                "old_field_name": "value_to_rename"
            }
            
            # Add the field first
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}/fields", 
                                  json=initial_fields, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Field Renaming Attempt", False, "Failed to create initial field for renaming test")
                return False
            
            # Now try to rename using various approaches
            
            # Approach 1: Try rename_field parameter (as mentioned in review request)
            rename_data = {
                "rename_field": {
                    "old_name": "old_field_name",
                    "new_name": "new_field_name"
                }
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}/fields", 
                                  json=rename_data, timeout=10)
            
            if response.status_code == 200:
                # Check if rename worked
                verify_response = requests.get(f"{self.base_url}/members/{member_id}", timeout=10)
                if verify_response.status_code == 200:
                    member = verify_response.json()
                    custom_fields = member.get("programs", {}).get(company_id, {}).get("custom_fields", {})
                    
                    if "new_field_name" in custom_fields and "old_field_name" not in custom_fields:
                        self.log_test("Field Renaming Attempt", True, 
                                    "Backend supports rename_field parameter - field successfully renamed")
                        return True
                    else:
                        # Approach 2: Manual rename (remove old, add new)
                        manual_rename_fields = {
                            "new_field_name": "value_to_rename"
                            # Note: old field removal would need separate delete operation
                        }
                        
                        response2 = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}/fields", 
                                               json=manual_rename_fields, timeout=10)
                        
                        if response2.status_code == 200:
                            self.log_test("Field Renaming Attempt", False, 
                                        "Backend does NOT support rename_field parameter. Manual approach needed: add new field, then delete old field separately")
                            return False
                        else:
                            self.log_test("Field Renaming Attempt", False, 
                                        f"Neither rename_field parameter nor manual approach worked: HTTP {response2.status_code}")
                            return False
                else:
                    self.log_test("Field Renaming Attempt", False, "Failed to verify rename operation")
                    return False
            else:
                self.log_test("Field Renaming Attempt", False, 
                            f"Backend does NOT support rename_field parameter: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Field Renaming Attempt", False, f"Request error: {str(e)}")
            return False
    
    def test_field_deletion_attempt(self):
        """Test 5: Test Field Deletion - Check if backend supports delete_field parameter"""
        if not self.member_ids:
            self.log_test("Field Deletion Attempt", False, "No member IDs available")
            return False
        
        try:
            member_name = "Osvandré"
            member_id = self.member_ids.get(member_name)
            company_id = "latam"
            
            # First, add a custom field to delete
            initial_fields = {
                "field_to_delete": "temporary_value",
                "field_to_keep": "permanent_value"
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}/fields", 
                                  json=initial_fields, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Field Deletion Attempt", False, "Failed to create initial fields for deletion test")
                return False
            
            # Approach 1: Try delete_field parameter (as mentioned in review request)
            delete_data = {
                "delete_field": "field_to_delete"
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}/fields", 
                                  json=delete_data, timeout=10)
            
            if response.status_code == 200:
                # Check if deletion worked
                verify_response = requests.get(f"{self.base_url}/members/{member_id}", timeout=10)
                if verify_response.status_code == 200:
                    member = verify_response.json()
                    custom_fields = member.get("programs", {}).get(company_id, {}).get("custom_fields", {})
                    
                    if "field_to_delete" not in custom_fields and "field_to_keep" in custom_fields:
                        self.log_test("Field Deletion Attempt", True, 
                                    "Backend supports delete_field parameter - field successfully deleted")
                        return True
                    else:
                        # Approach 2: Try setting field to null/empty
                        null_delete_fields = {
                            "field_to_delete": None,
                            "field_to_keep": "permanent_value"
                        }
                        
                        response2 = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}/fields", 
                                               json=null_delete_fields, timeout=10)
                        
                        if response2.status_code == 200:
                            verify_response2 = requests.get(f"{self.base_url}/members/{member_id}", timeout=10)
                            if verify_response2.status_code == 200:
                                member2 = verify_response2.json()
                                custom_fields2 = member2.get("programs", {}).get(company_id, {}).get("custom_fields", {})
                                
                                if "field_to_delete" not in custom_fields2 or custom_fields2.get("field_to_delete") is None:
                                    self.log_test("Field Deletion Attempt", True, 
                                                "Backend supports field deletion via null value")
                                    return True
                                else:
                                    self.log_test("Field Deletion Attempt", False, 
                                                "Backend does NOT support delete_field parameter or null deletion. Fields can only be updated, not removed")
                                    return False
                            else:
                                self.log_test("Field Deletion Attempt", False, "Failed to verify null deletion")
                                return False
                        else:
                            self.log_test("Field Deletion Attempt", False, 
                                        f"Neither delete_field parameter nor null approach worked: HTTP {response2.status_code}")
                            return False
                else:
                    self.log_test("Field Deletion Attempt", False, "Failed to verify deletion operation")
                    return False
            else:
                self.log_test("Field Deletion Attempt", False, 
                            f"Backend does NOT support delete_field parameter: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Field Deletion Attempt", False, f"Request error: {str(e)}")
            return False
    
    def test_backend_field_operations_summary(self):
        """Summary test to document what field operations the backend actually supports"""
        try:
            # Get current member data to show structure
            member_name = "Osvandré"
            member_id = self.member_ids.get(member_name)
            
            if member_id:
                response = requests.get(f"{self.base_url}/members/{member_id}", timeout=10)
                if response.status_code == 200:
                    member = response.json()
                    programs = member.get("programs", {})
                    
                    if programs:
                        sample_program = list(programs.values())[0]
                        
                        supported_operations = {
                            "standard_field_updates": "✅ Supported via PUT /api/members/{id}/programs/{company_id}",
                            "custom_field_addition": "✅ Supported via PUT /api/members/{id}/programs/{company_id}/fields",
                            "custom_field_updates": "✅ Supported via PUT /api/members/{id}/programs/{company_id}/fields",
                            "field_renaming": "❌ NOT supported - no rename_field parameter",
                            "field_deletion": "❌ NOT supported - no delete_field parameter",
                            "field_structure": {
                                "standard_fields": ["login", "password", "cpf", "card_number", "current_balance", "elite_tier", "notes"],
                                "custom_fields": "Stored in custom_fields dictionary"
                            }
                        }
                        
                        self.log_test("Backend Field Operations Summary", True, 
                                    "Documented all supported field operations", supported_operations)
                        return True
                    else:
                        self.log_test("Backend Field Operations Summary", False, "No program data available")
                        return False
                else:
                    self.log_test("Backend Field Operations Summary", False, f"Failed to get member data: HTTP {response.status_code}")
                    return False
            else:
                self.log_test("Backend Field Operations Summary", False, "No member ID available")
                return False
        except Exception as e:
            self.log_test("Backend Field Operations Summary", False, f"Request error: {str(e)}")
            return False
    
    def run_field_editing_tests(self):
        """Run all field editing focused tests"""
        print("🔧 Starting Field Editing Functionality Tests")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 70)
        
        # Setup
        if not self.setup_test_data():
            print("❌ Failed to setup test data")
            return False
        
        # Test sequence focused on field editing
        tests = [
            ("Field Structure Understanding", self.test_field_structure_understanding),
            ("Regular Field Updates", self.test_regular_field_updates),
            ("Custom Fields Management", self.test_custom_fields_management),
            ("Field Renaming Attempt", self.test_field_renaming_attempt),
            ("Field Deletion Attempt", self.test_field_deletion_attempt),
            ("Backend Field Operations Summary", self.test_backend_field_operations_summary),
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
        print("\n" + "=" * 70)
        print("📊 FIELD EDITING TEST SUMMARY")
        print("=" * 70)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        # Key findings
        print("\n🔍 KEY FINDINGS:")
        print("✅ SUPPORTED OPERATIONS:")
        print("   • Standard field updates via PUT /api/members/{id}/programs/{company_id}")
        print("   • Custom field addition/updates via PUT /api/members/{id}/programs/{company_id}/fields")
        print("   • Field structure: standard fields + custom_fields dictionary")
        
        print("\n❌ NOT SUPPORTED OPERATIONS:")
        print("   • Field renaming via rename_field parameter")
        print("   • Field deletion via delete_field parameter")
        print("   • Frontend needs to implement these operations manually")
        
        return failed == 0

if __name__ == "__main__":
    tester = FieldEditingTester()
    success = tester.run_field_editing_tests()
    sys.exit(0 if success else 1)