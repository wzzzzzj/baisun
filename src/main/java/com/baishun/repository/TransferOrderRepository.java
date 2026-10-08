package com.baishun.repository;

import com.baishun.entity.TransferOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TransferOrderRepository extends JpaRepository<TransferOrder, Long> {

    List<TransferOrder> findByOrderDateBetweenOrderByOrderDateDescIdDesc(LocalDate start, LocalDate end);

    List<TransferOrder> findBySupplierIdOrderByOrderDateDescIdDesc(Long supplierId);

    List<TransferOrder> findByPayStatusOrderByOrderDateDescIdDesc(String payStatus);

    List<TransferOrder> findByOrderNoContainingOrderByOrderDateDescIdDesc(String orderNo);
}
