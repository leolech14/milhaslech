#!/usr/bin/env python3
"""
Member Deletion Functionality Testing
Tests the DELETE /api/members/{member_id} endpoint as requested in the review
"""

import requests
import json
import time
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://c9bdd9c9-2137-4e10-b285-3b5a9ce35099.preview.emergentagent.com/api"

class MemberDeletionTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
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
    
    def find_maria_id(self):
        """Find Maria's member ID"""
        try:
            response = requests.get(f"{self.base_url}/members", timeout=10)
            if response.status_code == 200:
                members = response.json()
                for member in members:
                    if member.get("name") == "Maria":
                        self.maria_id = member.get("id")
                        print(f"🔍 Found Maria with ID: {self.maria_id}")
                        return True
                print("❌ Maria not found in members list")
                return False
            else:
                print(f"❌ Failed to get members: HTTP {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error finding Maria: {str(e)}")
            return False
    
    def test_delete_existing_member(self):
        """Test DELETE /api/members/{member_id} with existing member 'Maria'"""
        if not self.maria_id:
            self.log_test("Delete Existing Member", False, "Maria's ID not available")
            return False
        
        try:
            # Get initial member count
            initial_response = requests.get(f"{self.base_url}/members", timeout=10)
            if initial_response.status_code != 200:
                self.log_test("Delete Existing Member", False, f"Failed to get initial members: HTTP {initial_response.status_code}")
                return False
            
            initial_members = initial_response.json()
            initial_count = len(initial_members)
            print(f"   Initial member count: {initial_count}")
            
            # Delete Maria
            response = requests.delete(f"{self.base_url}/members/{self.maria_id}", timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                print(f"   Delete response: {result}")
                
                if ("member_id" in result and "member_name" in result and 
                    result["member_id"] == self.maria_id and result["member_name"] == "Maria"):
                    
                    # Verify member is removed from GET /api/members
                    verify_response = requests.get(f"{self.base_url}/members", timeout=10)
                    if verify_response.status_code == 200:
                        updated_members = verify_response.json()
                        print(f"   Updated member count: {len(updated_members)}")
                        
                        if len(updated_members) == initial_count - 1:
                            # Verify Maria is not in the list
                            maria_found = any(member.get("name") == "Maria" for member in updated_members)
                            if not maria_found:
                                self.log_test("Delete Existing Member", True, f"Successfully deleted member 'Maria' (ID: {self.maria_id})")
                                return True
                            else:
                                self.log_test("Delete Existing Member", False, "Maria still found in members list after deletion")
                                return False
                        else:
                            self.log_test("Delete Existing Member", False, f"Expected {initial_count - 1} members, got {len(updated_members)}")
                            return False
                    else:
                        self.log_test("Delete Existing Member", False, f"Failed to verify member deletion: HTTP {verify_response.status_code}")
                        return False
                else:
                    self.log_test("Delete Existing Member", False, f"Invalid response format: {result}")
                    return False
            else:
                self.log_test("Delete Existing Member", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Delete Existing Member", False, f"Request error: {str(e)}")
            return False
    
    def test_delete_nonexistent_member(self):
        """Test DELETE /api/members/{member_id} with non-existent member (should return 404)"""
        try:
            # Use a fake UUID that doesn't exist
            fake_member_id = "00000000-0000-0000-0000-000000000000"
            
            response = requests.delete(f"{self.base_url}/members/{fake_member_id}", timeout=10)
            
            if response.status_code == 404:
                error_data = response.json()
                if "detail" in error_data and "não encontrado" in error_data["detail"]:
                    self.log_test("Delete Nonexistent Member", True, f"Correctly returned 404 for non-existent member: {error_data['detail']}")
                    return True
                else:
                    self.log_test("Delete Nonexistent Member", False, f"Wrong error message: {error_data}")
                    return False
            else:
                self.log_test("Delete Nonexistent Member", False, f"Expected HTTP 404, got {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Delete Nonexistent Member", False, f"Request error: {str(e)}")
            return False
    
    def test_member_deletion_logged(self):
        """Test that member deletion is logged to global log system"""
        try:
            # Get global log and look for Maria's deletion entry
            response = requests.get(f"{self.base_url}/global-log", timeout=10)
            
            if response.status_code == 200:
                log_entries = response.json()
                print(f"   Total log entries: {len(log_entries)}")
                
                # Look for Maria's deletion log entry
                maria_deletion_log = None
                for entry in log_entries:
                    if (entry.get("member_name") == "Maria" and 
                        entry.get("field_changed") == "membro" and
                        entry.get("change_type") == "delete" and
                        entry.get("old_value") == "ativo" and
                        entry.get("new_value") == "deletado"):
                        maria_deletion_log = entry
                        break
                
                if maria_deletion_log:
                    print(f"   Found deletion log: {maria_deletion_log}")
                    # Verify log entry structure
                    required_fields = ["id", "member_id", "member_name", "company_id", "company_name", "field_changed", "old_value", "new_value", "timestamp", "change_type"]
                    if all(field in maria_deletion_log for field in required_fields):
                        self.log_test("Member Deletion Logged", True, f"Maria's deletion properly logged with ID {maria_deletion_log['id']}")
                        return True
                    else:
                        missing_fields = [field for field in required_fields if field not in maria_deletion_log]
                        self.log_test("Member Deletion Logged", False, f"Log entry missing required fields: {missing_fields}")
                        return False
                else:
                    # Show recent log entries for debugging
                    print("   Recent log entries:")
                    for entry in log_entries[:5]:
                        print(f"     - {entry.get('member_name', 'N/A')} | {entry.get('field_changed', 'N/A')} | {entry.get('change_type', 'N/A')} | {entry.get('new_value', 'N/A')}")
                    self.log_test("Member Deletion Logged", False, "Maria's deletion not found in global log")
                    return False
            else:
                self.log_test("Member Deletion Logged", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Member Deletion Logged", False, f"Request error: {str(e)}")
            return False
    
    def test_dashboard_stats_after_deletion(self):
        """Test that dashboard stats are updated correctly after member deletion"""
        try:
            response = requests.get(f"{self.base_url}/dashboard/stats", timeout=10)
            
            if response.status_code == 200:
                stats = response.json()
                print(f"   Dashboard stats: {stats}")
                required_fields = ["total_members", "total_companies", "total_points", "recent_activity"]
                
                if all(field in stats for field in required_fields):
                    # Should now have 6 members (7 - 1 after Maria's deletion)
                    if stats["total_members"] == 6:
                        self.log_test("Dashboard Stats After Deletion", True, f"Dashboard correctly shows 6 total members after Maria's deletion. Stats: {stats['total_members']} members, {stats['total_companies']} companies, {stats['total_points']} points, {stats['recent_activity']} recent activities")
                        return True
                    else:
                        self.log_test("Dashboard Stats After Deletion", False, f"Expected 6 total_members, got {stats['total_members']}")
                        return False
                else:
                    self.log_test("Dashboard Stats After Deletion", False, f"Missing required fields: {required_fields}")
                    return False
            else:
                self.log_test("Dashboard Stats After Deletion", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Dashboard Stats After Deletion", False, f"Request error: {str(e)}")
            return False
    
    def run_member_deletion_tests(self):
        """Run all member deletion tests"""
        print("🗑️  Starting Member Deletion Functionality Tests")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 70)
        
        # First, find Maria's ID
        if not self.find_maria_id():
            print("❌ Cannot proceed without Maria's ID")
            return False
        
        # Test sequence for member deletion functionality
        tests = [
            ("Delete Existing Member", self.test_delete_existing_member),
            ("Delete Nonexistent Member", self.test_delete_nonexistent_member),
            ("Member Deletion Logged", self.test_member_deletion_logged),
            ("Dashboard Stats After Deletion", self.test_dashboard_stats_after_deletion),
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
        print("📊 MEMBER DELETION TEST SUMMARY")
        print("=" * 70)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("\n🎉 All member deletion tests passed!")
            print("✨ Verified functionality:")
            print("   • DELETE /api/members/{member_id} with existing member")
            print("   • 404 error for non-existent member deletion")
            print("   • Member deletion logged to global log system")
            print("   • Dashboard stats updated after deletion")
        else:
            print(f"\n⚠️  {failed} test(s) failed. Check the details above.")
        
        return failed == 0

if __name__ == "__main__":
    tester = MemberDeletionTester()
    success = tester.run_member_deletion_tests()
    exit(0 if success else 1)