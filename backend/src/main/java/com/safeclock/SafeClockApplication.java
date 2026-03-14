package com.safeclock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SafeClockApplication {
    public static void main(String[] args) {
        SpringApplication.run(SafeClockApplication.class, args);
    }
}
