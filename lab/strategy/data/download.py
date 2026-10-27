"""Tooling only: python3 -m pip install yfinance; python3 download.py."""
import argparse
import datetime
import json
from pathlib import Path

import pandas as pd
import yfinance as yf

parser = argparse.ArgumentParser()
parser.add_argument("--from-csv", help="Reuse a saved, unadjusted yfinance history response")
args = parser.parse_args()
frame = (pd.read_csv(args.from_csv, index_col=0) if args.from_csv else
         yf.Ticker("SPY").history(start="2005-01-01", auto_adjust=False, actions=True))
if frame.empty or frame[["Close", "Adj Close"]].isna().any().any():
    raise RuntimeError("Yahoo returned missing prices; refusing to replace the dataset")
dividend_index = frame.index.get_loc(frame[frame["Dividends"] > 0].index[-1])
evidence = []
for i in [dividend_index - 1, dividend_index]:
    row = frame.iloc[i]
    evidence.append({"date": str(frame.index[i])[:10], "close": round(float(row["Close"]), 6),
                     "adjustedClose": round(float(row["Adj Close"]), 6),
                     "closeToAdjustedRatio": float(row["Close"] / row["Adj Close"]),
                     "dividend": float(row["Dividends"])})
retrieved = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
payload = {"symbol": "SPY", "source": "https://finance.yahoo.com/quote/SPY/history/",
           "retrieved": retrieved, "tool": "yfinance " + yf.__version__, "autoAdjust": False,
           "series": "Adj Close", "adjustment": "Splits + dividends (total-return-style); not raw executable prices",
           "description": f"Yahoo Finance adjusted close (splits + dividends), retrieved {retrieved} via yfinance",
           "precision": 4, "columns": ["date", "adjustedClose"], "adjustmentEvidence": evidence,
           "data": [[str(date)[:10], round(float(row["Adj Close"]), 4)] for date, row in frame.iterrows()]}
path = Path(__file__).with_name("spy.json")
path.write_text(json.dumps(payload, separators=(",", ":")) + "\n")
print(f"SPY: {len(frame)} rows, {payload['data'][0][0]} → {payload['data'][-1][0]}, {path.stat().st_size} bytes")
print(json.dumps(evidence, indent=2))
