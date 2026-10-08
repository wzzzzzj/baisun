package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.entity.PurchaseOrder;
import com.baishun.service.PurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @GetMapping
    public Result<List<PurchaseOrder>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String payStatus) {
        return Result.success(purchaseOrderService.search(startDate, endDate, supplierId, payStatus));
    }

    @GetMapping("/{id}")
    public Result<PurchaseOrder> detail(@PathVariable Long id) {
        return Result.success(purchaseOrderService.findById(id));
    }

    @PostMapping
    public Result<PurchaseOrder> create(@RequestBody PurchaseOrder order) {
        return Result.success(purchaseOrderService.create(order));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        purchaseOrderService.delete(id);
        return Result.success();
    }
}
