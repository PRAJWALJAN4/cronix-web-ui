package com.safeclock.controller;

import com.safeclock.dto.response.ApiResponse;
import com.safeclock.entity.Site;
import com.safeclock.entity.Terminal;
import com.safeclock.entity.TerminalMetaData;
import com.safeclock.entity.Box;
import com.safeclock.entity.Pricing;
import com.safeclock.entity.Orders;
import com.safeclock.enums.BoxStatus;
import com.safeclock.enums.OrderStatus;
import com.safeclock.enums.TerminalStatus;
import com.safeclock.repository.SiteRepository;
import com.safeclock.repository.TerminalRepository;
import com.safeclock.repository.TerminalMetaDataRepository;
import com.safeclock.repository.PricingRepository;
import com.safeclock.service.BoxService;
import com.safeclock.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final SiteRepository siteRepository;
    private final TerminalRepository terminalRepository;
    private final TerminalMetaDataRepository terminalMetaDataRepository;
    private final PricingRepository pricingRepository;
    private final BoxService boxService;
    private final OrderService orderService;

    // ===== SITES =====
    @GetMapping("/sites")
    public ResponseEntity<ApiResponse<List<Site>>> getSites() {
        return ResponseEntity.ok(ApiResponse.ok(siteRepository.findAll()));
    }

    @PostMapping("/sites")
    public ResponseEntity<ApiResponse<Site>> createSite(@RequestBody Site site) {
        return ResponseEntity.ok(ApiResponse.ok("Site created", siteRepository.save(site)));
    }

    @PutMapping("/sites/{id}")
    public ResponseEntity<ApiResponse<Site>> updateSite(@PathVariable String id, @RequestBody Site site) {
        site.setId(id);
        return ResponseEntity.ok(ApiResponse.ok("Site updated", siteRepository.save(site)));
    }

    @DeleteMapping("/sites/{id}")
    public ResponseEntity<ApiResponse<String>> deleteSite(@PathVariable String id) {
        siteRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Site deleted", id));
    }

    // ===== TERMINALS =====
    @GetMapping("/terminals")
    public ResponseEntity<ApiResponse<List<Terminal>>> getTerminals() {
        return ResponseEntity.ok(ApiResponse.ok(terminalRepository.findAll()));
    }

    @PostMapping("/terminals")
    public ResponseEntity<ApiResponse<Terminal>> createTerminal(@RequestBody Terminal terminal) {
        terminal.setStatus(TerminalStatus.SET_UP_IN_PROGRESS);
        return ResponseEntity.ok(ApiResponse.ok("Terminal created", terminalRepository.save(terminal)));
    }

    @PutMapping("/terminals/{id}/status")
    public ResponseEntity<ApiResponse<Terminal>> updateTerminalStatus(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        TerminalStatus status = TerminalStatus.valueOf(body.get("status"));
        return terminalRepository.findById(id).map(t -> {
            t.setStatus(status);
            return ResponseEntity.ok(ApiResponse.ok("Status updated", terminalRepository.save(t)));
        }).orElseThrow(() -> new RuntimeException("Terminal not found"));
    }

    @PutMapping("/terminals/{id}")
    public ResponseEntity<ApiResponse<Terminal>> updateTerminal(@PathVariable String id, @RequestBody Terminal terminal) {
        terminal.setId(id);
        return ResponseEntity.ok(ApiResponse.ok("Terminal updated", terminalRepository.save(terminal)));
    }

    @DeleteMapping("/terminals/{id}")
    public ResponseEntity<ApiResponse<String>> deleteTerminal(@PathVariable String id) {
        // Cleanup all associated data
        terminalMetaDataRepository.findFirstByTerminalIdOrderByUpdatedAtDesc(id)
                .ifPresent(m -> terminalMetaDataRepository.deleteById(m.getId()));
        
        boxService.deleteBoxesByTerminal(id);
        
        terminalRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Terminal deleted", id));
    }

    // ===== TERMINAL METADATA =====
    @GetMapping("/terminals/{id}/metadata")
    public ResponseEntity<ApiResponse<TerminalMetaData>> getMetadata(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(
            terminalMetaDataRepository.findFirstByTerminalIdOrderByUpdatedAtDesc(id)
                .orElse(null)
        ));
    }

    @PostMapping("/terminals/{id}/metadata")
    public ResponseEntity<ApiResponse<TerminalMetaData>> saveMetadata(
            @PathVariable String id, @RequestBody TerminalMetaData meta) {
        TerminalMetaData existing = terminalMetaDataRepository.findFirstByTerminalIdOrderByUpdatedAtDesc(id).orElse(null);
        if (existing != null) {
            existing.setGridLayout(meta.getGridLayout());
            existing.setLayoutType(meta.getLayoutType());
            existing.setMaxPorts(meta.getMaxPorts());
            existing.setSkipPayment(meta.getSkipPayment());
            existing.setUpdatedAt(new Date());
            return ResponseEntity.ok(ApiResponse.ok("Metadata updated", terminalMetaDataRepository.save(existing)));
        } else {
            meta.setId(UUID.randomUUID().toString());
            meta.setTerminalId(id);
            meta.setCreatedAt(new Date());
            meta.setUpdatedAt(new Date());
            return ResponseEntity.ok(ApiResponse.ok("Metadata created", terminalMetaDataRepository.save(meta)));
        }
    }

    @PutMapping("/terminals/{id}/metadata")
    public ResponseEntity<ApiResponse<TerminalMetaData>> updateMetadata(
            @PathVariable String id, @RequestBody TerminalMetaData meta) {
        return saveMetadata(id, meta); // reuse upsert
    }

    // ===== BOX GENERATION =====
    @PostMapping("/terminals/{id}/generate-boxes")
    public ResponseEntity<ApiResponse<List<Box>>> generateBoxes(@PathVariable String id) {
        TerminalMetaData meta = terminalMetaDataRepository.findFirstByTerminalIdOrderByUpdatedAtDesc(id)
                .orElseThrow(() -> new RuntimeException("Terminal metadata not configured yet"));

        // Set terminal to ACTIVE
        terminalRepository.findById(id).ifPresent(t -> {
            t.setStatus(TerminalStatus.ACTIVE);
            terminalRepository.save(t);
        });

        List<Box> boxes = boxService.generateBoxesForTerminal(id, meta.getId());
        return ResponseEntity.ok(ApiResponse.ok("Boxes generated", boxes));
    }

    // ===== BOXES =====
    @GetMapping("/terminals/{id}/boxes")
    public ResponseEntity<ApiResponse<List<Box>>> getTerminalBoxes(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(boxService.getBoxesByTerminal(id)));
    }

    @PutMapping("/boxes/{boxId}/status")
    public ResponseEntity<ApiResponse<Box>> updateBoxStatus(
            @PathVariable String boxId, @RequestBody Map<String, String> body) {
        BoxStatus status = BoxStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(ApiResponse.ok("Box status updated", boxService.updateBoxStatus(boxId, status)));
    }

    // ===== PRICING =====
    @GetMapping("/pricing")
    public ResponseEntity<ApiResponse<List<Pricing>>> getPricing() {
        return ResponseEntity.ok(ApiResponse.ok(pricingRepository.findAll()));
    }

    @PostMapping("/pricing")
    public ResponseEntity<ApiResponse<Pricing>> createPricing(@RequestBody Pricing pricing) {
        pricing.setCreatedAt(new Date());
        pricing.setUpdatedAt(new Date());
        return ResponseEntity.ok(ApiResponse.ok("Pricing created", pricingRepository.save(pricing)));
    }

    @PutMapping("/pricing/{id}")
    public ResponseEntity<ApiResponse<Pricing>> updatePricing(@PathVariable String id, @RequestBody Pricing pricing) {
        pricing.setId(id);
        pricing.setUpdatedAt(new Date());
        return ResponseEntity.ok(ApiResponse.ok("Pricing updated", pricingRepository.save(pricing)));
    }

    // ===== ORDERS =====
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<Orders>>> getAllOrders() {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getAllOrders()));
    }

    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<Orders>> updateOrderStatus(
            @PathVariable String orderId, @RequestBody Map<String, String> body) {
        OrderStatus status = OrderStatus.valueOf(body.get("status"));
        Orders order = orderService.adminUpdateStatus(orderId, status);
        return ResponseEntity.ok(ApiResponse.ok("Order status updated", order));
    }
}
