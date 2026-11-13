package com.scheduler.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EventStreamController {

    @Autowired
    private DashboardController dashboardController;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    @GetMapping(value = "/metrics", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMetrics() {
        SseEmitter emitter = new SseEmitter(180000L); // 3 minutes timeout
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));

        // Send initial state immediately
        try {
            emitter.send(SseEmitter.event().name("metrics").data(dashboardController.getStats().getBody()));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    @Scheduled(fixedRate = 3000) // Broadcast every 3 seconds
    public void broadcastMetrics() {
        if (emitters.isEmpty()) return;

        Object stats = dashboardController.getStats().getBody();
        List<SseEmitter> deadEmitters = new ArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("metrics").data(stats));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }
        
        emitters.removeAll(deadEmitters);
    }
}
