import subprocess
import time
import requests
import json
import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def run_tests():
    print("==================================================================")
    print("  SIF-Sentinel End-to-End Test Suite")
    print("==================================================================")

    # 1. Start ML Service & Backend in background if not already running
    ml_url = "http://127.0.0.1:8001"
    backend_url = "http://127.0.0.1:5000"

    print("\n[Test 1] Checking ML Service Classification & Explainability...")
    ml_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8001"],
        cwd=os.path.join(BASE_DIR, "ml_service"),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    try:
        for _ in range(15):
            try:
                res = requests.get(f"{ml_url}/health", timeout=1)
                if res.status_code == 200:
                    break
            except:
                time.sleep(0.5)
        else:
            raise RuntimeError("ML Service failed to start on port 8001")
        print("  [PASS] ML Service Health: OK")

        # Test Disguised High-Risk Report (Work at Height)
        scaffold_payload = {
            "text": "Found scaffolding without a guardrail near tank 4; contractor was standing on it while no harness was worn."
        }
        res = requests.post(f"{ml_url}/classify", json=scaffold_payload, timeout=3)
        assert res.status_code == 200
        data = res.json()
        assert data["risk_score"] >= 70, f"Expected Risk >= 70, got {data['risk_score']}"
        assert data["risk_band"] == "High"
        assert data["hazard_primary"] == "Work at Height"
        assert len(data["explainability_terms"]) > 0
        print(f"  [PASS] Disguised High Risk Test: Scored {data['risk_score']}/100 (Band: {data['risk_band']}), Hazard: {data['hazard_primary']}, Terms: {data['explainability_terms']}")

        # Test Edge Case (< 10 words -> Needs Manual Review per FR-2.6 & EC-1)
        short_payload = {"text": "Water spill on corridor floor."}
        res = requests.post(f"{ml_url}/classify", json=short_payload, timeout=3)
        assert res.status_code == 200
        data = res.json()
        assert data["is_manual_review"] is True
        assert data["risk_band"] == "Needs Manual Review"
        print("  [PASS] Short Description Guard Test (< 10 words -> Needs Manual Review): OK")

        # 2. Start Express Backend
        print("\n[Test 2] Starting Express Backend & Testing Auth & Business Rules...")
        backend_proc = subprocess.Popen(
            ["node", "server.js"],
            cwd=os.path.join(BASE_DIR, "backend"),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            shell=True
        )

        for _ in range(15):
            try:
                res = requests.get(f"{backend_url}/health", timeout=1)
                if res.status_code == 200:
                    break
            except:
                time.sleep(0.5)
        else:
            raise RuntimeError("Backend API failed to start on port 5000")
        print("  [PASS] Backend API Health: OK")

        # Test Seed Endpoint
        seed_res = requests.post(f"{backend_url}/api/seed", timeout=10)
        assert seed_res.status_code == 200
        print(f"  [PASS] Seed Sample Reports: {seed_res.json()['message']}")

        # Test Login as HSE Officer
        login_res = requests.post(f"{backend_url}/api/auth/login", json={
            "username": "hse@oilindia.in",
            "password": "oil123"
        })
        assert login_res.status_code == 200
        hse_token = login_res.json()["token"]
        hse_headers = {"Authorization": f"Bearer {hse_token}"}
        print("  [PASS] HSE Officer Login & JWT Issuance: OK")

        # Test Login as Reporter
        rep_login = requests.post(f"{backend_url}/api/auth/login", json={
            "username": "reporter@oilindia.in",
            "password": "oil123"
        })
        assert rep_login.status_code == 200
        rep_token = rep_login.json()["token"]
        rep_headers = {"Authorization": f"Bearer {rep_token}"}
        print("  [PASS] Field Reporter Login & JWT Issuance: OK")

        # Test Reporter submits new report
        new_report_payload = {
            "installation": "Duliajan",
            "report_type": "Unsafe Act",
            "observation_datetime": "2026-09-28T12:00:00.000Z",
            "description": "Electrician worked on 415V MCC feeder without applying lockout tagout padlock as isolation switch was stiff.",
            "reporter_severity": "Low"
        }
        create_res = requests.post(f"{backend_url}/api/reports", json=new_report_payload, headers=rep_headers)
        assert create_res.status_code == 201
        created_report = create_res.json()["report"]
        report_id = created_report["report_id"]
        assert created_report["risk_score"] >= 70
        assert created_report["hazard_category_primary"] == "LOTO Bypass"
        print(f"  [PASS] Report Creation & Auto-Classification: ID {created_report['display_id']}, SIF Risk: {created_report['risk_score']}/100, Hazard: {created_report['hazard_category_primary']}")

        # Test BR-3 Status Transition State Machine
        # Rule: Submitted -> Reviewed -> Escalated / Closed
        # Attempting to Close directly from Submitted must be REJECTED with HTTP 400
        close_fail_res = requests.patch(f"{backend_url}/api/reports/{report_id}/status", json={"status": "Closed"}, headers=hse_headers)
        assert close_fail_res.status_code == 400, "BR-3 Violation not caught! Closing from Submitted should fail."
        print(f"  [PASS] BR-3 Enforcement (Submitted -> Closed directly rejected): {close_fail_res.json()['error']}")

        # Mark Reviewed (Valid)
        reviewed_res = requests.patch(f"{backend_url}/api/reports/{report_id}/status", json={"status": "Reviewed"}, headers=hse_headers)
        assert reviewed_res.status_code == 200
        assert reviewed_res.json()["report"]["status"] == "Reviewed"
        print("  [PASS] Valid Status Step (Submitted -> Reviewed): OK")

        # Escalate (Valid from Reviewed)
        escalate_res = requests.patch(f"{backend_url}/api/reports/{report_id}/status", json={"status": "Escalated"}, headers=hse_headers)
        assert escalate_res.status_code == 200
        assert escalate_res.json()["report"]["status"] == "Escalated"
        print("  [PASS] Valid Status Step (Reviewed -> Escalated): OK")

        # Close from Escalated (Valid)
        close_res = requests.patch(f"{backend_url}/api/reports/{report_id}/status", json={"status": "Closed"}, headers=hse_headers)
        assert close_res.status_code == 200
        assert close_res.json()["report"]["status"] == "Closed"
        print("  [PASS] Valid Status Step (Escalated -> Closed): OK")

        # Check Audit Log (FR-5.1)
        audit_res = requests.get(f"{backend_url}/api/audit?report_id={report_id}", headers=hse_headers)
        assert audit_res.status_code == 200
        logs = audit_res.json()["logs"]
        assert len(logs) >= 4 # Created, Classified, Reviewed, Escalated, Closed
        print(f"  [PASS] Append-Only Audit Trail (FR-5.1 & SEC-5): Recorded {len(logs)} state changes")

        # Check Stats Endpoint
        stats_res = requests.get(f"{backend_url}/api/stats", headers=hse_headers)
        assert stats_res.status_code == 200
        stats = stats_res.json()
        print(f"  [PASS] KPI Stats: Total={stats['total']}, High SIF={stats['highRisk']}, Disguised={stats['disguisedHighRisk']}")

        print("\n==================================================================")
        print("  ALL ACCEPTANCE CRITERIA & INTEGRATION TESTS PASSED (100%)!")
        print("==================================================================")

    finally:
        try:
            ml_proc.terminate()
        except:
            pass
        try:
            backend_proc.terminate()
        except:
            pass

if __name__ == "__main__":
    run_tests()
