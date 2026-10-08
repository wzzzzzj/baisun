package com.baishun.service;

import com.baishun.entity.Customer;
import com.baishun.repository.CustomerRepository;
import com.baishun.repository.AccountReceivableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AccountReceivableRepository accountReceivableRepository;

    public List<Customer> search(String keyword) {
        List<Customer> customers;
        if (keyword == null || keyword.isBlank()) {
            customers = customerRepository.findAll();
        } else {
            customers = customerRepository.findByNameContainingOrPhoneContainingOrderByIdDesc(keyword, keyword);
        }
        for (Customer c : customers) {
            BigDecimal unpaid = accountReceivableRepository.sumUnpaidByCustomer(c.getId());
            c.setBalance(unpaid != null ? unpaid : BigDecimal.ZERO);
        }
        return customers;
    }

    public Customer findById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("客户不存在: " + id));
    }

    public Customer save(Customer customer) {
        return customerRepository.save(customer);
    }

    public Customer update(Long id, Customer customer) {
        Customer existing = findById(id);
        existing.setName(customer.getName());
        existing.setPhone(customer.getPhone());
        existing.setAddress(customer.getAddress());
        existing.setRemark(customer.getRemark());
        return customerRepository.save(existing);
    }

    public void delete(Long id) {
        customerRepository.delete(findById(id));
    }
}
