INVALID_SYMBOLS = {
    "YFII-USDT",
}


def normalize_symbol(raw: str) -> str:
    if not raw:
        return ""
    parts = str(raw).strip().replace("/", "-").split("-")
    if len(parts) < 2:
        return ""
    base = parts[0].strip().upper()
    quote = parts[1].strip().upper()
    return f"{base}-{quote}"


def is_valid_symbol(symbol: str) -> bool:
    if not symbol or symbol in INVALID_SYMBOLS:
        return False
    if "-" not in symbol:
        return False
    base, quote = symbol.split("-", 1)
    if not base or not quote:
        return False
    if not base.isalnum() or not quote.isalnum():
        return False
    if not any(ch.isalpha() for ch in base):
        return False
    if not any(ch.isalpha() for ch in quote):
        return False
    return True
