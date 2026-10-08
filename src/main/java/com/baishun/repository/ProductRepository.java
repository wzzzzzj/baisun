package com.baishun.repository;

import com.baishun.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByNameContainingOrderByIdDesc(String name);

    List<Product> findByStatusOrderByIdDesc(String status);

    @Query("SELECT p FROM Product p WHERE p.currentStock <= p.minStock AND p.minStock > 0 ORDER BY p.currentStock ASC")
    List<Product> findLowStockProducts();

    @Query("SELECT p FROM Product p WHERE p.currentStock > 0 AND p.status = 'SLOW_MOVING' ORDER BY p.currentStock DESC")
    List<Product> findSlowMovingProducts();
}
