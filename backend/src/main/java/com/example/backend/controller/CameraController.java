package com.example.backend.controller;

import com.example.backend.service.WebcamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/camera")
public class CameraController {

    @Autowired
    private WebcamService webcamService;

    @GetMapping("/start")
    public ResponseEntity<String> startCamera() {
        try {
            webcamService.startCamera();
            return ResponseEntity.ok("Webcam started");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to start webcam: " + e.getMessage());
        }
    }

    @GetMapping("/stop")
    public ResponseEntity<String> stopCamera() {
        webcamService.stopCamera();
        return ResponseEntity.ok("Webcam stopped");
    }

    // Get current frame as Base64 (for Python or frontend)
    @GetMapping(value = "/frame", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getFrame() {
        try {
            String base64 = webcamService.getFrameAsBase64();
            if (base64 != null) {
                return ResponseEntity.ok("{\"image\":\"data:image/jpeg;base64," + base64 + "\"}");
            }
            return ResponseEntity.badRequest().body("No frame available");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error capturing frame: " + e.getMessage());
        }
    }

    // Optional: Get frame as raw bytes (image/jpeg)
    @GetMapping(value = "/frame/raw", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getRawFrame() {
        try {
            byte[] bytes = webcamService.getFrameAsBytes();
            if (bytes != null) {
                return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(bytes);
            }
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}