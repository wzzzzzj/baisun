package com.baishun.repository;

import com.baishun.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    List<PurchaseOrder> findByOrderDateBetweenOrderByOrderDateDescIdDesc(LocalDate start, LocalDate end);

    List<PurchaseOrder> findByOrderDateGreaterThanEqualOrderByOrderDateDescIdDesc(LocalDate startDate);

    List<PurchaseOrder> findBySupplierIdOrderByOrderDateDescIdDesc(Long supplierId);

    List<PurchaseOrder> findByPayStatusOrderByOrderDateDescIdDesc(String payStatus);

    List<PurchaseOrder> findByOrderNoContainingOrderByOrderDateDescIdDesc(String orderNo);
}
