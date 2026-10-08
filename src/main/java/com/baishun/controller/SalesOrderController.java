package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.entity.SalesOrder;
import com.baishun.service.SalesOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sales-orders")
public class SalesOrderController {

    @Autowired
    private SalesOrderService salesOrderService;

    @GetMapping
    public Result<List<SalesOrder>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String payStatus) {
        return Result.success(salesOrderService.search(startDate, endDate, customerId, payStatus));
    }

    @GetMapping("/{id}")
    public Result<SalesOrder> detail(@PathVariable Long id) {
        return Result.success(salesOrderService.findById(id));
    }

    @PostMapping
    public Result<SalesOrder> create(@RequestBody SalesOrder order) {
        return Result.success(salesOrderService.create(order));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        salesOrderService.delete(id);
        return Result.success();
    }
}
