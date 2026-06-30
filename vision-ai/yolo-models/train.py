"""
Vision AI - Custom YOLO Training Script for Civic Issue Detection

Usage:
    python train.py --data dataset.yaml --epochs 100 --img-size 640

Dataset structure:
    dataset/
    ├── train/
    │   ├── images/
    │   └── labels/
    ├── val/
    │   ├── images/
    │   └── labels/
    ├── test/
    │   ├── images/
    │   └── labels/
    └── dataset.yaml
"""

import argparse
import os
import yaml
from pathlib import Path

from ultralytics import YOLO


CLASSES = [
    "pothole",
    "garbage",
    "overflowing_bin",
    "broken_streetlight",
    "water_leakage",
    "fallen_tree",
    "road_crack",
    "illegal_dumping",
    "open_manhole",
]

SEVERITY_MAP = {
    "pothole": "high",
    "garbage": "medium",
    "overflowing_bin": "medium",
    "broken_streetlight": "medium",
    "water_leakage": "critical",
    "fallen_tree": "high",
    "road_crack": "high",
    "illegal_dumping": "medium",
    "open_manhole": "critical",
}


def create_dataset_yaml(data_dir: str, output_path: str = "dataset.yaml"):
    data_path = Path(data_dir)
    config = {
        "path": str(data_path.absolute()),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images" if (data_path / "test" / "images").exists() else "val/images",
        "nc": len(CLASSES),
        "names": CLASSES,
    }
    with open(output_path, "w") as f:
        yaml.dump(config, f, default_flow_style=False)
    print(f"Dataset config written to {output_path}")
    return output_path


def train(data_yaml: str, epochs: int = 100, img_size: int = 640, model_size: str = "yolov8n.pt"):
    model = YOLO(model_size)
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=img_size,
        batch=16,
        name="vision_ai_civic",
        patience=20,
        save=True,
        plots=True,
        device="auto",
    )
    print(f"Training complete. Best model: runs/detect/vision_ai_civic/weights/best.pt")
    return results


def validate(model_path: str, data_yaml: str):
    model = YOLO(model_path)
    metrics = model.val(data=data_yaml)
    print(f"mAP50: {metrics.box.map50}")
    print(f"mAP50-95: {metrics.box.map}")
    return metrics


def export_onnx(model_path: str, output_path: str = "vision_ai_model.onnx"):
    model = YOLO(model_path)
    model.export(format="onnx", imgsz=640)
    print(f"Model exported to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Vision AI YOLO model")
    parser.add_argument("--data", type=str, default="dataset.yaml", help="Dataset YAML path")
    parser.add_argument("--epochs", type=int, default=100, help="Training epochs")
    parser.add_argument("--img-size", type=int, default=640, help="Image size")
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="Base model size")
    parser.add_argument("--mode", type=str, default="train", choices=["train", "validate", "export"])
    args = parser.parse_args()

    if args.mode == "train":
        create_dataset_yaml("dataset") if not os.path.exists(args.data) else None
        train(args.data, args.epochs, args.img_size, args.model)
    elif args.mode == "validate":
        validate("runs/detect/vision_ai_civic/weights/best.pt", args.data)
    elif args.mode == "export":
        export_onnx("runs/detect/vision_ai_civic/weights/best.pt")
