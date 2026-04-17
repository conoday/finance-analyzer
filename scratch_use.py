import re

with open('frontend/src/hooks/useAnalysis.ts', 'r', encoding='utf-8') as f:
    text = f.read()

inject = """
  const analyzeMe = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await api.analyzeMe();
      setData(result);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }, []);

"""

text = re.sub(
    r'(const reset = useCallback\(\(\) => \{)',
    inject + r'\1',
    text
)

text = text.replace(
    'return { data, status, error, analyze, reset };',
    'return { data, status, error, analyze, analyzeMe, reset };'
)

with open('frontend/src/hooks/useAnalysis.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Patched useAnalysis.ts')
