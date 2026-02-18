package com.example.backend.service;

import jakarta.annotation.PreDestroy;
import org.bytedeco.javacv.*;
import org.bytedeco.opencv.opencv_core.Mat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Service
public class WebcamService {

    private static final Logger log = LoggerFactory.getLogger(WebcamService.class);

    private OpenCVFrameGrabber grabber;
    private boolean isRunning = false;

    private static final int MAX_RETRIES = 5;
    private static final long RETRY_DELAY_MS = 1000;

    public WebcamService() {
        grabber = new OpenCVFrameGrabber(0); // index 0 = الكاميرا الافتراضية
        grabber.setImageWidth(640);
        grabber.setImageHeight(480);
        grabber.setFrameRate(15); // خفض FPS لتجنب الحمل الزائد والأخطاء
        grabber.setTimeout(8000); // timeout أطول لتجنب قطع الاتصال
    }

    public synchronized void startCamera() throws FrameGrabber.Exception {
        if (isRunning) return;

        int attempts = 0;
        while (attempts < MAX_RETRIES) {
            try {
                grabber.start();
                isRunning = true;
                log.info("Webcam started successfully on index 0");
                return;
            } catch (FrameGrabber.Exception e) {
                attempts++;
                log.warn("فشل بدء الكاميرا (محاولة {}/{}): {}", attempts, MAX_RETRIES, e.getMessage());
                if (attempts >= MAX_RETRIES) {
                    log.error("فشل بدء الكاميرا بعد {} محاولات", MAX_RETRIES);
                    throw e;
                }
                sleep(RETRY_DELAY_MS);
            }
        }
    }

    public synchronized void stopCamera() {
        if (isRunning) {
            try {
                grabber.stop();
                grabber.release();
                isRunning = false;
                log.info("Webcam stopped successfully");
            } catch (FrameGrabber.Exception e) {
                log.error("خطأ أثناء إيقاف الكاميرا: {}", e.getMessage());
            }
        }
    }

    public String getFrameAsBase64() {
        if (!isRunning) {
            try {
                startCamera();
            } catch (FrameGrabber.Exception e) {
                log.error("فشل بدء الكاميرا لالتقاط فريم: {}", e.getMessage());
                return null;
            }
        }

        int attempts = 0;
        while (attempts < MAX_RETRIES) {
            try {
                Frame frame = grabber.grab(); // ← الدالة الصحيحة في JavaCV الحديثة
                if (frame == null || frame.image == null) {
                    log.warn("فريم فارغ أو بدون صورة - محاولة {}", attempts + 1);
                    attempts++;
                    sleep(RETRY_DELAY_MS);
                    continue;
                }

                Java2DFrameConverter converter = new Java2DFrameConverter();
                BufferedImage image = converter.getBufferedImage(frame);

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(image, "jpg", baos);
                byte[] bytes = baos.toByteArray();

                return Base64.getEncoder().encodeToString(bytes);
            } catch (Exception e) {
                attempts++;
                log.warn("خطأ في التقاط الفريم (محاولة {}/{}): {}", attempts, MAX_RETRIES, e.getMessage());
                if (attempts >= MAX_RETRIES) {
                    log.error("فشل التقاط فريم بعد {} محاولات", MAX_RETRIES);
                    return null;
                }
                sleep(RETRY_DELAY_MS);
            }
        }
        return null;
    }

    public byte[] getFrameAsBytes() {
        String base64 = getFrameAsBase64();
        if (base64 == null) return null;
        try {
            return Base64.getDecoder().decode(base64);
        } catch (Exception e) {
            log.error("فشل فك Base64: {}", e.getMessage());
            return null;
        }
    }

    public void saveSnapshot(String path) {
        byte[] bytes = getFrameAsBytes();
        if (bytes != null) {
            try {
                java.nio.file.Files.write(java.nio.file.Paths.get(path), bytes);
                log.info("Snapshot saved: {}", path);
            } catch (IOException e) {
                log.error("فشل حفظ الصورة: {}", e.getMessage());
            }
        }
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @PreDestroy
    public void cleanup() {
        stopCamera();
        log.info("WebcamService تم تدميره");
    }
}