package com.safeclock.repository;

import com.safeclock.entity.TokenTracker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface TokenTrackerRepository extends JpaRepository<TokenTracker, String> {
    Optional<TokenTracker> findTopByPhoneNumberAndVerifiedFalseOrderByExpiryTimeDesc(String phoneNumber);
    List<TokenTracker> findByPhoneNumberAndVerifiedFalseAndExpiryTimeAfter(String phoneNumber, Date after);
}
