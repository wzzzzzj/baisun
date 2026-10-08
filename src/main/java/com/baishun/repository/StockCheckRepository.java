package com.baishun.repository;

import com.baishun.entity.StockCheck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockCheckRepository extends JpaRepository<StockCheck, Long> {

    List<StockCheck> findAllByOrderByCheckDateDescIdDesc();
}
