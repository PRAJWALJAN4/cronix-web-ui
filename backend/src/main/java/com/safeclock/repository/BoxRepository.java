package com.safeclock.repository;

import com.safeclock.entity.Box;
import com.safeclock.enums.BoxStatus;
import com.safeclock.enums.BoxType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoxRepository extends JpaRepository<Box, String> {

    List<Box> findByTerminalId(String terminalId);

    List<Box> findByTerminalIdAndBoxStatus(String terminalId, BoxStatus status);

    List<Box> findByTerminalIdAndType(String terminalId, BoxType type);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Box b WHERE b.id = :id")
    Optional<Box> findByIdWithLock(@Param("id") String id);
}
