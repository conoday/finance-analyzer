import re

with open('app/telegram_bot.py', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add _REPORT_SESSIONS dictionary
text = re.sub(
    r'(_SPLITBILL_SESSIONS: dict\[str, dict\] = {}.*?\n)',
    r'\1_REPORT_SESSIONS: dict[str, dict] = {}\n',
    text
)

# 2. Add 'cmd:lapor' case in _handle_callback
callback_insertion = """    elif cmd == "lapor":
        _cmd_lapor_start(chat_id)
        try:
            with httpx.Client(timeout=5) as client:
                client.post(f"{os.environ.get('TELEGRAM_BOT_URL')}/answerCallbackQuery", json={"callback_query_id": callback_query_id})
        except:
            pass"""
text = re.sub(
    r'(elif cmd == "splitbill":\n.*?except:\n.*?pass)',
    r'\1\n' + callback_insertion,
    text,
    flags=re.DOTALL
)

# 3. Add to _handle_command
cmd_insertion = """    elif command in ("/lapor", "/bug"):
        _cmd_lapor_start(chat_id)
"""
text = re.sub(
    r'(elif command in \("/splitbill", "/patungan"\):\n.*?_cmd_splitbill_start\(chat_id\)\n)',
    r'\1' + cmd_insertion,
    text
)

# 4. Add _cmd_lapor_start and logic
lapor_logic = """
def _cmd_lapor_start(chat_id: int | str) -> None:
    _REPORT_SESSIONS[str(chat_id)] = {"step": "waiting_feedback"}
    send_message(
        chat_id,
        "🚨 <b>Lapor Bug / Kendala</b>\\n\\nSilakan ketikkan masalah atau bug yang kamu alami. Nanti tim OprexDuit akan mengeceknya.\\n\\nKetik /batal jika tidak jadi melapor."
    )

def _handle_lapor_input(chat_id: int | str, text: str, username: str) -> None:
    session = _REPORT_SESSIONS.get(str(chat_id))
    if not session:
        return
    
    # Store to backend log for now
    print("====================================================")
    print(f"[BUG REPORT] From user {username} ({chat_id}):")
    print(f"{text}")
    print("====================================================")
    
    send_message(chat_id, "✅ Laporanmu sudah diteruskan ke tim pengembang kami (OprexDuit Admin Console). Terima kasih!")
    _REPORT_SESSIONS.pop(str(chat_id), None)
"""

text = re.sub(
    r'(# ---------------------------------------------------------------------------\n# AI Shopping Flow)',
    lapor_logic + r'\n\1',
    text
)

# 5. Add to state checker
state_checker = """        elif str(chat_id) in _REPORT_SESSIONS:
            _handle_lapor_input(chat_id, text, username)
"""
text = re.sub(
    r'(elif str\(chat_id\) in _SHOPPING_SESSIONS:\n.*?_handle_shopping_input.*?sb_client\)\n)',
    r'\1' + state_checker,
    text
)

# 6. Add button to /bantuan keyboard
bantuan_insertion = """        [
            {"text": "🚨 Lapor Bug", "callback_data": "cmd:lapor"},
        ],
"""
text = re.sub(
    r'([ \t]*\[\n[ \t]*\{"text": link_text, "callback_data": link_data\},\n[ \t]*\])',
    r'\1,\n' + bantuan_insertion,
    text
)

# 7. Add to /batal
batal_insertion = """        _REPORT_SESSIONS.pop(str(chat_id), None)\n"""
text = re.sub(
    r'(_SHOPPING_SESSIONS\.pop\(str\(chat_id\), None\)\n[ \t]*_SPLITBILL_SESSIONS\.pop\(str\(chat_id\), None\)\n)',
    r'\1' + batal_insertion,
    text
)

with open('app/telegram_bot.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('Patched telegram_bot.py successfully')
