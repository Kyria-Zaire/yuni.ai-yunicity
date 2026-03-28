"""Pre-deployment environment variable validation.

Exit code 0 if all required variables are set, 1 otherwise.
"""

from __future__ import annotations

import os
import sys

REQUIRED_VARS = [
    "MISTRAL_API_KEY",
    "REDIS_URL",
    "JWT_PUBLIC_KEY",
    "ALLOWED_HOSTS",
    "ANONYMIZATION_SALT",
    "YUNICITY_API_BASE_URL",
    "YUNICITY_SERVICE_TOKEN",
]

DEV_STRIPE_CHECKS = {
    "STRIPE_SECRET_KEY": "sk_test_",
    "STRIPE_WEBHOOK_SECRET": "whsec_",
}


def main() -> int:
    env = os.environ.get("YUNI_ENV", "dev")
    print(f"Pre-deploy check for YUNI_ENV={env}")

    missing: list[str] = []
    for var in REQUIRED_VARS:
        value = os.environ.get(var, "")
        if not value:
            missing.append(var)

    if env == "dev":
        for var, prefix in DEV_STRIPE_CHECKS.items():
            value = os.environ.get(var, "")
            if value and not value.startswith(prefix):
                print(f"  WARNING: {var} does not start with '{prefix}' in dev")

    if missing:
        print(f"FAILED — {len(missing)} required variable(s) missing:")
        for var in missing:
            print(f"  - {var}")
        return 1

    print(f"OK — all {len(REQUIRED_VARS)} required variables are set")
    return 0


if __name__ == "__main__":
    sys.exit(main())
