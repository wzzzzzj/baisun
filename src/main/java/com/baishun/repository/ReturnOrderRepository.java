package com.baishun.repository;

import com.baishun.entity.ReturnOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReturnOrderRepository extends JpaRepository<ReturnOrder, Long> {

    List<ReturnOrder> findAllByOrderByOrderDateDescCreatedAtDesc();

    @Query("SELECT r FROM ReturnOrder r WHERE " +
           "(:startDate IS NULL OR r.orderDate >= :startDate) AND " +
           "(:endDate IS NULL OR r.orderDate <= :endDate) AND " +
           "(:returnType IS NULL OR r.returnType = :returnType) AND " +
           "(:targetId IS NULL OR r.targetId = :targetId) " +
           "ORDER BY r.orderDate DESC, r.createdAt DESC")
    List<ReturnOrder> search(@Param("startDate") LocalDate startDate,
                             @Param("endDate") LocalDate endDate,
                             @Param("returnType") String returnType,
                             @Param("targetId") Long targetId);

    @Query("SELECT r FROM ReturnOrder r WHERE r.returnType = :returnType ORDER BY r.orderDate DESC, r.createdAt DESC")
    List<ReturnOrder> findByReturnType(@Param("returnType") String returnType);
}