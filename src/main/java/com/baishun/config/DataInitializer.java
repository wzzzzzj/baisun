package com.baishun.config;

import com.baishun.entity.*;
import com.baishun.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Override
    public void run(String... args) {
        if (productRepository.count() == 0) {
            initSampleData();
        }
    }

    private void initSampleData() {
        // 仓库
        Warehouse w1 = new Warehouse();
        w1.setName("主仓库");
        w1.setCode("WH01");
        w1.setLocation("厂区A栋");
        warehouseRepository.save(w1);

        Warehouse w2 = new Warehouse();
        w2.setName("东库");
        w2.setCode("WH02");
        w2.setLocation("厂区B栋");
        warehouseRepository.save(w2);

        // 供应商
        Supplier s1 = new Supplier();
        s1.setName("南海铝业");
        s1.setType("FACTORY");
        s1.setContactPerson("陈总");
        s1.setPhone("13800001111");
        s1.setAddress("佛山南海区");
        supplierRepository.save(s1);

        Supplier s2 = new Supplier();
        s2.setName("大沥建材市场B摊");
        s2.setType("MARKET");
        s2.setContactPerson("刘姐");
        s2.setPhone("13800002222");
        s2.setAddress("佛山大沥镇");
        supplierRepository.save(s2);

        // 客户
        Customer c1 = new Customer();
        c1.setName("顺德门窗厂");
        c1.setPhone("13900003333");
        c1.setAddress("佛山顺德区");
        customerRepository.save(c1);

        Customer c2 = new Customer();
        c2.setName("禅城装饰店");
        c2.setPhone("13900004444");
        c2.setAddress("佛山禅城区");
        customerRepository.save(c2);

        // 商品 - 铝合金建材
        Product p1 = new Product();
        p1.setName("铝合金型材");
        p1.setSpec("门窗料");
        p1.setModel("6063");
        p1.setThickness("1.2mm");
        p1.setLength("6m");
        p1.setUnit("根");
        p1.setCategory("门窗型材");
        p1.setDefaultPurchasePrice(new BigDecimal("25.00"));
        p1.setDefaultSalePrice(new BigDecimal("38.00"));
        p1.setMinStock(new BigDecimal("50"));
        p1.setCurrentStock(BigDecimal.ZERO);
        productRepository.save(p1);

        Product p2 = new Product();
        p2.setName("铝合金型材");
        p2.setSpec("门窗料");
        p2.setModel("6063");
        p2.setThickness("1.4mm");
        p2.setLength("6m");
        p2.setUnit("根");
        p2.setCategory("门窗型材");
        p2.setDefaultPurchasePrice(new BigDecimal("32.00"));
        p2.setDefaultSalePrice(new BigDecimal("48.00"));
        p2.setMinStock(new BigDecimal("30"));
        p2.setCurrentStock(BigDecimal.ZERO);
        productRepository.save(p2);

        Product p3 = new Product();
        p3.setName("铝板");
        p3.setSpec("纯铝板");
        p3.setModel("1060");
        p3.setThickness("2.0mm");
        p3.setLength("1.2m");
        p3.setUnit("公斤");
        p3.setCategory("板材");
        p3.setDefaultPurchasePrice(new BigDecimal("18.00"));
        p3.setDefaultSalePrice(new BigDecimal("25.00"));
        p3.setMinStock(new BigDecimal("200"));
        p3.setCurrentStock(BigDecimal.ZERO);
        productRepository.save(p3);

        Product p4 = new Product();
        p4.setName("铝合金方管");
        p4.setSpec("方管");
        p4.setModel("4040");
        p4.setThickness("1.0mm");
        p4.setLength("6m");
        p4.setUnit("根");
        p4.setCategory("管材");
        p4.setDefaultPurchasePrice(new BigDecimal("22.00"));
        p4.setDefaultSalePrice(new BigDecimal("35.00"));
        p4.setMinStock(new BigDecimal("20"));
        p4.setCurrentStock(BigDecimal.ZERO);
        productRepository.save(p4);
    }
}
