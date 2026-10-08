package com.baishun.repository;

import com.baishun.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    List<Warehouse> findByNameContainingOrderByIdDesc(String name);
}
