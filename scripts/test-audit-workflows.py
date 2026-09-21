#!/usr/bin/env python3
"""Validate workflow structure and shell syntax before workflows reach main."""
from pathlib import Path
import subprocess
import yaml

for path in Path(".github/workflows").glob("*.yml"):
    workflow = yaml.safe_load(path.read_text())
    assert isinstance(workflow.get("jobs"), dict), path
    for job in workflow["jobs"].values():
        for step in job.get("steps", []):
            if "run" in step:
                subprocess.run(["bash", "-n"], input=step["run"], text=True, check=True)
for name in ["audit-official-federal-sources.yml", "sync-mdic-defesa-comercial.yml"]:
    workflow = yaml.safe_load((Path(".github/workflows") / name).read_text())
    assert workflow["permissions"]["contents"] == "read"
    steps = next(iter(workflow["jobs"].values()))["steps"]
    uploads = [s for s in steps if s.get("uses", "").startswith("actions/upload-artifact@")]
    assert len(uploads) == 1, name
print("Workflow YAML and embedded shell syntax: passed; audit publication permissions remain read-only.")
