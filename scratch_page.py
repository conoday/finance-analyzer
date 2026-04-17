import re

with open('frontend/src/app/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. import useAuth & useEffect
text = text.replace(
    'import { useState } from "react";',
    'import { useState, useEffect } from "react";\nimport { useAuth } from "@/hooks/useAuth";'
)

# 2. Add useAuth & analyzeMe to component
text = text.replace(
    'const { data, status, error, analyze, reset } = useAnalysis();',
    'const { user } = useAuth();\n  const { data, status, error, analyze, analyzeMe, reset } = useAnalysis();'
)

# 3. Add useEffect hook
use_effect = """
  // Sync Cloud Data automatically
  useEffect(() => {
    if (user && !data && status === "idle") {
      analyzeMe();
    }
  }, [user, data, status, analyzeMe]);

"""
text = re.sub(
    r'(const \[showSmartInput, setShowSmartInput\] = useState\(false\);\n)',
    r'\1' + use_effect,
    text
)

# 4. Modify the teaser text to say "Syncing with Telegram..." or something if status === loading
# wait, status === "loading" already shows `<Loader2 className="w-16 h-16 animate-spin" /> Menganalisis transaksi Anda…`
# so that's fine.

with open('frontend/src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Patched page.tsx')
