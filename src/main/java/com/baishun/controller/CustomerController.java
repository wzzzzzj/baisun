package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.entity.Customer;
import com.baishun.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @GetMapping
    public Result<List<Customer>> list(@RequestParam(required = false) String keyword) {
        return Result.success(customerService.search(keyword));
    }

    @GetMapping("/{id}")
    public Result<Customer> detail(@PathVariable Long id) {
        return Result.success(customerService.findById(id));
    }

    @PostMapping
    public Result<Customer> create(@RequestBody Customer customer) {
        return Result.success(customerService.save(customer));
    }

    @PutMapping("/{id}")
    public Result<Customer> update(@PathVariable Long id, @RequestBody Customer customer) {
        return Result.success(customerService.update(id, customer));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        customerService.delete(id);
        return Result.success();
    }
}
