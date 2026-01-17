# backend_hmac_flask.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os, hmac, hashlib, subprocess
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

app = Flask(__name__)
CORS(app)  # allow requests from frontend

# -----------------------------
# Azure Key Vault setup
# -----------------------------
KV_URI = "https://healthcarekv12345.vault.azure.net/"
credential = DefaultAzureCredential()
client = SecretClient(vault_url=KV_URI, credential=credential)

def get_kmaster():
    secret = client.get_secret("KmasterSecret")
    return secret.value.encode()

# -----------------------------
# Passwords and System IDs
# -----------------------------
PASSWORDS = {
    "FrontDesk": "FrontDesk@2025!",
    "GP": "GP_Doctor#Secure1",
    "CARDIO": "Cardio@Heart2025",
    "ORTHO": "Ortho@BoneSafe",
    "BillingDesk": "Billing$Vault2025"
}

SYSTEM_IDS = {
    "FrontDesk": "05440fb4ae6a44b5ad628db72b68c2df",  # machine-id from your system
    "GP": "05440fb4ae6a44b5ad628db72b68c2df",
    "CARDIO": "SYS123",
    "ORTHO": "SYS124",
    "BillingDesk": "SYS127"
}

ACTIVE_CHALLENGES = {}  # username -> challenge bytes

# -----------------------------
# Fetch system ID automatically from WSL Ubuntu
# -----------------------------
def get_system_id():
    try:
        with open("/etc/machine-id") as f:
            return f.read().strip()
    except Exception as e:
        print("Error fetching system ID:", e)
        return "UNKNOWN_SYS"

@app.route("/api/get_system_id", methods=["GET"])
def api_get_system_id():
    sys_id = get_system_id()
    return jsonify({"system_id": sys_id})

# -----------------------------
# Generate challenge
# -----------------------------
@app.route("/api/get_challenge", methods=["POST"])
def get_challenge():
    data = request.json
    username = data.get("username")
    if username not in PASSWORDS:
        return jsonify({"error": "Unknown username"}), 404

    challenge = os.urandom(16)
    ACTIVE_CHALLENGES[username] = challenge
    return jsonify({"challenge": challenge.hex()})

# -----------------------------
# Verify login
# -----------------------------
@app.route("/api/verify_login", methods=["POST"])
def verify_login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    system_id = data.get("system_id")

    if username not in PASSWORDS:
        return jsonify({"error": "Unknown username"}), 404

    challenge = ACTIVE_CHALLENGES.get(username)
    if not challenge:
        return jsonify({"error": "No active challenge"}), 400

    expected_password = PASSWORDS[username]
    expected_system_id = SYSTEM_IDS[username]

    # Verify password & system ID
    if expected_password != password:
        return jsonify({"error": "Invalid password"}), 403

    if expected_system_id != system_id:
        return jsonify({"error": "Invalid system/device"}), 403

    # -----------------------------
    # Compute HMACs using Kmaster
    # -----------------------------
    Kmaster = get_kmaster()

    # Simulated client HMAC (backend calculates it)
    client_hmac = hmac.new(Kmaster, f"{username}|{system_id}|{password}|{challenge.hex()}".encode(), hashlib.sha256).hexdigest()

    # Expected HMAC
    expected_hmac = hmac.new(Kmaster, f"{username}|{expected_system_id}|{expected_password}|{challenge.hex()}".encode(), hashlib.sha256).hexdigest()

    # Compare
    if hmac.compare_digest(client_hmac, expected_hmac):
        ACTIVE_CHALLENGES.pop(username, None)  # remove challenge safely
        return jsonify({"status": "success", "msg": f"Login successful for {username}"})
    else:
        return jsonify({"error": "Invalid HMAC"}), 403

# -----------------------------
# Run server
# -----------------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
