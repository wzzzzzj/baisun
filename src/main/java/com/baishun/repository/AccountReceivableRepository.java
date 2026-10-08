package com.baishun.repository;

import com.baishun.entity.AccountReceivable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface AccountReceivableRepository extends JpaRepository<AccountReceivable, Long> {

    List<AccountReceivable> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<AccountReceivable> findByStatusOrderByCreatedAtDesc(String status);

    List<AccountReceivable> findByCustomerIdAndStatusOrderByCreatedAtDesc(Long customerId, String status);

    @Query("SELECT COALESCE(SUM(ar.unpaidAmount), 0) FROM AccountReceivable ar WHERE ar.customerId = :customerId AND ar.status <> 'SETTLED'")
    BigDecimal sumUnpaidByCustomer(@Param("customerId") Long customerId);
}
