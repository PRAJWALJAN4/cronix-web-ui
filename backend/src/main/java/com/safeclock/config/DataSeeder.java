package com.safeclock.config;

import com.safeclock.entity.*;
import com.safeclock.enums.*;
import com.safeclock.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final SiteRepository siteRepository;
    private final TerminalRepository terminalRepository;
    private final TerminalMetaDataRepository terminalMetaDataRepository;
    private final BoxRepository boxRepository;
    private final PricingRepository pricingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedRoles();
        seedAdminUser();
        seedDemoData();
    }

    private void seedRoles() {
        if (roleRepository.count() == 0) {
            roleRepository.save(Role.builder().id("role-user").name("ROLE_USER").build());
            roleRepository.save(Role.builder().id("role-admin").name("ROLE_ADMIN").build());
            log.info("✅ Roles seeded");
        }
    }

    private void seedAdminUser() {
        if (!userRepository.existsByPhoneNumber("0000000000")) {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseThrow();
            Role userRole = roleRepository.findByName("ROLE_USER").orElseThrow();

            User admin = User.builder()
                    .phoneNumber("0000000000")
                    .name("SafeCloak Admin")
                    .email("admin@safeclock.com")
                    .password(passwordEncoder.encode("admin123"))
                    .verified(true)
                    .enabled(true)
                    .roles(Set.of(adminRole, userRole))
                    .build();
            userRepository.save(admin);
            log.info("✅ Admin user seeded: phone=0000000000, password=admin123");
        }
    }

    private void seedDemoData() {
        if (siteRepository.count() == 0) {
            // Create pricing
            Pricing pricing = Pricing.builder()
                    .name("Standard Pricing")
                    .config("{\"small\":30,\"medium\":50,\"large\":80,\"extraLarge\":120,\"excessPerHour\":20}")
                    .createdAt(new Date())
                    .updatedAt(new Date())
                    .createdBy("system")
                    .updatedBy("system")
                    .build();
            pricing = pricingRepository.save(pricing);

            // Create site
            Site site = Site.builder()
                    .name("Koramangala Mall")
                    .address("80 Feet Road, Koramangala, Bengaluru")
                    .state("Karnataka")
                    .pincode(560034)
                    .latitude(12.9352)
                    .longitude(77.6245)
                    .build();
            site = siteRepository.save(site);

            // Create terminal
            Terminal terminal = Terminal.builder()
                    .identifiableName("Mall Terminal A")
                    .description("Main entrance locker terminal")
                    .siteIdRef(site.getId())
                    .physicalLocation("Ground Floor, Near Main Entrance")
                    .status(TerminalStatus.ACTIVE)
                    .build();
            terminal = terminalRepository.save(terminal);

            // Create metadata
            String metaId = UUID.randomUUID().toString();
            TerminalMetaData meta = TerminalMetaData.builder()
                    .id(metaId)
                    .terminalId(terminal.getId())
                    .layoutType(TerminalLayoutType.FIVEBYFOUR)
                    .maxPorts(20)
                    .enabled(true)
                    .status(TerminalStatus.ACTIVE)
                    .skipPayment(true)
                    .pricingIdRef(pricing.getId())
                    .partialPickupCharge(10.0)
                    .createdAt(new Date())
                    .updatedAt(new Date())
                    .build();
            meta = terminalMetaDataRepository.save(meta);

            // Generate 20 boxes (5x4 layout)
            generateBoxes(terminal.getId(), metaId);

            // Create a second terminal
            Terminal terminal2 = Terminal.builder()
                    .identifiableName("Food Court Terminal B")
                    .description("Food court level locker terminal")
                    .siteIdRef(site.getId())
                    .physicalLocation("First Floor, Food Court Entrance")
                    .status(TerminalStatus.ACTIVE)
                    .build();
            terminal2 = terminalRepository.save(terminal2);

            String meta2Id = UUID.randomUUID().toString();
            TerminalMetaData meta2 = TerminalMetaData.builder()
                    .id(meta2Id)
                    .terminalId(terminal2.getId())
                    .layoutType(TerminalLayoutType.FIVEBYFOUR)
                    .maxPorts(20)
                    .enabled(true)
                    .status(TerminalStatus.ACTIVE)
                    .skipPayment(true)
                    .pricingIdRef(pricing.getId())
                    .createdAt(new Date())
                    .updatedAt(new Date())
                    .build();
            terminalMetaDataRepository.save(meta2);
            generateBoxes(terminal2.getId(), meta2Id);

            log.info("✅ Demo data seeded: 1 site, 2 terminals, 40 boxes total");
        }
    }

    private void generateBoxes(String terminalId, String metaId) {
        String[] rowLabels = {"A", "B", "C", "D"};
        int cols = 5;
        int port = 1;

        for (int row = 0; row < 4; row++) {
            for (int col = 1; col <= cols; col++) {
                String name = rowLabels[row] + "-" + col;
                BoxType type;
                if (row == 0) type = BoxType.LARGE;
                else if (row == 1) type = BoxType.MEDIUM;
                else if (row == 3) type = BoxType.EXTRA_LARGE;
                else type = BoxType.SMALL;

                Box box = Box.builder()
                        .terminalId(terminalId)
                        .terminalMetaDataId(metaId)
                        .identifiableName(name)
                        .col(col)
                        .rw(row + 1)
                        .boxStatus(BoxStatus.EMPTY_CLOSED)
                        .type(type)
                        .port(port++)
                        .updatedDate(new Date())
                        .build();
                boxRepository.save(box);
            }
        }
    }
}
