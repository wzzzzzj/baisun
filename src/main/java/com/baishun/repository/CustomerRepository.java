package com.baishun.repository;

import com.baishun.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findByNameContainingOrPhoneContainingOrderByIdDesc(String name, String phone);
}
