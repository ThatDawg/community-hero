# Vision AI - Custom YOLO Dataset

## Directory Structure

```
yolo-models/
├── train.py              # Training script
├── dataset.yaml          # Dataset config (auto-generated)
├── dataset/              # Your training data
│   ├── train/
│   │   ├── images/       # Training images
│   │   └── labels/       # Training labels (YOLO format)
│   ├── val/
│   │   ├── images/       # Validation images
│   │   └── labels/       # Validation labels
│   └── test/
│       ├── images/       # Test images
│       └── labels/       # Test labels
├── vision_ai_model.pt    # Trained model (after training)
└── README.py             # This file
```

## YOLO Label Format

Each image has a corresponding `.txt` file with:
```
class_id  x_center  y_center  width  height
```

All values normalized 0-1. Example for a pothole at center:
```
0 0.5 0.5 0.2 0.15
```

## Classes (IDs 0-8)

| ID | Class | Severity |
|----|-------|----------|
| 0 | pothole | high |
| 1 | garbage | medium |
| 2 | overflowing_bin | medium |
| 3 | broken_streetlight | medium |
| 4 | water_leakage | critical |
| 5 | fallen_tree | high |
| 6 | road_crack | high |
| 7 | illegal_dumping | medium |
| 8 | open_manhole | critical |

## Training

```bash
# Install dependencies
pip install ultralytics pyyaml

# Prepare dataset (place images/labels in dataset/)
python train.py --data dataset.yaml --epochs 100 --img-size 640

# Validate
python train.py --mode validate

# Export to ONNX
python train.py --mode export
```

## Data Sources

Public datasets for fine-tuning:
- Roboflow Universe (search "pothole", "road damage", "garbage detection")
- Indian Pothole Detection Dataset
- Road Damage Dataset Challenge

## Notes

- Start with `yolov8n.pt` (nano) for fast inference
- Use `yolov8s.pt` or `yolov8m.pt` for better accuracy
- Minimum 100 images per class recommended
- Use data augmentation (rotation, flip, brightness) for better generalization
