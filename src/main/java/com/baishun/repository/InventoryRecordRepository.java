package com.baishun.repository;

import com.baishun.entity.InventoryRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface InventoryRecordRepository extends JpaRepository<InventoryRecord, Long> {

    List<InventoryRecord> findByProductIdOrderByCreatedAtDesc(Long productId);

    List<InventoryRecord> findByRecordDateBetweenOrderByCreatedAtDesc(LocalDate start, LocalDate end);

    List<InventoryRecord> findByRecordTypeOrderByCreatedAtDesc(String recordType);

    List<InventoryRecord> findByProductIdAndWarehouseIdOrderByCreatedAtDesc(Long productId, Long warehouseId);
}
