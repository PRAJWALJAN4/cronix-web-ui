package com.safeclock.repository;

import com.safeclock.entity.Orders;
import com.safeclock.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrdersRepository extends JpaRepository<Orders, String> {
    List<Orders> findByUserId(String userId);
    List<Orders> findByUserIdAndStatus(String userId, OrderStatus status);
    List<Orders> findByTerminalId(String terminalId);
    List<Orders> findByBoxId(String boxId);
    Optional<Orders> findByBoxIdAndStatusIn(String boxId, List<OrderStatus> statuses);
    List<Orders> findByStatus(OrderStatus status);
}
