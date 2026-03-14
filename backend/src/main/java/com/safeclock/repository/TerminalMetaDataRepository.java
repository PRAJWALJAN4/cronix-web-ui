package com.safeclock.repository;

import com.safeclock.entity.TerminalMetaData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TerminalMetaDataRepository extends JpaRepository<TerminalMetaData, String> {
    Optional<TerminalMetaData> findFirstByTerminalIdOrderByUpdatedAtDesc(String terminalId);
    java.util.List<TerminalMetaData> findAllByTerminalId(String terminalId); // for cleaning up
}
