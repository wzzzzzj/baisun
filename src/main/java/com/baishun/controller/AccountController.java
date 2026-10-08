package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.dto.PaymentDTO;
import com.baishun.entity.AccountPayable;
import com.baishun.entity.AccountReceivable;
import com.baishun.entity.PaymentRecord;
import com.baishun.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @GetMapping("/receivables")
    public Result<List<AccountReceivable>> receivables(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String status) {
        return Result.success(accountService.findReceivables(customerId, status));
    }

    @GetMapping("/payables")
    public Result<List<AccountPayable>> payables(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String status) {
        return Result.success(accountService.findPayables(supplierId, status));
    }

    @PostMapping("/payment")
    public Result<?> recordPayment(@RequestBody PaymentDTO dto) {
        accountService.recordPayment(dto);
        return Result.success();
    }

    @GetMapping("/{id}/payments")
    public Result<List<PaymentRecord>> paymentHistory(@PathVariable Long id) {
        return Result.success(accountService.getPaymentHistory(id));
    }
}
