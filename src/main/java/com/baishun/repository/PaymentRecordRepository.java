package com.baishun.repository;

import com.baishun.entity.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {

    List<PaymentRecord> findByRelatedIdOrderByCreatedAtDesc(Long relatedId);

    List<PaymentRecord> findByDirectionOrderByCreatedAtDesc(String direction);

    List<PaymentRecord> findByPartyIdAndDirectionOrderByCreatedAtDesc(Long partyId, String direction);
}
