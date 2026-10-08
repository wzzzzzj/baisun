package com.baishun.repository;

import com.baishun.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    List<SalesOrder> findByOrderDateBetweenOrderByOrderDateDescIdDesc(LocalDate start, LocalDate end);

    List<SalesOrder> findByOrderDateGreaterThanEqualOrderByOrderDateDescIdDesc(LocalDate startDate);

    List<SalesOrder> findByCustomerIdOrderByOrderDateDescIdDesc(Long customerId);

    List<SalesOrder> findByPayStatusOrderByOrderDateDescIdDesc(String payStatus);

    List<SalesOrder> findByOrderNoContainingOrderByOrderDateDescIdDesc(String orderNo);
}
