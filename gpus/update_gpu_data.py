import json
import csv
import argparse

# usage: python update_scores.py path/to/data.json path/to/scores.csv Score GPU_Name --output updated.json


def main():
    parser = argparse.ArgumentParser(description="Scores aus CSV in JSON einfügen")
    parser.add_argument("json_file", help="Pfad zur JSON-Datei")
    parser.add_argument("csv_file", help="Pfad zur CSV-Datei")
    parser.add_argument(
        "score_column", help="Name der Spalte in CSV, die den Score enthält"
    )
    parser.add_argument(
        "key_column", help="Name der Spalte in CSV, die den GPU-Namen enthält"
    )
    parser.add_argument("--output", default="updated_data.json", help="Ausgabedatei")
    args = parser.parse_args()

    # JSON laden
    with open(args.json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # CSV laden
    scores_dict = {}
    with open(args.csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            gpu_name = row.get(args.key_column)
            score_value = row.get(args.score_column)
            if gpu_name:
                try:
                    scores_dict[gpu_name] = float(score_value)
                except (TypeError, ValueError):
                    scores_dict[gpu_name] = None

    # JSON aktualisieren
    def update_scores(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                # Prüfen, ob der Key ein GPU-Name ist, der im CSV vorkommt
                if k in scores_dict:
                    obj[k] = scores_dict[k]
                else:
                    if v is None:
                        obj[k] = None
                    else:
                        update_scores(v)
        elif isinstance(obj, list):
            for item in obj:
                update_scores(item)

    update_scores(data)

    # JSON speichern
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"JSON wurde aktualisiert und in '{args.output}' gespeichert.")


if __name__ == "__main__":
    main()
