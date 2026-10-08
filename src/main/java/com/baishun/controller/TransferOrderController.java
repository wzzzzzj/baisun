package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.entity.TransferOrder;
import com.baishun.service.TransferOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transfer-orders")
public class TransferOrderController {

    @Autowired
    private TransferOrderService transferOrderService;

    @GetMapping
    public Result<List<TransferOrder>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String payStatus) {
        return Result.success(transferOrderService.search(startDate, endDate, supplierId, payStatus));
    }

    @GetMapping("/{id}")
    public Result<TransferOrder> detail(@PathVariable Long id) {
        return Result.success(transferOrderService.findById(id));
    }

    @PostMapping
    public Result<TransferOrder> create(@RequestBody TransferOrder order) {
        return Result.success(transferOrderService.create(order));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        transferOrderService.delete(id);
        return Result.success();
    }
}
