"""Export faithful, hardware-free website crops from the native dark captures.

Import sources once with --source-dir; subsequent runs use checked-in lossless
full-screen WebPs. App Store compositions are intentionally not touched.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SCREENS = {
    "01-today": ("01-today-dark-iphone-17-pro-max.png", (0, 620, 1320, 1830)),
    "02-history": ("02-history-dark-iphone-17-pro-max.png", (0, 300, 1320, 1660)),
    "03-stats": ("03-stats-dark-iphone-17-pro-max.png", (0, 300, 1320, 1890)),
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def generate(source_directory=None):
    records = []
    for name, (source_name, crop_box) in SCREENS.items():
        full_path = ASSETS / f"{name}-full-v5.webp"
        if source_directory:
            with Image.open(source_directory / source_name) as source:
                source.convert("RGB").save(full_path, lossless=True, method=6)
        with Image.open(full_path) as source:
            assert source.size == (1320, 2868), source.size
            crop = source.crop(crop_box)
            crop_path = ASSETS / f"{name}-detail-v5.webp"
            crop.save(crop_path, lossless=True, method=6)
            with Image.open(crop_path) as exported:
                assert exported.convert("RGB").tobytes() == crop.convert("RGB").tobytes()
            records.append({
                "name": name,
                "source": full_path.name,
                "source_sha256": digest(full_path),
                "crop": crop_path.name,
                "crop_sha256": digest(crop_path),
                "crop_box": crop_box,
                "width": crop.width,
                "height": crop.height,
            })
    (ASSETS / "screen-crops-v5.json").write_text(json.dumps(records, indent=2) + "\n")
    print(json.dumps(records, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path)
    generate(parser.parse_args().source_dir)
