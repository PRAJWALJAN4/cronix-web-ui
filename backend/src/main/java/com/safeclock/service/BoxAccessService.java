package com.safeclock.service;

import com.safeclock.entity.Box;
import com.safeclock.enums.BoxStatus;
import com.safeclock.repository.BoxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BoxAccessService {

    private final BoxRepository boxRepository;

    @Transactional
    public Map<String, Object> openBox(String boxId, String otp) {
        Box box = boxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("Box not found"));

        // Simulate hardware command
        log.info("🔓 [HARDWARE MOCK] Sending OPEN command to box: {} (port: {})", box.getIdentifiableName(), box.getPort());

        box.setBoxStatus(BoxStatus.OCCUPIED_OPEN);
        box.setUpdatedDate(new Date());
        boxRepository.save(box);

        return Map.of(
            "status", "OPENED",
            "boxName", box.getIdentifiableName(),
            "message", "Box " + box.getIdentifiableName() + " is now open. Please collect your items.",
            "port", box.getPort()
        );
    }

    @Transactional
    public Map<String, Object> closeBox(String boxId) {
        Box box = boxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("Box not found"));

        log.info("🔒 [HARDWARE MOCK] Sending CLOSE command to box: {} (port: {})", box.getIdentifiableName(), box.getPort());

        box.setBoxStatus(BoxStatus.OCCUPIED_CLOSED);
        box.setUpdatedDate(new Date());
        boxRepository.save(box);

        return Map.of(
            "status", "CLOSED",
            "boxName", box.getIdentifiableName(),
            "message", "Box " + box.getIdentifiableName() + " is now closed.",
            "port", box.getPort()
        );
    }
}
