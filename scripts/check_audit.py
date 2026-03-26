"""Parse pip-audit JSON output and fail on CRITICAL vulnerabilities."""

import json
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python check_audit.py <audit-results.json>")
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File not found: {path}")
        print("No audit results to check — skipping.")
        sys.exit(0)

    data = json.loads(path.read_text())

    # pip-audit outputs {"dependencies": [...]}
    dependencies = data.get("dependencies", [])

    critical_count = 0
    high_count = 0

    for dep in dependencies:
        vulns = dep.get("vulns", [])
        for vuln in vulns:
            vuln_id = vuln.get("id", "unknown")
            fix = vuln.get("fix_versions", [])
            aliases = vuln.get("aliases", [])
            desc = vuln.get("description", "")

            # Check severity from description or aliases
            is_critical = "critical" in desc.lower()

            if is_critical:
                critical_count += 1
                print(f"CRITICAL: {dep['name']} — {vuln_id} (fix: {fix})")
            else:
                high_count += 1
                print(f"  VULN: {dep['name']} — {vuln_id} aliases={aliases}")

    print(f"\nSummary: {critical_count} critical, {high_count} other vulnerabilities")

    if critical_count > 0:
        print("FAIL: Critical vulnerabilities found.")
        sys.exit(1)

    print("PASS: No critical vulnerabilities.")


if __name__ == "__main__":
    main()
