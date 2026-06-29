"""YOLO models placeholder - create your custom trained model here.

To train a custom YOLO model for civic issues:
1. Collect and label images of potholes, garbage, broken streetlights, etc.
2. Use Roboflow or LabelImg for annotation
3. Train with: yolo detect train data=civic_dataset.yaml model=yolov8n.pt epochs=50
4. Place the trained model in this directory as civic_issues.pt
"""

CIVIC_CLASSES = {
    0: "pothole",
    1: "garbage",
    2: "overflowing_bin",
    3: "broken_streetlight",
    4: "water_leakage",
    5: "fallen_tree",
    6: "road_crack",
    7: "illegal_dumping",
    8: "open_manhole",
}

DATASET_CONFIG = """# civic_dataset.yaml
path: ./civic_dataset
train: train/images
val: val/images

names:
  0: pothole
  1: garbage
  2: overflowing_bin
  3: broken_streetlight
  4: water_leakage
  5: fallen_tree
  6: road_crack
  7: illegal_dumping
  8: open_manhole
"""

if __name__ == "__main__":
    print("Civic Issue Classes:")
    for idx, name in CIVIC_CLASSES.items():
        print(f"  {idx}: {name}")
    print("\nTo train your model:")
    print("  yolo detect train data=civic_dataset.yaml model=yolov8n.pt epochs=50 imgsz=640")
