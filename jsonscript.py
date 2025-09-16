import csv
import json

# CSV-Datei einlesen
csv_file = "gpus.csv"
json_file = "gpus.json"

gpus = {}

with open(csv_file, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        # id als Schlüssel, value als Score
        gpu_id = row["id"].strip()
        gpus[gpu_id] = {"name": row["name"].strip(), "score": int(row["value"])}

# JSON-Struktur mit Metadaten
data = {
    "metadata": {
        "reference_gpu": "GeForce RTX 3080",
        "reference_score": 1000,
        "total_gpus": len(gpus),
    },
    "gpus": gpus,
}

# In JSON-Datei schreiben
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print(f"{len(gpus)} GPUs wurden erfolgreich in {json_file} konvertiert.")
