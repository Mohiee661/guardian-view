from sklearn.ensemble import IsolationForest


# Convert action names into numeric values for the model.
ACTION_ENCODING = {
    "login": 0,
    "file_read": 1,
    "file_delete": 2,
}


def extract_features(log: dict) -> list:
    """Convert a log dictionary into numeric model features."""
    # Extract the hour from a timestamp string in "HH:MM" format.
    hour = int(log["timestamp"].split(":")[0])

    # Convert the action string into a numeric value.
    action_value = ACTION_ENCODING.get(log["action"], -1)

    return [hour, action_value]


# Synthetic training data for normal user behavior.
# Normal behavior happens between 08:00 and 20:00 and includes login/file_read.
training_data = []
for hour in range(8, 21):
    training_data.append([hour, ACTION_ENCODING["login"]])
    training_data.append([hour, ACTION_ENCODING["file_read"]])


# Train the anomaly detection model when this file is loaded.
model = IsolationForest(contamination=0.1, random_state=42)
model.fit(training_data)


def detect_anomaly(log: dict) -> str:
    """Detect whether a log entry is normal or suspicious."""
    # Extract numeric features from the input log.
    features = extract_features(log)

    # IsolationForest returns 1 for normal data and -1 for anomalies.
    result = model.predict([features])[0]

    if result == 1:
        return "normal"

    return "suspicious"
