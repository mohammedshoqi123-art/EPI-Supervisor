import json, subprocess, sys

TOKEN = sys.argv[1]
REPO = "mohammedshoqi123-art/EPI-Supervisor"

# Get active runs
result = subprocess.run([
    'curl', '-s',
    f'https://api.github.com/repos/{REPO}/actions/runs?per_page=10&status=queued,pending,in_progress',
    '-H', f'Authorization: token {TOKEN}',
    '-H', 'Accept: application/vnd.github.v3+json'
], capture_output=True, text=True)

data = json.loads(result.stdout)
runs = data.get('workflow_runs', [])
print(f'Found {len(runs)} active runs')

for r in runs:
    run_id = r['id']
    name = r['name']
    status = r['status']
    print(f'  Cancelling: {name} ({run_id}) - {status}')
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        f'https://api.github.com/repos/{REPO}/actions/runs/{run_id}/cancel',
        '-H', f'Authorization: token {TOKEN}',
        '-H', 'Accept: application/vnd.github.v3+json'
    ], capture_output=True, text=True)
    print(f'    Done')
