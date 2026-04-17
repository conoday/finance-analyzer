import re

with open('api/main.py', 'r', encoding='utf-8') as f:
    text = f.read()

endpoint_code = """
@app.get("/analyze/me")
def analyze_me(
    forecast_periods: int = Query(30, ge=7, le=90),
    forecast_method: str = Query("linear_regression"),
    user: dict = Depends(require_auth)
):
    \"\"\"Analyze transactions directly from the user's Supabase database.\"\"\"
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")

    user_id = user.get("sub")
    res = sb.table("transactions").select("*").eq("user_id", user_id).order("date").execute()
    
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Kamu belum mencatat transaksi apapun di Telegram/Web.")
    
    df = pd.DataFrame(rows)
    df = df.rename(columns={
        'date': 'Tanggal',
        'description': 'Keterangan',
        'amount': 'Nominal',
    })
    
    def adjust_nominal(row):
        if row['type'] == 'expense':
            return -abs(row['Nominal'])
        return row['Nominal']
    
    df['Nominal'] = df.apply(adjust_nominal, axis=1)

    result = run_pipeline(df, forecast_periods=forecast_periods, forecast_method=forecast_method)
    return _serialize(result)
"""

text = re.sub(
    r'(@app\.post\("/analyze"\)\nasync def analyze_upload.*?return _serialize\(result\)\n)',
    r'\1\n' + endpoint_code,
    text,
    flags=re.DOTALL
)

with open('api/main.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('Added GET /analyze/me successfully')
