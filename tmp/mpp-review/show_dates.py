import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
data = json.loads(path.read_text(encoding="utf-8-sig"))

for task in data["Tasks"]:
    print(
        f"{task['Id']:>2} {task['OutlineNumber']:<4} "
        f"{task['Name'][:48]:<48} {task['Start']} -> {task['Finish']} "
        f"pred={task.get('Predecessors') or '-'} critical={task.get('Critical')}"
    )
