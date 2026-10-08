package com.baishun.repository;

import com.baishun.entity.WarehouseStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, Long> {
    List<WarehouseStock> findByProductIdOrderByWarehouseNameAsc(Long productId);
    List<WarehouseStock> findByWarehouseIdOrderByProductNameAsc(Long warehouseId);
    Optional<WarehouseStock> findByProductIdAndWarehouseId(Long productId, Long warehouseId);

    @Query("SELECT COALESCE(SUM(ws.quantity), 0) FROM WarehouseStock ws WHERE ws.warehouseId = :warehouseId")
    BigDecimal sumQuantityByWarehouseId(@Param("warehouseId") Long warehouseId);
}
