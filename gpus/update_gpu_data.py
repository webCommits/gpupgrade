import json
import csv
import os


def load_json(file_path):
    """Load the JSON file"""
    with open(file_path, "r") as f:
        return json.load(f)


def save_json(data, file_path):
    """Save the updated JSON file"""
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)


def read_csv_data(csv_file_path):
    """
    Read CSV file and return a dictionary mapping GPU names to raw performance ratings
    """
    gpu_data = {}

    if not os.path.exists(csv_file_path):
        print(f"Warning: CSV file {csv_file_path} not found")
        return gpu_data

    with open(csv_file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)  # Skip header row

        for row in reader:
            if len(row) >= 5:  # Ensure we have enough columns
                gpu_name = row[0].strip()
                raw_performance = row[
                    4
                ].strip()  # 5th column (index 4) is raw performance

                try:
                    raw_performance_float = float(raw_performance)
                    gpu_data[gpu_name] = raw_performance_float
                except ValueError:
                    print(
                        f"Warning: Could not convert '{
                            raw_performance}' to float for GPU: {gpu_name}"
                    )

    return gpu_data


def update_json_with_csv_data(json_data, csv_data, resolution):
    """
    Update JSON data with CSV values for a specific resolution
    """
    updated_count = 0

    for gpu_key, gpu_info in json_data["gpus"].items():
        gpu_name = gpu_info["name"]

        if gpu_name in csv_data:
            current_value = gpu_info["scores"][resolution]
            new_value = csv_data[gpu_name]

            # Only update if the value is different from current
            if current_value != new_value:
                gpu_info["scores"][resolution] = new_value
                updated_count += 1
                print(f"Updated {gpu_name}: {resolution} = {new_value}")

    return updated_count


def main():
    # File paths
    json_file_path = "gpu_data.json"  # Replace with your actual JSON file path
    csv_files = {
        "overall": "overall.csv",
        "1080p": "1080p.csv",
        "1440p": "1440p.csv",
        "4k": "4k.csv",
    }

    # Load the JSON data
    try:
        json_data = load_json(json_file_path)
        print(f"Loaded JSON with {len(json_data['gpus'])} GPUs")
    except FileNotFoundError:
        print(f"Error: JSON file {json_file_path} not found")
        return
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in {json_file_path}")
        return

    # Process each resolution CSV file
    total_updates = 0

    for resolution, csv_file in csv_files.items():
        print(f"\nProcessing {resolution} data from {csv_file}...")

        # Read CSV data
        csv_data = read_csv_data(csv_file)
        print(f"Found {len(csv_data)} GPUs in {csv_file}")

        # Update JSON with CSV data
        updates = update_json_with_csv_data(json_data, csv_data, resolution)
        total_updates += updates
        print(f"Updated {updates} entries for {resolution}")

    # Save the updated JSON
    if total_updates > 0:
        save_json(json_data, json_file_path)
        print(f"\nSuccessfully updated {
              total_updates} values in {json_file_path}")
    else:
        print("\nNo updates were made - all values were already up to date")


if __name__ == "__main__":
    main()
