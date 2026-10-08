package com.baishun.service;

import com.baishun.entity.Supplier;
import com.baishun.repository.SupplierRepository;
import com.baishun.repository.AccountPayableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private AccountPayableRepository accountPayableRepository;

    public List<Supplier> search(String name, String type) {
        List<Supplier> suppliers;
        if (type != null && !type.isBlank()) {
            suppliers = supplierRepository.findByTypeOrderByIdDesc(type);
        } else if (name != null && !name.isBlank()) {
            suppliers = supplierRepository.findByNameContainingOrderByIdDesc(name);
        } else {
            suppliers = supplierRepository.findAll();
        }
        for (Supplier s : suppliers) {
            BigDecimal unpaid = accountPayableRepository.sumUnpaidBySupplier(s.getId());
            s.setBalance(unpaid != null ? unpaid : BigDecimal.ZERO);
        }
        return suppliers;
    }

    public Supplier findById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("供应商不存在: " + id));
    }

    public Supplier save(Supplier supplier) {
        if (supplier.getType() == null) supplier.setType("FACTORY");
        return supplierRepository.save(supplier);
    }

    public Supplier update(Long id, Supplier supplier) {
        Supplier existing = findById(id);
        existing.setName(supplier.getName());
        existing.setType(supplier.getType());
        existing.setContactPerson(supplier.getContactPerson());
        existing.setPhone(supplier.getPhone());
        existing.setAddress(supplier.getAddress());
        existing.setRemark(supplier.getRemark());
        return supplierRepository.save(existing);
    }

    public void delete(Long id) {
        supplierRepository.delete(findById(id));
    }
}
