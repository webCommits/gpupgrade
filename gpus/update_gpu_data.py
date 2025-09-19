# usage: python update_scores.py path/to/data.json path/to/scores.csv Score GPU_Name --output updated.json

import json
import csv
import argparse


def normalize_name(name):
    if name is None:
        return ""
    # Kleinbuchstaben, Leerzeichen und Bindestriche entfernen
    return "".join(c.lower() for c in name if c.isalnum())


def main():
    parser = argparse.ArgumentParser(
        description="Scores aus CSV in JSON einfügen")
    parser.add_argument("json_file", help="Pfad zur JSON-Datei")
    parser.add_argument("csv_file", help="Pfad zur CSV-Datei")
    parser.add_argument(
        "score_column", help="Name der Spalte in CSV, die den Score enthält"
    )
    parser.add_argument(
        "key_column", help="Name der Spalte in CSV, die den GPU-Namen enthält"
    )
    parser.add_argument(
        "resolution", help="Auflösungs-Key in der JSON, z.B. 1080p, 1440p, 4k"
    )
    parser.add_argument(
        "--output", default="updated_data.json", help="Ausgabedatei")
    args = parser.parse_args()

    # JSON laden
    with open(args.json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # CSV laden und GPU-Name -> Score dict erstellen (normalisiert)
    scores_dict = {}
    with open(args.csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            gpu_name = row.get(args.key_column)
            score_value = row.get(args.score_column)
            norm_name = normalize_name(gpu_name)
            if norm_name:
                try:
                    scores_dict[norm_name] = float(score_value)
                except (TypeError, ValueError):
                    scores_dict[norm_name] = None

    # JSON aktualisieren
    for gpu_key, gpu_entry in data["gpus"].items():
        gpu_name = gpu_entry.get("name")
        norm_name = normalize_name(gpu_name)
        gpu_entry["scores"][args.resolution] = scores_dict.get(norm_name, None)

    # JSON speichern
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"JSON wurde aktualisiert und in '{args.output}' gespeichert.")


if __name__ == "__main__":
    main()
