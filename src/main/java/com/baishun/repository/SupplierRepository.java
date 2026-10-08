package com.baishun.repository;

import com.baishun.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    List<Supplier> findByNameContainingOrderByIdDesc(String name);

    List<Supplier> findByTypeOrderByIdDesc(String type);
}
