import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"C:\Users\vlogs\NutriOne-ERP\tmp\mpp-review\Proyecto_NutriOne_export.json")
data = json.loads(path.read_text(encoding="utf-8-sig"))

tasks = data["Tasks"]
resources = data["Resources"]
assignments = data["Assignments"]

def truthy(value):
    return value is True or str(value).lower() == "true"

def minutes_to_days(value):
    try:
        return round(float(value) / 480, 2)
    except Exception:
        return None

real_tasks = [t for t in tasks if not truthy(t.get("Summary"))]
summary_tasks = [t for t in tasks if truthy(t.get("Summary"))]
milestones = [t for t in real_tasks if truthy(t.get("Milestone"))]
critical = [t for t in real_tasks if truthy(t.get("Critical"))]

no_resources = [
    t for t in real_tasks
    if not (t.get("ResourceNames") or "").strip() and not truthy(t.get("Milestone"))
]
no_links = [
    t for t in real_tasks
    if not (t.get("Predecessors") or "").strip()
    and not (t.get("Successors") or "").strip()
    and not truthy(t.get("Milestone"))
]

type_labels = {
    0: "Trabajo",
    1: "Material",
    2: "Costo",
}
resource_type_counts = Counter(type_labels.get(r.get("Type"), f"Tipo {r.get('Type')}") for r in resources)

assignments_by_task = defaultdict(list)
for assignment in assignments:
    assignments_by_task[assignment.get("TaskId")].append(assignment)

print("PROJECT")
for key, value in data["Project"].items():
    print(f"{key}: {value}")

print("\nCOUNTS")
print(f"tasks_total: {len(tasks)}")
print(f"real_tasks: {len(real_tasks)}")
print(f"summary_tasks: {len(summary_tasks)}")
print(f"milestones: {len(milestones)}")
print(f"resources: {len(resources)}")
print(f"assignments: {len(assignments)}")
print(f"critical_real_tasks: {len(critical)}")
print(f"tasks_without_resources: {len(no_resources)}")
print(f"tasks_without_links: {len(no_links)}")
print("resource_type_counts:", dict(resource_type_counts))

print("\nRESOURCES")
for r in resources:
    print(
        f"{r.get('Id'):>2} | {type_labels.get(r.get('Type'), r.get('Type')):<8} | "
        f"{r.get('Name')} | rate={r.get('StandardRate')} | cost/use={r.get('CostPerUse')} "
        f"| material={r.get('MaterialLabel')} | cost={r.get('Cost')}"
    )

print("\nTASKS")
for t in tasks:
    kind = "SUM" if truthy(t.get("Summary")) else ("MIL" if truthy(t.get("Milestone")) else "TSK")
    days = minutes_to_days(t.get("DurationMinutes"))
    print(
        f"{t.get('Id'):>2} | {kind} | {t.get('OutlineNumber'):<6} | "
        f"{t.get('Name')} | dur={t.get('DurationText') or days} | "
        f"pred={t.get('Predecessors') or '-'} | res={t.get('ResourceNames') or '-'} | "
        f"cost={t.get('Cost')} | critical={t.get('Critical')}"
    )

print("\nTASKS_WITHOUT_RESOURCES")
for t in no_resources:
    print(f"{t.get('Id')} | {t.get('OutlineNumber')} | {t.get('Name')}")

print("\nTASKS_WITHOUT_LINKS")
for t in no_links:
    print(f"{t.get('Id')} | {t.get('OutlineNumber')} | {t.get('Name')}")

print("\nCRITICAL_PATH")
for t in critical:
    print(f"{t.get('Id')} | {t.get('OutlineNumber')} | {t.get('Name')} | pred={t.get('Predecessors') or '-'}")
