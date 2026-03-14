package com.safeclock.repository;

import com.safeclock.entity.Terminal;
import com.safeclock.enums.TerminalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TerminalRepository extends JpaRepository<Terminal, String> {
    List<Terminal> findByStatus(TerminalStatus status);
    List<Terminal> findBySiteIdRef(String siteId);
}
