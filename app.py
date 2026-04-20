from flask import Flask, jsonify, request

from ai_model import detect_anomaly
from blockchain import Blockchain
from llm_explainer import explain_log


# Create the Flask application instance.
app = Flask(__name__)


# Store log entries in memory while the server is running.
logs = []

# Store log entries permanently in a simple blockchain structure.
blockchain = Blockchain()


@app.route("/", methods=["GET"])
def home():
    """Return a simple API status message."""
    # This route prevents a 404 error when users open the root URL.
    return "API is running. Use /logs or /add_log", 200


@app.route("/add_log", methods=["POST"])
def add_log():
    """Add a new log entry from JSON input."""
    data = request.get_json(silent=True)

    # Validate that the request body contains valid JSON.
    if not data:
        return jsonify({"error": "JSON body is required"}), 400

    required_fields = ["user", "timestamp", "action", "resource"]

    # Check that all required fields are present in the JSON body.
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({"error": "Missing required fields", "fields": missing_fields}), 400

    # Build a clean log entry using only the expected fields.
    log_entry = {
        "user": data["user"],
        "timestamp": data["timestamp"],
        "action": data["action"],
        "resource": data["resource"],
    }

    # Detect whether the new log entry is normal or suspicious.
    log_entry["status"] = detect_anomaly(log_entry)

    # Explain the anomaly result in human-readable text.
    log_entry["explanation"] = explain_log(log_entry)

    # Save the log entry in the global list.
    logs.append(log_entry)

    # Add the saved log entry to the blockchain.
    blockchain.add_block(log_entry)

    return jsonify({"message": "Log added successfully", "log": log_entry}), 201


@app.route("/logs", methods=["GET"])
def get_logs():
    """Return all stored log entries."""
    return jsonify(logs), 200


@app.route("/chain", methods=["GET"])
def get_chain():
    """Return the full blockchain."""
    return jsonify(blockchain.to_list()), 200


if __name__ == "__main__":
    # Run instructions:
    # 1. Install Flask: pip install flask
    # 2. Start the server: python app.py
    # 3. Open the API at: http://127.0.0.1:5000
    app.run(debug=True)
