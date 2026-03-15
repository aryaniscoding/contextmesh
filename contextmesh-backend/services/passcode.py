"""Passcode generation and hashing service."""
import random
import hashlib
import hmac

WORDS = [
    "ALPHA", "BLAZE", "CORAL", "DELTA", "EAGLE", "FLAME", "GHOST", "HOVER",
    "IVORY", "JOKER", "KARMA", "LASER", "MANGO", "NOBLE", "ORBIT", "PRISM",
    "QUASAR", "RADAR", "SOLAR", "TIGER", "ULTRA", "VIPER", "WIZARD", "XENON",
    "ZEPHYR", "BOLT", "COMET", "SPARK", "FROST", "STORM", "RAVEN", "PIXEL",
    "NEBULA", "ROCKET", "THUNDER", "PHOENIX", "CIPHER", "MATRIX", "VERTEX",
    "FORGE", "NEXUS", "PULSE", "QUANTUM", "DRIFT", "EMBER", "HAVEN", "LYNX",
]


def generate_passcode() -> str:
    """Generate a passcode in WORD-NN-WORD format."""
    w1 = random.choice(WORDS)
    w2 = random.choice(WORDS)
    num = str(random.randint(10, 99))
    return f"{w1}-{num}-{w2}"


def hash_passcode(passcode: str) -> str:
    """Hash a passcode using SHA-256 (simpler than bcrypt, avoids compatibility issues)."""
    return hashlib.sha256(passcode.encode("utf-8")).hexdigest()


def verify_passcode(plain: str, hashed: str) -> bool:
    """Verify a plain passcode against its SHA-256 hash."""
    return hmac.compare_digest(
        hashlib.sha256(plain.encode("utf-8")).hexdigest(),
        hashed
    )
