package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.entity.ReturnOrder;
import com.baishun.service.ReturnOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/return-orders")
public class ReturnOrderController {

    @Autowired
    private ReturnOrderService returnOrderService;

    @GetMapping
    public Result<List<ReturnOrder>> search(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String returnType,
            @RequestParam(required = false) Long targetId) {
        return Result.success(returnOrderService.search(startDate, endDate, returnType, targetId));
    }

    @GetMapping("/{id}")
    public Result<ReturnOrder> getById(@PathVariable Long id) {
        ReturnOrder order = returnOrderService.getById(id);
        if (order == null) return Result.error("退货单不存在");
        return Result.success(order);
    }

    @PostMapping
    public Result<ReturnOrder> create(@RequestBody ReturnOrder order) {
        return Result.success(returnOrderService.create(order));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        returnOrderService.delete(id);
        return Result.success(null);
    }
}