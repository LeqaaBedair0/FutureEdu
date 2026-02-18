import cv2
import numpy as np

print("OpenCV version:", cv2.__version__)

img = np.zeros((480, 640, 3), dtype=np.uint8)
cv2.putText(img, "OpenCV imshow Test", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 3)

cv2.imshow("Test Window", img)
print("النافذة المفروض تفتح دلوقتي لمدة 5 ثواني...")

cv2.waitKey(5000)  # انتظر 5 ثواني بدل 0 (انتظار لا نهائي)
cv2.destroyAllWindows()

print("تم العرض بنجاح!")