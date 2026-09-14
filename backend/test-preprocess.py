import cv2
import numpy as np
from PIL import Image

image_path = r'C:\Users\NAMAN\.gemini\antigravity-ide\brain\70639ae0-d3e1-4802-ab21-993b4c04db39\.user_uploaded\media_1789377885740.png'

with open(image_path, 'rb') as f:
    image_bytes = f.read()

nparr = np.frombuffer(image_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

if len(img.shape) == 3 and img.shape[2] == 4:
    alpha_channel = img[:, :, 3]
    rgb_channels = img[:, :, :3]
    white_background = np.ones_like(rgb_channels, dtype=np.uint8) * 255
    alpha_factor = alpha_channel[:, :, np.newaxis] / 255.0
    img = (rgb_channels * alpha_factor + white_background * (1 - alpha_factor)).astype(np.uint8)

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
denoised = cv2.fastNlMeansDenoising(gray, h=10)
_, processed = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

cv2.imwrite('preprocessed.png', processed)
