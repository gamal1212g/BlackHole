import os

py_files = [
    'agent/check_blocklist.py',
    'agent/send_normal_traffic.py',
    'agent/simulate_attack.py',
    'backend/routes/auth_routes.py',
    'backend/services/analytics_service.py',
    'backend/auth.py',
    'backend/database.py',
    'backend/websocket_manager.py'
]

js_files = [
    'frontend/src/components/Layout.jsx',
    'frontend/src/pages/AgentFleetPage.jsx',
    'frontend/src/pages/AlertsPage.jsx',
    'frontend/src/pages/AuthPage.jsx',
    'frontend/src/pages/CheckoutPage.jsx',
    'frontend/src/pages/DocsPage.jsx',
    'frontend/src/pages/FirewallRulesPage.jsx',
    'frontend/src/pages/LandingPage.jsx',
    'frontend/src/pages/PricingPage.jsx',
    'frontend/src/pages/RegisterPage.jsx',
    'frontend/src/pages/ReportsPage.jsx',
    'frontend/src/pages/SettingsPage.jsx',
    'frontend/src/store/useSecurityStore.js',
    'frontend/src/App.jsx',
    'frontend/src/main.jsx'
]

all_files = py_files + js_files
out = []
for f in all_files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        ext = f.split('.')[-1]
        lang = 'python' if ext == 'py' else ('javascript' if ext in ['js', 'jsx'] else '')
        out.append(f"### {f}\n`{lang}\n{content}\n`\n")

with open('bundle.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
