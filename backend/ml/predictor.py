"""
ml/predictor.py
Simple 7-day price prediction using scikit-learn LinearRegression.
Uses last 60 days of closing prices as feature (ordinal date index).
"""
import numpy as np
import pandas as pd
from datetime import date, timedelta
from sklearn.linear_model import LinearRegression
from typing import List, Dict


def predict_next_7_days(close_series: pd.Series, last_trading_date: date) -> List[Dict]:
    """
    Fit a LinearRegression on the last 60 data points and predict 7 days ahead.

    Returns a list of {date, predicted_close} dicts.
    """
    if len(close_series) < 10:
        return []

    # Use last 60 days
    series = close_series.tail(60).reset_index(drop=True)
    X = np.arange(len(series)).reshape(-1, 1)
    y = series.values

    model = LinearRegression()
    model.fit(X, y)

    # Predict next 7 trading days
    last_idx = len(series) - 1
    future_X = np.arange(last_idx + 1, last_idx + 8).reshape(-1, 1)
    predictions = model.predict(future_X)

    # Future business dates after the last observed close (not calendar "today")
    future_dates = []
    d = last_trading_date + timedelta(days=1)
    while len(future_dates) < 7:
        if d.weekday() < 5:
            future_dates.append(d)
        d += timedelta(days=1)

    return [
        {"date": fd.isoformat(), "predicted_close": round(float(p), 2)}
        for fd, p in zip(future_dates, predictions)
    ]
