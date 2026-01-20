# backend_hmac_flask.py
from flask import Flask, request, jsonify
from flask_cors import CORS  
import os, hmac, hashlib, subprocess
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.storage.blob import BlobServiceClient
import subprocess
import os
from tempfile import NamedTemporaryFile
app = Flask(__name__)
CORS(app)  # allow requests from frontend

CONTAINERS = {"A": "layer-a", "B": "layer-b", "C": "layer-c"}

AES_EXE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "aes_gcm.exe")
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
    "CARDIO": "05440fb4ae6a44b5ad628db72b68c2df",
    "ORTHO": "05440fb4ae6a44b5ad628db72b68c2df",
    "BillingDesk": "05440fb4ae6a44b5ad628db72b68c2df"
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

@app.route("/api/fetch_gp_data", methods=["POST"])
def fetch_gp_data():
    import os
    import subprocess
    from flask import request, jsonify
    from azure.storage.blob import BlobServiceClient

    data = request.json
    patient_id = data.get("patientId")  # numeric
    password = data.get("password")

    if patient_id is None or password is None:
        return jsonify({"error": "Patient ID and password required"}), 400

    patient_id_str = str(patient_id)

    blob_service = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
    container_client = blob_service.get_container_client(CONTAINERS["B"])

    base_folder = os.path.dirname(os.path.abspath(__file__))
    patient_data = None  # only one patient expected

    for blob in container_client.list_blobs():
        if patient_id_str not in blob.name:
            continue

        try:
            enc_file_path = os.path.join(base_folder, blob.name)
            dec_file_path = os.path.join(base_folder, f"decrypted_{blob.name}.txt")

            # Download encrypted blob
            with open(enc_file_path, "wb") as f:
                f.write(container_client.download_blob(blob.name).readall())

            # Decrypt
            result = subprocess.run(
                [AES_EXE, "decrypt", password, enc_file_path, dec_file_path],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                print(f"AES ERROR for {blob.name}: {result.stderr}")
                continue

            # Read decrypted content
            with open(dec_file_path, "r", errors="ignore") as f:
                content = f.read()

            # Parse lines
            lines = content.splitlines()
            data_dict = {
                "id": patient_id,
                "name": f"Patient {patient_id}",
                "diagnosis": "-",
                "medicalHistory": "-",
                "symptoms": "-",
                "testResults": "-",
                "prescriptions": "-",
                "doctorNotes": "-",
                "allergies": "-",
                "referredTo": "-",
                "doctorAssigned": "-"
            }

            for line in lines:
                line = line.strip()
                if line.startswith("Diagnosis:"):
                    data_dict["diagnosis"] = line.replace("Diagnosis:", "").strip()
                elif line.startswith("Medical History:"):
                    data_dict["medicalHistory"] = line.replace("Medical History:", "").strip()
                elif line.startswith("Symptoms:"):
                    data_dict["symptoms"] = line.replace("Symptoms:", "").strip()
                elif line.startswith("Test Results:"):
                    data_dict["testResults"] = line.replace("Test Results:", "").strip()
                elif line.startswith("Prescriptions:"):
                    data_dict["prescriptions"] = line.replace("Prescriptions:", "").strip()
                elif line.startswith("Doctor Notes:"):
                    data_dict["doctorNotes"] = line.replace("Doctor Notes:", "").strip()
                elif line.startswith("Allergies:"):
                    data_dict["allergies"] = line.replace("Allergies:", "").strip()
                elif line.startswith("Referred To:"):
                    data_dict["referredTo"] = line.replace("Referred To:", "").strip()
                elif line.startswith("Doctor assigned:"):
                    data_dict["doctorAssigned"] = line.replace("Doctor assigned:", "").strip()

            patient_data = data_dict
            break  # only first matching blob

        except Exception as e:
            print(f"ERROR processing {blob.name}: {e}")
            continue

    if not patient_data:
        return jsonify({"error": "No records found or decryption failed"}), 404

    return jsonify(patient_data), 200

@app.route("/api/fetch_cardio_data", methods=["POST"])
def fetch_cardio_data():
    import os
    import subprocess
    from flask import request, jsonify
    from azure.storage.blob import BlobServiceClient

    data = request.json
    patient_id = data.get("patientId")  # numeric
    password = data.get("password")

    if patient_id is None or password is None:
        return jsonify({"error": "Patient ID and password required"}), 400

    patient_id_str = str(patient_id)

    blob_service = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
    container_client = blob_service.get_container_client(CONTAINERS["B"])

    base_folder = os.path.dirname(os.path.abspath(__file__))
    patient_data = None  # only one patient expected

    for blob in container_client.list_blobs():
        if patient_id_str not in blob.name:
            continue

        try:
            enc_file_path = os.path.join(base_folder, blob.name)
            dec_file_path = os.path.join(base_folder, f"decrypted_{blob.name}.txt")

            # Download encrypted blob
            with open(enc_file_path, "wb") as f:
                f.write(container_client.download_blob(blob.name).readall())

            # Decrypt
            result = subprocess.run(
                [AES_EXE, "decrypt", password, enc_file_path, dec_file_path],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                print(f"AES ERROR for {blob.name}: {result.stderr}")
                continue

            # Read decrypted content
            with open(dec_file_path, "r", errors="ignore") as f:
                content = f.read()

            # Parse lines
            lines = content.splitlines()
            data_dict = {
                "id": patient_id,
                "name": f"Patient {patient_id}",
                "diagnosis": "-",
                "medicalHistory": "-",
                "symptoms": "-",
                "testResults": "-",
                "prescriptions": "-",
                "doctorNotes": "-",
                "allergies": "-",
                "referredTo": "-",
                "doctorAssigned": "-"
            }

            for line in lines:
                line = line.strip()
                if line.startswith("Diagnosis:"):
                    data_dict["diagnosis"] = line.replace("Diagnosis:", "").strip()
                elif line.startswith("Medical History:"):
                    data_dict["medicalHistory"] = line.replace("Medical History:", "").strip()
                elif line.startswith("Symptoms:"):
                    data_dict["symptoms"] = line.replace("Symptoms:", "").strip()
                elif line.startswith("Test Results:"):
                    data_dict["testResults"] = line.replace("Test Results:", "").strip()
                elif line.startswith("Prescriptions:"):
                    data_dict["prescriptions"] = line.replace("Prescriptions:", "").strip()
                elif line.startswith("Doctor Notes:"):
                    data_dict["doctorNotes"] = line.replace("Doctor Notes:", "").strip()
                elif line.startswith("Allergies:"):
                    data_dict["allergies"] = line.replace("Allergies:", "").strip()
                elif line.startswith("Referred To:"):
                    data_dict["referredTo"] = line.replace("Referred To:", "").strip()
                elif line.startswith("Doctor assigned:"):
                    data_dict["doctorAssigned"] = line.replace("Doctor assigned:", "").strip()

            patient_data = data_dict
            break  # only first matching blob

        except Exception as e:
            print(f"ERROR processing {blob.name}: {e}")
            continue

    if not patient_data:
        return jsonify({"error": "No records found or decryption failed"}), 404

    return jsonify(patient_data), 200

@app.route("/api/fetch_ortho_data", methods=["POST"])
def fetch_ortho_data():
    import os
    import subprocess
    from flask import request, jsonify
    from azure.storage.blob import BlobServiceClient

    data = request.json
    patient_id = data.get("patientId")  # numeric
    password = data.get("password")

    if patient_id is None or password is None:
        return jsonify({"error": "Patient ID and password required"}), 400

    patient_id_str = str(patient_id)

    blob_service = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
    container_client = blob_service.get_container_client(CONTAINERS["B"])

    base_folder = os.path.dirname(os.path.abspath(__file__))
    patient_data = None  # only one patient expected

    for blob in container_client.list_blobs():
        if patient_id_str not in blob.name:
            continue

        try:
            enc_file_path = os.path.join(base_folder, blob.name)
            dec_file_path = os.path.join(base_folder, f"decrypted_{blob.name}.txt")

            # Download encrypted blob
            with open(enc_file_path, "wb") as f:
                f.write(container_client.download_blob(blob.name).readall())

            # Decrypt
            result = subprocess.run(
                [AES_EXE, "decrypt", password, enc_file_path, dec_file_path],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                print(f"AES ERROR for {blob.name}: {result.stderr}")
                continue

            # Read decrypted content
            with open(dec_file_path, "r", errors="ignore") as f:
                content = f.read()

            # Parse lines
            lines = content.splitlines()
            data_dict = {
                "id": patient_id,
                "name": f"Patient {patient_id}",
                "diagnosis": "-",
                "medicalHistory": "-",
                "symptoms": "-",
                "testResults": "-",
                "prescriptions": "-",
                "doctorNotes": "-",
                "allergies": "-",
                "referredTo": "-",
                "doctorAssigned": "-"
            }

            for line in lines:
                line = line.strip()
                if line.startswith("Diagnosis:"):
                    data_dict["diagnosis"] = line.replace("Diagnosis:", "").strip()
                elif line.startswith("Medical History:"):
                    data_dict["medicalHistory"] = line.replace("Medical History:", "").strip()
                elif line.startswith("Symptoms:"):
                    data_dict["symptoms"] = line.replace("Symptoms:", "").strip()
                elif line.startswith("Test Results:"):
                    data_dict["testResults"] = line.replace("Test Results:", "").strip()
                elif line.startswith("Prescriptions:"):
                    data_dict["prescriptions"] = line.replace("Prescriptions:", "").strip()
                elif line.startswith("Doctor Notes:"):
                    data_dict["doctorNotes"] = line.replace("Doctor Notes:", "").strip()
                elif line.startswith("Allergies:"):
                    data_dict["allergies"] = line.replace("Allergies:", "").strip()
                elif line.startswith("Referred To:"):
                    data_dict["referredTo"] = line.replace("Referred To:", "").strip()
                elif line.startswith("Doctor assigned:"):
                    data_dict["doctorAssigned"] = line.replace("Doctor assigned:", "").strip()

            patient_data = data_dict
            break  # only first matching blob

        except Exception as e:
            print(f"ERROR processing {blob.name}: {e}")
            continue

    if not patient_data:
        return jsonify({"error": "No records found or decryption failed"}), 404

    return jsonify(patient_data), 200

@app.route("/api/fetch_frontdesk_data", methods=["POST"])
def fetch_frontdesk_data():
    import os
    import subprocess
    from flask import request, jsonify
    from azure.storage.blob import BlobServiceClient

    data = request.json
    patient_id = data.get("patientId")
    password = data.get("password")

    if not patient_id or not password:
        return jsonify({"error": "Patient ID and password required"}), 400

    patient_id_str = str(patient_id)
    blob_service = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
    container_client = blob_service.get_container_client(CONTAINERS["A"])
    base_folder = os.path.dirname(os.path.abspath(__file__))
    patient_data = None

    for blob in container_client.list_blobs():
        # Match patient ID as substring in filename
        if patient_id_str not in blob.name:
            continue

        try:
            enc_file_path = os.path.join(base_folder, blob.name)
            dec_file_path = os.path.join(base_folder, f"decrypted_{blob.name}.txt")

            # Download encrypted blob
            with open(enc_file_path, "wb") as f:
                f.write(container_client.download_blob(blob.name).readall())

            # Decrypt
            result = subprocess.run(
                [AES_EXE, "decrypt", password, enc_file_path, dec_file_path],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                print(f"AES ERROR: {result.stderr}")
                continue

            # Read decrypted file
            with open(dec_file_path, "r", errors="ignore") as f:
                lines = f.read().splitlines()

            # Parse file like "Key: Value"
            patient_data = {}
            for line in lines:
                if ":" in line:
                    key, value = line.split(":", 1)
                    patient_data[key.strip()] = value.strip()

            break  # only first matching blob

        except Exception as e:
            print("ERROR:", e)

    if not patient_data:
        return jsonify({"error": "No records found or decryption failed"}), 404

    return jsonify(patient_data), 200


@app.route("/api/fetch_billingdesk_data", methods=["POST"])
def fetch_billingdesk_data():
    import os
    import subprocess
    from flask import request, jsonify
    from azure.storage.blob import BlobServiceClient

    data = request.json
    password = data.get("password")
    if not password:
        return jsonify({"error": "Password required"}), 400

    blob_service = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
    container_client = blob_service.get_container_client(CONTAINERS["C"])
    base_folder = os.path.dirname(os.path.abspath(__file__))

    all_patients = []

    for blob in container_client.list_blobs():
        try:
            enc_file_path = os.path.join(base_folder, blob.name)
            dec_file_path = os.path.join(base_folder, f"decrypted_{blob.name}.txt")

            # Download encrypted blob
            with open(enc_file_path, "wb") as f:
                f.write(container_client.download_blob(blob.name).readall())

            # Decrypt
            result = subprocess.run(
                [AES_EXE, "decrypt", password, enc_file_path, dec_file_path],
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                print(f"AES ERROR ({blob.name}): {result.stderr}")
                continue

            # Read decrypted file as key:value
            patient_data = {}
            with open(dec_file_path, "r", errors="ignore") as f:
                for line in f:
                    if ":" in line:
                        key, value = line.split(":", 1)
                        patient_data[key.strip()] = value.strip()

            # Ensure Payment_status lowercase
            patient_data["Payment_status"] = patient_data.get("Payment_status", "pending").lower()

            all_patients.append(patient_data)

        except Exception as e:
            print(f"ERROR processing {blob.name}: {e}")

    if not all_patients:
        return jsonify({"error": "No records found or decryption failed"}), 404

    return jsonify(all_patients), 200


# -----------------------------
# Run server
# -----------------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
