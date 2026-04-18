import re

with open('app/ai_service.py', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Replace _get_glm_keys() and _get_glm_keys_with_id() with a generic function

generic_getter = """
def _get_provider_keys_with_id(provider_name: str) -> list[dict]:
    \"\"\"
    Kembalikan keys dengan ID-nya (untuk keperluan marking rate-limit).
    Returns list of {"id": str|None, "api_key": str}.
    ID = None jika key berasal dari env var (tidak bisa di-track di DB).
    \"\"\"
    db_keys = _get_keys_from_db(provider_name)
    if db_keys:
        return db_keys

    # Fallback env vars
    cfg = _PROVIDERS.get(provider_name)
    if not cfg:
        return []
    
    return [
        {"id": None, "api_key": v}
        for env in cfg["key_envs"]
        if (v := os.environ.get(env, "").strip())
    ]
"""

# We'll use regex to remove the specific glm_keys functions
text = re.sub(
    r'def _get_glm_keys\(\) -> list\[str\]:.*?def _get_client',
    generic_getter + '\n\ndef _get_client',
    text,
    flags=re.DOTALL
)

# 2. Update _get_client so it doesn't just error out if `api_key` isn't found using the OLD env var check, 
# although we can actually keep it because `_call_with_fallback` passes api_key.
# Let's fix _call_with_fallback

fallback = """
def _call_with_fallback(fn, **kwargs):
    \"\"\"
    Jalankan fn(client, model, **kwargs) dengan fallback key.

    Jika key pertama rate-limit / quota habis (terutama GLM/Deepseek/Gemini):
      - Tandai key tersebut sebagai rate-limited di Supabase DB
      - Coba key berikutnya secara berurutan
    \"\"\"
    provider_name = os.environ.get("AI_PROVIDER", "glm").lower()
    
    # Provider yang tidak dikonfigurasi di _PROVIDERS akan langsung throw error
    if provider_name not in _PROVIDERS:
        client, model = _get_client()
        return fn(client, model, **kwargs)

    key_entries = _get_provider_keys_with_id(provider_name)
    if not key_entries:
        envs = ", ".join(_PROVIDERS[provider_name].get("key_envs", []))
        raise ValueError(
            f"Belum ada API key yang di-set untuk provider {provider_name.upper()}. "
            f"Tambahkan key via Admin Console (/admin/api-keys) atau "
            f"set env vars di Render: {envs}"
        )

    last_err: Exception = RuntimeError("No keys available")
    for entry in key_entries:
        api_key = entry["api_key"]
        key_id  = entry.get("id")  # None jika dari env var
        try:
            client, model = _get_client(api_key=api_key)
            return fn(client, model, **kwargs)
        except Exception as e:
            err_str = str(e).lower()
            if any(q in err_str for q in _QUOTA_ERRORS):
                # Tandai rate-limited di DB
                if key_id:
                    _mark_key_rate_limited(key_id, provider_name)
                else:
                    print(f"[ai_service] Key dari env var rate-limited (tidak bisa di-track otomatis).")
                last_err = e
                continue  # coba key berikutnya
            raise  # error sistem/jaringan lainnya langsung raise

    raise last_err  # semua key habis
"""

text = re.sub(
    r'def _call_with_fallback\(fn, \*\*kwargs\):.*?raise last_err  # semua key habis',
    fallback.strip(),
    text,
    flags=re.DOTALL
)

# 3. Add graceful error message for UI on get_ai_chat_response and get_ai_insight when quota fails
# But `get_ai_chat_response` logic already returns string. Let's make sure it doesn't crash.

# In `get_ai_chat_response`, we intercept ValueError or Exception and return a graceful message.
chat_response_patch = """
    try:
        return _call_with_fallback(_do)
    except Exception as e:
        err_str = str(e).lower()
        if any(q in err_str for q in _QUOTA_ERRORS) or "no keys available" in err_str:
            return "Mohon maaf, sistem AI sedang over-limit atau kunci belum tersedia. Silakan cek Admin Console."
        raise e
"""
text = re.sub(
    r'return _call_with_fallback\(_do\)',
    chat_response_patch.lstrip('\n'),
    text
)


with open('app/ai_service.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('ai_service patched')
