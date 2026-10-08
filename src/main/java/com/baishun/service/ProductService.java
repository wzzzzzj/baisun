package com.baishun.service;

import com.baishun.entity.Product;
import com.baishun.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public List<Product> search(String name) {
        if (name == null || name.isBlank()) {
            return productRepository.findAll();
        }
        return productRepository.findByNameContainingOrderByIdDesc(name);
    }

    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("商品不存在: " + id));
    }

    public Product save(Product product) {
        if (product.getCurrentStock() == null) product.setCurrentStock(BigDecimal.ZERO);
        if (product.getMinStock() == null) product.setMinStock(BigDecimal.ZERO);
        if (product.getStatus() == null) product.setStatus("NORMAL");
        return productRepository.save(product);
    }

    public Product update(Long id, Product product) {
        Product existing = findById(id);
        existing.setName(product.getName());
        existing.setSpec(product.getSpec());
        existing.setModel(product.getModel());
        existing.setThickness(product.getThickness());
        existing.setColor(product.getColor());
        existing.setLength(product.getLength());
        existing.setUnit(product.getUnit());
        existing.setCategory(product.getCategory());
        existing.setDefaultPurchasePrice(product.getDefaultPurchasePrice());
        existing.setDefaultSalePrice(product.getDefaultSalePrice());
        existing.setMinStock(product.getMinStock());
        existing.setCurrentStock(product.getCurrentStock());
        existing.setStatus(product.getStatus());
        existing.setRemark(product.getRemark());
        return productRepository.save(existing);
    }

    public void delete(Long id) {
        Product product = findById(id);
        if (product.getCurrentStock() != null
                && product.getCurrentStock().compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalArgumentException("商品还有库存，不能删除");
        }
        productRepository.delete(product);
    }

    public List<Product> findLowStock() {
        return productRepository.findLowStockProducts();
    }

    public List<Product> findSlowMoving() {
        return productRepository.findSlowMovingProducts();
    }
}
