"""
Quick test script untuk validasi API keys Kimi (Moonshot) dan GLM (Zhipu).
Mendukung grupy/reseller dengan custom base_url.
Usage: python test_ai_keys.py

PENTING: Jangan commit file ini jika sudah diisi dengan API key asli.
Gunakan environment variables atau input manual saat dijalankan.
"""

import os

PROMPT = (
    "Kategorikan transaksi berikut ke salah satu kategori "
    "(Makan/Transport/Belanja/Tagihan/Lainnya). "
    "Jawab hanya nama kategori.\n"
    "Transaksi: GRAB FOOD 12APR"
)


def _chat(api_key: str, base_url: str, model: str, label: str) -> bool:
    try:
        from openai import OpenAI
    except ImportError:
        print("❌ openai not installed. Run: pip install openai")
        return False

    client = OpenAI(api_key=api_key, base_url=base_url)
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": PROMPT}],
            max_tokens=10,
        )
        category = resp.choices[0].message.content.strip()
        tokens_used = resp.usage.total_tokens if resp.usage else "?"
        print(f"  ✅ {label} [{model}] — '{category}' | tokens: {tokens_used}")
        return True
    except Exception as e:
        print(f"  ❌ {label} [{model}] — {e}")
        return False


# ── Kimi (Moonshot AI) ───────────────────────────────────────────────────────
# Jika pakai grupy/reseller, base_url BUKAN api.moonshot.cn —
# tanya penyedia grupmu untuk endpoint yang benar.
KIMI_OFFICIAL_URL = "https://api.moonshot.cn/v1"
KIMI_MODELS = ["moonshot-v1-8k", "moonshot-v1-32k"]

def test_kimi(api_key: str, base_url: str):
    print(f"\n[Kimi] base_url: {base_url}")
    for model in KIMI_MODELS:
        if _chat(api_key, base_url, model, "Kimi"):
            return True
    return False


# ── GLM (Zhipu AI) ───────────────────────────────────────────────────────────
GLM_OFFICIAL_URL = "https://open.bigmodel.cn/api/paas/v4/"
# Coba beberapa nama model karena beda akun/tier beda ketersediaan
GLM_MODELS = ["glm-4-flash", "glm-4", "glm-4-air", "glm-4-airx", "glm-3-turbo", "chatglm_turbo"]

def test_glm(api_key: str, base_url: str):
    print(f"\n[GLM] base_url: {base_url}")
    for model in GLM_MODELS:
        if _chat(api_key, base_url, model, "GLM"):
            return True
    return False


# ── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  OprexDuit — AI Key Tester (grupy-aware)")
    print("=" * 60)
    print()
    print("Tips untuk grupy/reseller:")
    print("  - Kimi reseller biasanya kasih endpoint khusus (bukan api.moonshot.cn)")
    print("  - GLM reseller biasanya beri base_url proxy mereka sendiri")
    print("  - Kalau belum tahu endpoint, tanya admin grupmu")
    print()

    # Kimi
    kimi_key = os.getenv("KIMI_API_KEY") or input("KIMI API key (Enter=skip): ").strip()
    if kimi_key:
        default_kimi = os.getenv("KIMI_BASE_URL", KIMI_OFFICIAL_URL)
        kimi_url = input(f"KIMI base_url [{default_kimi}]: ").strip() or default_kimi
        test_kimi(kimi_key, kimi_url)
    else:
        print("⏭️  Kimi skipped")

    print()

    # GLM
    glm_key = os.getenv("GLM_API_KEY") or input("GLM  API key (Enter=skip): ").strip()
    if glm_key:
        default_glm = os.getenv("GLM_BASE_URL", GLM_OFFICIAL_URL)
        glm_url = input(f"GLM  base_url [{default_glm}]: ").strip() or default_glm
        test_glm(glm_key, glm_url)
    else:
        print("⏭️  GLM skipped")

    print()
    print("Setelah confirmed working, tambahkan ke .env.local dan Render env vars:")
    print("  KIMI_API_KEY=sk-kimi-...")
    print("  KIMI_BASE_URL=https://...")
    print("  GLM_API_KEY=ab8f80...")
    print("  GLM_BASE_URL=https://...")
