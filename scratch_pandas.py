import re

with open('app/utils.py', 'r', encoding='utf-8') as f:
    text = f.read()

patch = """
    # Suppress UserWarning by using format="mixed" for modern Pandas
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        df["tanggal"] = pd.to_datetime(
            df["tanggal"],
            dayfirst=True,
            errors="coerce",
        )
"""

text = re.sub(
    r'(df\["tanggal"\] = pd\.to_datetime\(\s*df\["tanggal"\],\s*dayfirst=True,\s*errors="coerce",\s*\))',
    patch.strip('\n'),
    text,
    flags=re.DOTALL
)

with open('app/utils.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('app/utils.py patched')
