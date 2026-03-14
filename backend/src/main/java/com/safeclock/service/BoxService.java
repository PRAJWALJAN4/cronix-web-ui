package com.safeclock.service;

import com.safeclock.entity.Box;
import com.safeclock.entity.TerminalMetaData;
import com.safeclock.enums.BoxStatus;
import com.safeclock.enums.BoxType;
import com.safeclock.enums.TerminalLayoutType;
import com.safeclock.repository.BoxRepository;
import com.safeclock.repository.TerminalMetaDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BoxService {

    private final BoxRepository boxRepository;
    private final TerminalMetaDataRepository terminalMetaDataRepository;

    public List<Box> getBoxesByTerminal(String terminalId) {
        return boxRepository.findByTerminalId(terminalId);
    }

    public List<Box> getAvailableBoxes(String terminalId) {
        return boxRepository.findByTerminalIdAndBoxStatus(terminalId, BoxStatus.EMPTY_CLOSED);
    }

    public Box getBox(String boxId) {
        return boxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("Box not found"));
    }

    @Transactional
    public List<Box> generateBoxesForTerminal(String terminalId, String terminalMetaDataId) {
        TerminalMetaData meta = terminalMetaDataRepository.findFirstByTerminalIdOrderByUpdatedAtDesc(terminalId)
                .orElseThrow(() -> new RuntimeException("Terminal metadata not found"));

        // Delete existing boxes for this terminal first
        List<Box> existing = boxRepository.findByTerminalId(terminalId);
        boxRepository.deleteAll(existing);

        List<Box> boxes = new ArrayList<>();
        int port = 1;

        if (meta.getGridLayout() != null && !meta.getGridLayout().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(meta.getGridLayout());
                com.fasterxml.jackson.databind.JsonNode gridData = root.get("gridData");

                // We need to aggregate cells into blocks like the frontend does
                java.util.Map<String, com.fasterxml.jackson.databind.JsonNode> cellMap = new java.util.HashMap<>();
                java.util.Iterator<java.util.Map.Entry<String, com.fasterxml.jackson.databind.JsonNode>> fields = gridData.fields();
                while (fields.hasNext()) {
                    java.util.Map.Entry<String, com.fasterxml.jackson.databind.JsonNode> field = fields.next();
                    cellMap.put(field.getKey(), field.getValue());
                }

                // Group by blockId and collect coords
                java.util.Map<String, java.util.List<String>> blockCells = new java.util.HashMap<>();
                java.util.Map<String, String> blockSizes = new java.util.HashMap<>();
                
                for (java.util.Map.Entry<String, com.fasterxml.jackson.databind.JsonNode> entry : cellMap.entrySet()) {
                    String blockId = entry.getValue().get("blockId").asText();
                    String size = entry.getValue().get("size").asText();
                    blockCells.computeIfAbsent(blockId, k -> new ArrayList<>()).add(entry.getKey());
                    blockSizes.put(blockId, size);
                }

                // Create block objects with calculated minR/minC for sorting
                class BlockMeta {
                    String id, size;
                    int minR = 999, minC = 999;
                }
                
                List<BlockMeta> blocksSorted = new ArrayList<>();
                for (String bid : blockCells.keySet()) {
                    BlockMeta bm = new BlockMeta();
                    bm.id = bid;
                    bm.size = blockSizes.get(bid);
                    for (String cl : blockCells.get(bid)) {
                        String[] p = cl.split("-");
                        bm.minR = Math.min(bm.minR, Integer.parseInt(p[0]));
                        bm.minC = Math.min(bm.minC, Integer.parseInt(p[1]));
                    }
                    blocksSorted.add(bm);
                }
                
                // CRITICAL: Sort by Row then Column to match frontend naming!
                blocksSorted.sort((a, b) -> a.minR != b.minR ? a.minR - b.minR : a.minC - b.minC);

                if (blocksSorted.isEmpty()) {
                    log.warn("Custom grid layout has no blocks. Falling back to default.");
                    generateDefaultBoxes(terminalId, terminalMetaDataId, boxes, port);
                } else {
                    java.util.Map<String, Integer> sizeCounts = new java.util.HashMap<>();
                    for (BlockMeta bm : blocksSorted) {
                        BoxType type;
                        String prefix;
                        switch (bm.size) {
                            case "s": type = BoxType.SMALL; prefix = "S"; break;
                            case "l": type = BoxType.LARGE; prefix = "L"; break;
                            case "xl": type = BoxType.EXTRA_LARGE; prefix = "XL"; break;
                            case "m": default: type = BoxType.MEDIUM; prefix = "M"; break;
                        }
                        
                        int count = sizeCounts.getOrDefault(prefix, 0) + 1;
                        sizeCounts.put(prefix, count);
                        String name = prefix + "-" + count;

                        Box box = Box.builder()
                                .terminalId(terminalId)
                                .terminalMetaDataId(terminalMetaDataId)
                                .identifiableName(name)
                                .col(bm.minC + 1)
                                .rw(bm.minR + 1)
                                .boxStatus(BoxStatus.EMPTY_CLOSED)
                                .type(type)
                                .port(port++)
                                .updatedDate(new Date())
                                .build();
                        boxes.add(box);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to parse custom grid layout", e);
                generateDefaultBoxes(terminalId, terminalMetaDataId, boxes, port);
            }
        } else {
            generateDefaultBoxes(terminalId, terminalMetaDataId, boxes, port);
        }

        List<Box> saved = boxRepository.saveAll(boxes);
        log.info("Generated {} boxes for terminal {}", saved.size(), terminalId);
        return saved;
    }

    private void generateDefaultBoxes(String terminalId, String terminalMetaDataId, List<Box> boxes, int port) {
        int cols = 5;
        int rows = 4;
        String[] rowLabels = {"A", "B", "C", "D", "E", "F"};
        for (int row = 0; row < rows; row++) {
            for (int col = 1; col <= cols; col++) {
                String name = rowLabels[row] + "-" + col;
                BoxType type;
                if (row == 0) type = BoxType.LARGE;
                else if (row == 1) type = BoxType.MEDIUM;
                else if (row == rows - 1) type = BoxType.EXTRA_LARGE;
                else type = BoxType.SMALL;

                Box box = Box.builder()
                        .terminalId(terminalId)
                        .terminalMetaDataId(terminalMetaDataId)
                        .identifiableName(name)
                        .col(col)
                        .rw(row + 1)
                        .boxStatus(BoxStatus.EMPTY_CLOSED)
                        .type(type)
                        .port(port++)
                        .updatedDate(new Date())
                        .build();
                boxes.add(box);
            }
        }
    }

    @Transactional
    public Box updateBoxStatus(String boxId, BoxStatus status) {
        Box box = getBox(boxId);
        box.setBoxStatus(status);
        box.setUpdatedDate(new Date());
        return boxRepository.save(box);
    }

    @Transactional
    public void deleteBoxesByTerminal(String terminalId) {
        List<Box> boxes = boxRepository.findByTerminalId(terminalId);
        boxRepository.deleteAll(boxes);
        log.info("Deleted {} boxes for terminal {}", boxes.size(), terminalId);
    }
}
