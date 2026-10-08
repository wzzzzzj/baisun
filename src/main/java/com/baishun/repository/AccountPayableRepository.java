package com.baishun.repository;

import com.baishun.entity.AccountPayable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface AccountPayableRepository extends JpaRepository<AccountPayable, Long> {

    List<AccountPayable> findBySupplierIdOrderByCreatedAtDesc(Long supplierId);

    List<AccountPayable> findByStatusOrderByCreatedAtDesc(String status);

    List<AccountPayable> findBySupplierIdAndStatusOrderByCreatedAtDesc(Long supplierId, String status);

    @Query("SELECT COALESCE(SUM(ap.unpaidAmount), 0) FROM AccountPayable ap WHERE ap.supplierId = :supplierId AND ap.status <> 'SETTLED'")
    BigDecimal sumUnpaidBySupplier(@Param("supplierId") Long supplierId);
}
