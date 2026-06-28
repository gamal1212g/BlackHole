import os
import ast
import re

def strip_comments_js(code):
    state = 'NORMAL'
    result = []
    i = 0
    while i < len(code):
        if state == 'NORMAL':
            if code[i:i+2] == '//':
                state = 'LINE_COMMENT'
                i += 2
            elif code[i:i+2] == '/*':
                state = 'BLOCK_COMMENT'
                i += 2
            elif code[i] == '':
                state = 'STRING_BQUOTE'
                result.append(code[i])
                i += 1
            elif code[i] == '"':
                state = 'STRING_DQUOTE'
                result.append(code[i])
                i += 1
            elif code[i] == "'":
                state = 'STRING_SQUOTE'
                result.append(code[i])
                i += 1
            else:
                result.append(code[i])
                i += 1
        elif state == 'LINE_COMMENT':
            if code[i] == '\n':
                state = 'NORMAL'
                result.append('\n')
            i += 1
        elif state == 'BLOCK_COMMENT':
            if code[i:i+2] == '*/':
                state = 'NORMAL'
                i += 2
            else:
                i += 1
        elif state == 'STRING_DQUOTE':
            if code[i] == '\\':
                result.append(code[i])
                if i+1 < len(code):
                    result.append(code[i+1])
                i += 2
            elif code[i] == '"':
                state = 'NORMAL'
                result.append(code[i])
                i += 1
            else:
                result.append(code[i])
                i += 1
        elif state == 'STRING_SQUOTE':
            if code[i] == '\\':
                result.append(code[i])
                if i+1 < len(code):
                    result.append(code[i+1])
                i += 2
            elif code[i] == "'":
                state = 'NORMAL'
                result.append(code[i])
                i += 1
            else:
                result.append(code[i])
                i += 1
        elif state == 'STRING_BQUOTE':
            if code[i] == '\\':
                result.append(code[i])
                if i+1 < len(code):
                    result.append(code[i+1])
                i += 2
            elif code[i] == '':
                state = 'NORMAL'
                result.append(code[i])
                i += 1
            else:
                result.append(code[i])
                i += 1

    clean_code = "".join(result)
    clean_code = re.sub(r'\{\s*\}', '', clean_code)
    lines = clean_code.split('\n')
    clean_lines = [line for line in lines if line.strip() != ""]
    return "\n".join(clean_lines)

def strip_python(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        src = f.read()
    tree = ast.parse(src)
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.ClassDef, ast.AsyncFunctionDef, ast.Module)):
            if ast.get_docstring(node):
                node.body.pop(0)
    clean = ast.unparse(tree)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(clean)
    return clean

def strip_js_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        src = f.read()
    clean = strip_comments_js(src)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(clean)
    return clean

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

for pf in py_files:
    if os.path.exists(pf):
        strip_python(pf)

for jf in js_files:
    if os.path.exists(jf):
        strip_js_file(jf)
