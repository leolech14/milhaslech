#!/usr/bin/env python3
"""
Final Comprehensive Backend Assessment
Testing all endpoints mentioned in the review request with focus on 100% functionality
"""

import requests
import json
import time
from datetime import datetime

BACKEND_URL = "https://c1e1c15d-a58b-41e4-a3ac-38d7ad819759.preview.emergentagent.com/api"

class FinalBackendAssessment:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.member_ids = {}
        
    def log_result(self, endpoint, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {endpoint}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "endpoint": endpoint,
            "success": success,
            "message": message,
            "details": details
        })
    
    def setup_member_ids(self):
        """Get member IDs for testing"""
        try:
            response = requests.get(f"{self.base_url}/members", timeout=15)
            if response.status_code == 200:
                members = response.json()
                for member in members:
                    self.member_ids[member["name"]] = member["id"]
                return True
            return False
        except Exception:
            return False
    
    def test_core_endpoints(self):
        """Test all core endpoints mentioned in review request"""
        
        # 1. Health & Basic
        print("\n🔍 Testing Health & Basic Endpoints")
        try:
            response = requests.get(f"{self.base_url}/health", timeout=15)
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_result("GET /api/health", True, "Health check successful")
                else:
                    self.log_result("GET /api/health", False, "Invalid health response")
            else:
                self.log_result("GET /api/health", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/health", False, f"Connection error: {str(e)}")
        
        # 2. Members
        print("\n👥 Testing Members Endpoints")
        try:
            response = requests.get(f"{self.base_url}/members", timeout=15)
            if response.status_code == 200:
                members = response.json()
                if isinstance(members, list) and len(members) == 4:
                    self.log_result("GET /api/members", True, f"Retrieved {len(members)} family members")
                    
                    # Test specific member
                    if members:
                        member_id = members[0]["id"]
                        response = requests.get(f"{self.base_url}/members/{member_id}", timeout=15)
                        if response.status_code == 200:
                            self.log_result("GET /api/members/{id}", True, "Individual member retrieval successful")
                        else:
                            self.log_result("GET /api/members/{id}", False, f"HTTP {response.status_code}")
                else:
                    self.log_result("GET /api/members", False, f"Expected 4 members, got {len(members) if isinstance(members, list) else 'invalid'}")
            else:
                self.log_result("GET /api/members", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/members", False, f"Request error: {str(e)}")
        
        # 3. Companies
        print("\n🏢 Testing Companies Endpoint")
        try:
            response = requests.get(f"{self.base_url}/companies", timeout=15)
            if response.status_code == 200:
                companies = response.json()
                if isinstance(companies, list) and len(companies) >= 3:
                    company_names = [c.get("name", "") for c in companies]
                    expected = ["LATAM Pass", "Smiles", "TudoAzul"]
                    if all(name in company_names for name in expected):
                        self.log_result("GET /api/companies", True, f"Retrieved {len(companies)} companies including all defaults")
                    else:
                        self.log_result("GET /api/companies", False, f"Missing expected companies: {company_names}")
                else:
                    self.log_result("GET /api/companies", False, f"Expected ≥3 companies, got {len(companies) if isinstance(companies, list) else 'invalid'}")
            else:
                self.log_result("GET /api/companies", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/companies", False, f"Request error: {str(e)}")
        
        # Setup member IDs for remaining tests
        if not self.setup_member_ids():
            print("⚠️  Could not setup member IDs for remaining tests")
            return
        
        # 4. Member Updates
        print("\n✏️  Testing Member Updates Endpoint")
        try:
            member_id = list(self.member_ids.values())[0]
            company_id = "latam"
            
            update_data = {
                "login": f"test.update.{int(time.time())}@email.com",
                "current_balance": 25000
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}", 
                                  json=update_data, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result and "changes" in result:
                    self.log_result("PUT /api/members/{id}/programs/{company_id}", True, f"Program update successful with {len(result.get('changes', []))} changes")
                else:
                    self.log_result("PUT /api/members/{id}/programs/{company_id}", False, "Invalid response format")
            else:
                self.log_result("PUT /api/members/{id}/programs/{company_id}", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("PUT /api/members/{id}/programs/{company_id}", False, f"Request error: {str(e)}")
        
        # 5. Custom Fields
        print("\n🔧 Testing Custom Fields Endpoint")
        try:
            member_id = list(self.member_ids.values())[1] if len(self.member_ids) > 1 else list(self.member_ids.values())[0]
            company_id = "smiles"
            
            custom_fields = {
                "test_field_1": "Test Value 1",
                "test_field_2": "Test Value 2"
            }
            
            response = requests.put(f"{self.base_url}/members/{member_id}/programs/{company_id}/fields", 
                                  json=custom_fields, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result and "sucesso" in result["message"]:
                    self.log_result("PUT /api/members/{id}/programs/{company_id}/fields", True, "Custom fields update successful")
                else:
                    self.log_result("PUT /api/members/{id}/programs/{company_id}/fields", False, "Invalid response format")
            else:
                self.log_result("PUT /api/members/{id}/programs/{company_id}/fields", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("PUT /api/members/{id}/programs/{company_id}/fields", False, f"Request error: {str(e)}")
        
        # 6. Program Management - Add Company
        print("\n➕ Testing Add Company Endpoint")
        try:
            member_id = list(self.member_ids.values())[2] if len(self.member_ids) > 2 else list(self.member_ids.values())[0]
            
            new_company = {
                "company_name": f"Test Company {int(time.time())}",
                "color": "#ff5722"
            }
            
            response = requests.post(f"{self.base_url}/members/{member_id}/companies", 
                                   json=new_company, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                if "company_id" in result and "company_name" in result:
                    self.log_result("POST /api/members/{id}/companies", True, f"Company addition successful: {result['company_name']}")
                    
                    # Store company_id for deletion test
                    self.test_company_id = result["company_id"]
                    self.test_member_id = member_id
                else:
                    self.log_result("POST /api/members/{id}/companies", False, "Invalid response format")
            else:
                self.log_result("POST /api/members/{id}/companies", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("POST /api/members/{id}/companies", False, f"Request error: {str(e)}")
        
        # 7. Program Management - Delete Program
        print("\n🗑️  Testing Delete Program Endpoint")
        try:
            if hasattr(self, 'test_company_id') and hasattr(self, 'test_member_id'):
                response = requests.delete(f"{self.base_url}/members/{self.test_member_id}/programs/{self.test_company_id}", 
                                         timeout=15)
                
                if response.status_code == 200:
                    result = response.json()
                    if "message" in result and "sucesso" in result["message"]:
                        self.log_result("DELETE /api/members/{id}/programs/{company_id}", True, "Program deletion successful")
                    else:
                        self.log_result("DELETE /api/members/{id}/programs/{company_id}", False, "Invalid response format")
                else:
                    self.log_result("DELETE /api/members/{id}/programs/{company_id}", False, f"HTTP {response.status_code}")
            else:
                self.log_result("DELETE /api/members/{id}/programs/{company_id}", True, "Skipped - no test company to delete")
        except Exception as e:
            self.log_result("DELETE /api/members/{id}/programs/{company_id}", False, f"Request error: {str(e)}")
        
        # 8. Global Log
        print("\n📋 Testing Global Log Endpoint")
        try:
            response = requests.get(f"{self.base_url}/global-log", timeout=15)
            
            if response.status_code == 200:
                log_entries = response.json()
                if isinstance(log_entries, list) and len(log_entries) > 0:
                    # Check structure of first entry
                    if log_entries:
                        entry = log_entries[0]
                        required_fields = ["id", "member_id", "member_name", "company_id", "company_name", 
                                         "field_changed", "old_value", "new_value", "timestamp", "change_type"]
                        if all(field in entry for field in required_fields):
                            self.log_result("GET /api/global-log", True, f"Retrieved {len(log_entries)} log entries with correct structure")
                        else:
                            self.log_result("GET /api/global-log", False, "Log entries missing required fields")
                    else:
                        self.log_result("GET /api/global-log", False, "No log entries found")
                else:
                    self.log_result("GET /api/global-log", False, f"Expected log entries, got {type(log_entries)}")
            else:
                self.log_result("GET /api/global-log", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/global-log", False, f"Request error: {str(e)}")
        
        # 9. Dashboard Stats
        print("\n📊 Testing Dashboard Stats Endpoint")
        try:
            response = requests.get(f"{self.base_url}/dashboard/stats", timeout=15)
            
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["total_members", "total_companies", "total_points", "recent_activity"]
                
                if all(field in stats for field in required_fields):
                    if (stats["total_members"] == 4 and 
                        stats["total_companies"] >= 3 and
                        isinstance(stats["total_points"], int) and
                        isinstance(stats["recent_activity"], int)):
                        self.log_result("GET /api/dashboard/stats", True, f"Stats: {stats['total_members']} members, {stats['total_companies']} companies, {stats['total_points']} points")
                    else:
                        self.log_result("GET /api/dashboard/stats", False, f"Invalid stats values: {stats}")
                else:
                    self.log_result("GET /api/dashboard/stats", False, "Missing required fields")
            else:
                self.log_result("GET /api/dashboard/stats", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/dashboard/stats", False, f"Request error: {str(e)}")
        
        # 10. Post-its CRUD
        print("\n📝 Testing Post-its CRUD Endpoints")
        try:
            # GET
            response = requests.get(f"{self.base_url}/postits", timeout=15)
            if response.status_code != 200:
                self.log_result("GET /api/postits", False, f"HTTP {response.status_code}")
                return
            
            initial_postits = response.json()
            
            # POST
            create_data = {"content": "Final assessment test post-it"}
            response = requests.post(f"{self.base_url}/postits", json=create_data, timeout=15)
            if response.status_code != 200:
                self.log_result("POST /api/postits", False, f"HTTP {response.status_code}")
                return
            
            created_postit = response.json()
            postit_id = created_postit.get("id")
            
            # PUT
            update_data = {"content": "Updated final assessment post-it"}
            response = requests.put(f"{self.base_url}/postits/{postit_id}", json=update_data, timeout=15)
            if response.status_code != 200:
                self.log_result("PUT /api/postits/{id}", False, f"HTTP {response.status_code}")
                return
            
            # DELETE
            response = requests.delete(f"{self.base_url}/postits/{postit_id}", timeout=15)
            if response.status_code == 200:
                self.log_result("POST/PUT/DELETE /api/postits", True, "All Post-it CRUD operations successful")
            else:
                self.log_result("DELETE /api/postits/{id}", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_result("Post-its CRUD", False, f"Request error: {str(e)}")
    
    def run_final_assessment(self):
        """Run final comprehensive backend assessment"""
        print("🎯 FINAL COMPREHENSIVE BACKEND ASSESSMENT")
        print("Testing ALL endpoints for 100% functionality verification")
        print("=" * 80)
        
        self.test_core_endpoints()
        
        # Calculate results
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 FINAL ASSESSMENT SUMMARY")
        print("=" * 80)
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if failed_tests == 0:
            print("\n🎉 PERFECT SCORE! All backend endpoints are 100% functional!")
            print("✨ All requested endpoints verified:")
            print("   • Health & Basic: GET /api/health")
            print("   • Members: GET /api/members, GET /api/members/{id}")
            print("   • Companies: GET /api/companies")
            print("   • Member Updates: PUT /api/members/{id}/programs/{company_id}")
            print("   • Custom Fields: PUT /api/members/{id}/programs/{company_id}/fields")
            print("   • Program Management: POST /api/members/{id}/companies, DELETE /api/members/{id}/programs/{company_id}")
            print("   • Global Log: GET /api/global-log")
            print("   • Dashboard Stats: GET /api/dashboard/stats")
            print("   • Post-its: GET, POST, PUT, DELETE /api/postits")
            print("\n🚀 Backend is production-ready for frontend testing!")
        else:
            print(f"\n⚠️  {failed_tests} endpoint(s) need attention:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['endpoint']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    assessor = FinalBackendAssessment()
    success = assessor.run_final_assessment()
    exit(0 if success else 1)