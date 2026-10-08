package com.baishun.common;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

public class OrderNoGenerator {

    private static final DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final AtomicInteger purchaseSeq = new AtomicInteger(0);
    private static final AtomicInteger transferSeq = new AtomicInteger(0);
    private static final AtomicInteger salesSeq = new AtomicInteger(0);
    private static final AtomicInteger returnSeq = new AtomicInteger(0);
    private static String lastPurchaseDate = "";
    private static String lastTransferDate = "";
    private static String lastSalesDate = "";
    private static String lastReturnDate = "";

    public static String generatePurchaseNo() {
        return generate("JH", purchaseSeq, ref -> lastPurchaseDate = ref);
    }

    public static String generateTransferNo() {
        return generate("DH", transferSeq, ref -> lastTransferDate = ref);
    }

    public static String generateSalesNo() {
        return generate("FH", salesSeq, ref -> lastSalesDate = ref);
    }

    public static String generateReturnNo() {
        return generate("TH", returnSeq, ref -> lastReturnDate = ref);
    }

    private static String generate(String prefix, AtomicInteger seq, java.util.function.Consumer<String> dateSetter) {
        String today = LocalDateTime.now().format(fmt);
        String lastDate;
        switch (prefix) {
            case "JH": lastDate = lastPurchaseDate; break;
            case "DH": lastDate = lastTransferDate; break;
            case "FH": lastDate = lastSalesDate; break;
            case "TH": lastDate = lastReturnDate; break;
            default: lastDate = "";
        }
        if (!today.equals(lastDate)) {
            seq.set(0);
            dateSetter.accept(today);
        }
        int num = seq.incrementAndGet();
        return prefix + today + String.format("%04d", num);
    }
}