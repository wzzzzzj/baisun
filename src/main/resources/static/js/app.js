/* ============================================
   百顺 - 进销存财务系统
   前端应用核心
   ============================================ */

'use strict';

/* ===== 配置常量 ===== */
var API_BASE = '';
var STORAGE_KEY = 'baishun_state';

/* 支付方式映射 */
var PAY_METHOD_MAP = {
    WECHAT: '微信',
    ALIPAY: '支付宝',
    BANK: '银行转账',
    CASH: '现金',
    MONTHLY: '月结'
};

/* 供应商类型映射 */
var SUPPLIER_TYPE_MAP = {
    FACTORY: '厂家',
    MARKET: '市场'
};

/* 调货类型映射 */
var TRANSFER_TYPE_MAP = {
    NORMAL: '正常调货',
    EXCHANGE: '换货',
    MAKEUP: '补货',
    TEMP_LOAN: '暂借'
};

/* 退货类型映射 */
var RETURN_TYPE_MAP = {
    SUPPLIER: '退给供应商',
    CUSTOMER: '客户退货'
};

/* 发货方式映射 */
var DELIVERY_METHOD_MAP = {
    SELF_PICKUP: '自提',
    DELIVERY: '配送',
    LOGISTICS: '物流'
};

/* 盘点类型映射 */
var CHECK_TYPE_MAP = {
    DAILY: '日盘',
    MONTHLY: '月盘'
};

/* 库存记录类型映射 */
var RECORD_TYPE_MAP = {
    PURCHASE_IN: '厂家进货入库',
    TRANSFER_IN: '市场调货入库',
    SALES_OUT: '客户发货出库',
    RETURN_IN: '客户退货入库',
    RETURN_OUT: '退货给供应商出库',
    RETURN_OUT_REVERSE: '退货删除回库',
    RETURN_IN_REVERSE: '退货删除出库',
    CHECK_GAIN: '盘盈',
    CHECK_LOSS: '盘亏'
};

/* ===== 工具函数 ===== */
var Utils = {
    /* 格式化金额 */
    formatMoney: function(num) {
        if (num === null || num === undefined || num === '') return '0.00';
        var n = parseFloat(num);
        if (isNaN(n)) return '0.00';
        return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    /* 格式化日期 YYYY-MM-DD */
    formatDate: function(date) {
        if (!date) return '';
        var d = new Date(date);
        if (isNaN(d.getTime())) return date;
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    },

    /* 格式化日期时间 */
    formatDateTime: function(date) {
        if (!date) return '';
        var d = new Date(date);
        if (isNaN(d.getTime())) return date;
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        var h = String(d.getHours()).padStart(2, '0');
        var min = String(d.getMinutes()).padStart(2, '0');
        return y + '-' + m + '-' + day + ' ' + h + ':' + min;
    },

    /* 今天日期 */
    today: function() {
        return this.formatDate(new Date());
    },

    /* HTML转义 */
    escapeHtml: function(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    /* 渲染仓库分配信息 */
    renderAllocations: function(item) {
        if (!item.allocations) return '';
        var allocs;
        try { allocs = JSON.parse(item.allocations); } catch(e) { return ''; }
        if (!allocs || allocs.length === 0) return '';
        var html = '<div class="text-xs mt-2" style="color:var(--primary);">';
        html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px;margin-right:2px;"><path d="M3 9l1-5h16l1 5M5 9v11h14V9M9 14h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        allocs.forEach(function(a, i) {
            if (i > 0) html += '、';
            html += Utils.escapeHtml(a.warehouseName || '') + ': ' + a.quantity;
        });
        html += '</div>';
        return html;
    },

    /* 构建URL查询参数 */
    buildQuery: function(params) {
        var parts = [];
        for (var key in params) {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
            }
        }
        return parts.length ? '?' + parts.join('&') : '';
    },

    /* 防抖 */
    debounce: function(fn, delay) {
        var timer = null;
        return function() {
            var args = arguments;
            var ctx = this;
            clearTimeout(timer);
            timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
        };
    },

    /* 安全获取数字 */
    toNumber: function(val) {
        var n = parseFloat(val);
        return isNaN(n) ? 0 : n;
    }
};

/* ===== API 模块 ===== */
var Api = {
    request: function(method, url, body) {
        var options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
            options.body = JSON.stringify(body);
        }
        return fetch(API_BASE + url, options).then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            return response.json();
        }).then(function(result) {
            if (result.code !== 200) {
                throw new Error(result.message || '请求失败');
            }
            return result.data;
        }).catch(function(err) {
            if (err.name === 'TypeError' && err.message.indexOf('Failed to fetch') >= 0) {
                throw new Error('网络连接失败，请检查网络');
            }
            throw err;
        });
    },

    get: function(url, params) {
        var query = params ? Utils.buildQuery(params) : '';
        return this.request('GET', url + query);
    },

    post: function(url, body) {
        return this.request('POST', url, body);
    },

    put: function(url, body) {
        return this.request('PUT', url, body);
    },

    delete: function(url) {
        return this.request('DELETE', url);
    }
};

/* ===== UI 模块 ===== */
var UI = {
    /* Toast 提示 */
    toast: function(message, type, duration) {
        type = type || 'info';
        duration = duration || 2500;
        var container = document.getElementById('toast-container');
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        var icons = { success: '\u2713', error: '\u2717', warning: '\u26a0', info: '\u2139' };
        toast.innerHTML = '<span style="font-size:16px">' + (icons[type] || '') + '</span><span>' + Utils.escapeHtml(message) + '</span>';
        container.appendChild(toast);
        setTimeout(function() {
            toast.classList.add('toast-out');
            setTimeout(function() { toast.remove(); }, 300);
        }, duration);
    },

    showLoading: function() {
        document.getElementById('loading-overlay').style.display = 'flex';
    },

    hideLoading: function() {
        document.getElementById('loading-overlay').style.display = 'none';
    },

    showModal: function(title, bodyHtml, footerHtml) {
        var overlay = document.getElementById('modal-overlay');
        var container = document.getElementById('modal-container');
        container.innerHTML =
            '<div class="modal-header">' +
                '<span class="modal-title">' + Utils.escapeHtml(title) + '</span>' +
                '<button class="modal-close" onclick="UI.hideModal()">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' + bodyHtml + '</div>' +
            (footerHtml ? '<div class="modal-footer">' + footerHtml + '</div>' : '');
        overlay.style.display = 'flex';
        overlay.onclick = function(e) {
            if (e.target === overlay) UI.hideModal();
        };
    },

    hideModal: function() {
        document.getElementById('modal-overlay').style.display = 'none';
        document.getElementById('modal-container').innerHTML = '';
    },

    confirm: function(message, onConfirm) {
        this.showModal('确认操作',
            '<p style="font-size:15px;line-height:1.6;padding:8px 0;">' + Utils.escapeHtml(message) + '</p>',
            '<button class="btn btn-gray" style="flex:1" onclick="UI.hideModal()">取消</button>' +
            '<button class="btn btn-danger" style="flex:1" id="confirm-yes-btn">确定</button>'
        );
        document.getElementById('confirm-yes-btn').onclick = function() {
            UI.hideModal();
            onConfirm();
        };
    },

    setContent: function(html) {
        document.getElementById('app-content').innerHTML = html;
    },

    setTitle: function(title) {
        document.getElementById('header-title').textContent = title;
    },

    showBack: function(show) {
        document.getElementById('back-btn').style.display = show ? 'flex' : 'none';
    },

    setHeaderAction: function(text, onClick) {
        var btn = document.getElementById('header-action-btn');
        if (text) {
            btn.textContent = text;
            btn.style.visibility = 'visible';
            btn.onclick = onClick;
        } else {
            btn.style.visibility = 'hidden';
            btn.onclick = null;
        }
    },

    showBottomNav: function(show) {
        document.getElementById('bottom-nav').style.display = show ? 'flex' : 'none';
    },

    setActiveNav: function(page) {
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.classList.toggle('active', item.dataset.page === page);
        });
    },

    emptyState: function(text, actionHtml) {
        return '<div class="empty-state">' +
            '<svg width="64" height="64" viewBox="0 0 24 24" fill="none">' +
                '<path d="M3 3v18h18M7 14l3-3 3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
            '<p class="empty-state-text">' + Utils.escapeHtml(text) + '</p>' +
            (actionHtml || '') +
        '</div>';
    },

    loadingHtml: function(text) {
        text = text || '加载中...';
        return '<div class="loading-inline"><div class="spinner"></div><p>' + Utils.escapeHtml(text) + '</p></div>';
    },

    errorState: function(message, retryFn) {
        return '<div class="empty-state">' +
            '<svg width="56" height="56" viewBox="0 0 24 24" fill="none">' +
                '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>' +
                '<path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
            '</svg>' +
            '<p class="empty-state-text">' + Utils.escapeHtml(message) + '</p>' +
            (retryFn ? '<button class="btn btn-outline" onclick="' + retryFn + '">重试</button>' : '') +
        '</div>';
    }
};

/* ===== 状态徽章工具 ===== */
var BadgeHelper = {
    payStatus: function(status) {
        var map = {
            UNPAID: { text: '未付', cls: 'badge-danger' },
            PARTIAL: { text: '部分', cls: 'badge-warning' },
            SETTLED: { text: '已结', cls: 'badge-success' },
            PAID: { text: '已付', cls: 'badge-success' }
        };
        var s = map[status] || { text: status || '未知', cls: 'badge-gray' };
        return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
    },

    payMethod: function(method) {
        return '<span class="badge badge-gray">' + (PAY_METHOD_MAP[method] || method || '-') + '</span>';
    },

    supplierType: function(type) {
        var map = {
            FACTORY: { text: '厂家', cls: 'badge-primary' },
            MARKET: { text: '市场', cls: 'badge-info' }
        };
        var s = map[type] || { text: type || '-', cls: 'badge-gray' };
        return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
    },

    transferType: function(type) {
        var map = {
            NORMAL: { text: '正常调货', cls: 'badge-primary' },
            EXCHANGE: { text: '换货', cls: 'badge-info' },
            MAKEUP: { text: '补货', cls: 'badge-warning' },
            TEMP_LOAN: { text: '暂借', cls: 'badge-gray' }
        };
        var s = map[type] || { text: type || '-', cls: 'badge-gray' };
        return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
    },

    deliveryMethod: function(method) {
        var map = {
            SELF_PICKUP: { text: '自提', cls: 'badge-gray' },
            DELIVERY: { text: '配送', cls: 'badge-primary' },
            LOGISTICS: { text: '物流', cls: 'badge-info' }
        };
        var s = map[method] || { text: method || '-', cls: 'badge-gray' };
        return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
    },

    accountStatus: function(status) {
        var map = {
            UNPAID: { text: '未付', cls: 'badge-danger' },
            PARTIAL: { text: '部分付款', cls: 'badge-warning' },
            SETTLED: { text: '已结清', cls: 'badge-success' }
        };
        var s = map[status] || { text: status || '未知', cls: 'badge-gray' };
        return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
    },

    productStatus: function(status) {
        var map = {
            ACTIVE: { text: '启用', cls: 'badge-success' },
            INACTIVE: { text: '停用', cls: 'badge-gray' }
        };
        var s = map[status] || { text: status || '未知', cls: 'badge-gray' };
        return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
    },

    checkType: function(type) {
        var map = {
            DAILY: { text: '日盘', cls: 'badge-primary' },
            MONTHLY: { text: '月盘', cls: 'badge-info' }
        };
        var s = map[type] || { text: type || '-', cls: 'badge-gray' };
        return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
    },

    returnType: function(type) {
        var map = {
            SUPPLIER: { text: '退给供应商', cls: 'badge-warning' },
            CUSTOMER: { text: '客户退货', cls: 'badge-info' }
        };
        var s = map[type] || { text: type || '-', cls: 'badge-gray' };
        return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
    }
};

/* ===== 缓存数据 ===== */
var Cache = {
    products: [],
    suppliers: [],
    customers: [],
    warehouses: [],

    loadProducts: function() {
        var self = this;
        return Api.get('/api/products').then(function(data) {
            self.products = data || [];
            return self.products;
        }).catch(function() {
            self.products = [];
            return [];
        });
    },

    loadWarehouses: function() {
        var self = this;
        return Api.get('/api/warehouses').then(function(data) {
            self.warehouses = data || [];
            return self.warehouses;
        }).catch(function() {
            self.warehouses = [];
            return [];
        });
    },

    warehouseOptions: function(selectedId) {
        return this.warehouses.map(function(w) {
            return '<option value="' + w.id + '" ' + (w.id === selectedId ? 'selected' : '') + '>' +
                Utils.escapeHtml(w.name) + (w.code ? ' (' + Utils.escapeHtml(w.code) + ')' : '') + '</option>';
        }).join('');
    },

    loadSuppliers: function(type) {
        var self = this;
        return Api.get('/api/suppliers', { type: type }).then(function(data) {
            self.suppliers = data || [];
            return self.suppliers;
        }).catch(function() {
            self.suppliers = [];
            return [];
        });
    },

    loadCustomers: function() {
        var self = this;
        return Api.get('/api/customers').then(function(data) {
            self.customers = data || [];
            return self.customers;
        }).catch(function() {
            self.customers = [];
            return [];
        });
    },

    productOptions: function(selectedId) {
        return this.products.map(function(p) {
            return '<option value="' + p.id + '" ' + (p.id === selectedId ? 'selected' : '') + '>' +
                Utils.escapeHtml(p.name) + (p.spec ? ' (' + Utils.escapeHtml(p.spec) + ')' : '') + '</option>';
        }).join('');
    },

    supplierOptions: function(selectedId, type) {
        var list = this.suppliers;
        if (type) list = list.filter(function(s) { return s.type === type; });
        return list.map(function(s) {
            return '<option value="' + s.id + '" ' + (s.id === selectedId ? 'selected' : '') + '>' +
                Utils.escapeHtml(s.name) + '</option>';
        }).join('');
    },

    customerOptions: function(selectedId) {
        return this.customers.map(function(c) {
            return '<option value="' + c.id + '" ' + (c.id === selectedId ? 'selected' : '') + '>' +
                Utils.escapeHtml(c.name) + '</option>';
        }).join('');
    }
};

/* ===== 路由与状态管理 ===== */
var Router = {
    currentTab: 'dashboard',
    navStack: [],
    _restoring: false,

    switchTab: function(tab) {
        this.currentTab = tab;
        this.navStack = [];
        UI.showBack(false);
        UI.showBottomNav(true);
        UI.setHeaderAction(null);
        UI.setActiveNav(tab);

        if (tab === 'dashboard') Pages.dashboard();
        else if (tab === 'purchase') Pages.purchaseOrders();
        else if (tab === 'sales') Pages.salesOrders();
        else if (tab === 'inventory') Pages.inventory();
        else if (tab === 'transfer') Pages.transferOrders();
        else if (tab === 'return') Pages.returnOrders();
        else if (tab === 'more') Pages.more();
    },

    navigate: function(pageFn, title) {
        if (this._restoring) return;
        this.navStack.push({ pageFn: pageFn, title: title });
        UI.showBack(true);
        UI.setActiveNav('');
    },

    goBack: function() {
        if (this.navStack.length > 0) {
            this.navStack.pop();
            if (this.navStack.length === 0) {
                this.switchTab(this.currentTab);
            } else {
                var prev = this.navStack[this.navStack.length - 1];
                this._restoring = true;
                prev.pageFn();
                this._restoring = false;
            }
        } else {
            this.switchTab(this.currentTab);
        }
    }
};

/* ===== 页面渲染器 ===== */
var Pages = {
    _invTab: 'products',
    _invProducts: [],
    _poFilterStatus: '',
    _soFilterStatus: '',
    _toFilterStatus: '',
    _supplierFilter: '',
    _recvFilter: '',
    _payFilter: '',

    /* ========== 首页 / 仪表盘 ========== */
    dashboard: function() {
        UI.setTitle('百顺');
        UI.setHeaderAction(null);
        UI.setContent(UI.loadingHtml());
        Api.get('/api/reports/dashboard').then(function(d) {
            Pages._renderDashboard(d);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message, "App.switchTab('dashboard')"));
            UI.toast(e.message, 'error');
        });
    },

    _renderDashboard: function(d) {
        d = d || {};
        var today = Utils.today();
        var html = '<div class="page">';

        html += '<div class="card" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);margin:12px;color:#fff;">' +
            '<div style="padding:16px;">' +
                '<div style="font-size:13px;opacity:0.85;">' + today + ' 今日概览</div>' +
                '<div style="font-size:14px;margin-top:4px;opacity:0.9;">百顺进销存财务系统</div>' +
            '</div></div>';

        var purchaseExtra = '';
        var purchaseExtraTotal = (d.todayPurchaseFreight || 0) + (d.todayPurchasePackingFee || 0) + (d.todayPurchaseMiscFee || 0);
        if (purchaseExtraTotal > 0) {
            var purchaseExtraParts = [];
            if (d.todayPurchaseFreight > 0) purchaseExtraParts.push('运费' + Utils.formatMoney(d.todayPurchaseFreight));
            if (d.todayPurchasePackingFee > 0) purchaseExtraParts.push('打包费' + Utils.formatMoney(d.todayPurchasePackingFee));
            if (d.todayPurchaseMiscFee > 0) purchaseExtraParts.push('杂费' + Utils.formatMoney(d.todayPurchaseMiscFee));
            purchaseExtra = '<div style="font-size:11px;color:var(--warning);margin-top:2px;">其他费用 ' + Utils.formatMoney(purchaseExtraTotal) + '（' + purchaseExtraParts.join(' / ') + '）</div>';
        }
        var salesExtra = '';
        var salesExtraTotal = (d.todaySalesFreight || 0) + (d.todaySalesMiscFee || 0);
        if (salesExtraTotal > 0) {
            var salesExtraParts = [];
            if (d.todaySalesFreight > 0) salesExtraParts.push('运费' + Utils.formatMoney(d.todaySalesFreight));
            if (d.todaySalesMiscFee > 0) salesExtraParts.push('杂费' + Utils.formatMoney(d.todaySalesMiscFee));
            salesExtra = '<div style="font-size:11px;color:var(--warning);margin-top:2px;">其他费用 ' + Utils.formatMoney(salesExtraTotal) + '（' + salesExtraParts.join(' / ') + '）</div>';
        }
        html += '<div class="stat-grid">' +
            '<div class="stat-card blue"><div class="stat-label">今日进货</div><div class="stat-value">&yen;' + Utils.formatMoney(d.todayPurchaseTotal) + '</div><div class="stat-sub">厂家进货</div>' + purchaseExtra + '</div>' +
            '<div class="stat-card cyan"><div class="stat-label">今日调货</div><div class="stat-value">&yen;' + Utils.formatMoney(d.todayTransferTotal) + '</div><div class="stat-sub">市场调货</div></div>' +
            '<div class="stat-card green"><div class="stat-label">今日发货</div><div class="stat-value">&yen;' + Utils.formatMoney(d.todaySalesTotal) + '</div><div class="stat-sub">客户发货</div>' + salesExtra + '</div>' +
            '<div class="stat-card orange"><div class="stat-label">今日毛利</div><div class="stat-value">&yen;' + Utils.formatMoney(d.todayGrossProfit) + '</div><div class="stat-sub">发货利润</div></div>' +
        '</div>';

        html += '<div class="card"><div class="card-header"><span class="card-title">今日收付款</span></div>' +
            '<div class="card-body">' +
                '<div class="detail-row"><span class="detail-label">新增应收</span><span class="detail-value amount">&yen;' + Utils.formatMoney(d.todayNewReceivable) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">新增应付</span><span class="detail-value amount">&yen;' + Utils.formatMoney(d.todayNewPayable) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">今日收款</span><span class="detail-value text-success">&yen;' + Utils.formatMoney(d.todayReceivedPayment) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">今日付款</span><span class="detail-value text-danger">&yen;' + Utils.formatMoney(d.todayPaidPayment) + '</span></div>' +
            '</div></div>';

        html += '<div class="stat-grid">' +
            '<div class="stat-card red"><div class="stat-label">应收欠款</div><div class="stat-value">&yen;' + Utils.formatMoney(d.totalReceivable) + '</div><div class="stat-sub">待客户付款</div></div>' +
            '<div class="stat-card orange"><div class="stat-label">应付欠款</div><div class="stat-value">&yen;' + Utils.formatMoney(d.totalPayable) + '</div><div class="stat-sub">待付供应商</div></div>' +
        '</div>';

        html += '<div class="section-title">快捷操作</div>';
        html += '<div class="quick-actions">';
        var actions = [
            { fn: "Forms.openPurchaseOrderForm()", svg: '<path d="M3 3h2l2 12h12l2-8H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', label: '厂家进货' },
            { fn: "Forms.openTransferOrderForm()", svg: '<path d="M4 7h13l-3-3M20 17H7l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', label: '市场调货' },
            { fn: "Forms.openSalesOrderForm()", svg: '<path d="M5 12l5-5M19 12l-7-7M3 12l9 9 9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', label: '客户发货' },
            { fn: "Forms.openPaymentForm()", svg: '<rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M2 10h20" stroke="currentColor" stroke-width="2"/>', label: '收付款' },
            { fn: "Forms.openProductForm()", svg: '<path d="M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4 8-4V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', label: '添加商品' },
            { fn: "Forms.openSupplierForm()", svg: '<path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', label: '供应商' },
            { fn: "Forms.openCustomerForm()", svg: '<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4 0-8 2-8 6h16c0-4-4-6-8-6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', label: '客户' },
            { fn: "Forms.openStockCheckForm()", svg: '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', label: '盘点' }
        ];
        actions.forEach(function(a) {
            html += '<div class="quick-action" onclick="' + a.fn + '">' +
                '<div class="quick-action-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none">' + a.svg + '</svg></div>' +
                '<span class="quick-action-label">' + a.label + '</span></div>';
        });
        html += '</div>';

        html += '<div class="card"><div class="card-header"><span class="card-title">库存概览</span>' +
            '<span class="section-title-action" onclick="Router.switchTab(\'inventory\')">查看全部</span></div>' +
            '<div class="card-body" style="padding:12px 16px;">' +
                '<div class="detail-row"><span class="detail-label">商品总数</span><span class="detail-value">' + (d.totalProducts || 0) + ' 种</span></div>' +
                '<div class="detail-row"><span class="detail-label">客户总数</span><span class="detail-value">' + (d.totalCustomers || 0) + ' 个</span></div>' +
                '<div class="detail-row"><span class="detail-label">供应商数</span><span class="detail-value">' + (d.totalSuppliers || 0) + ' 个</span></div>' +
                '<div class="detail-row"><span class="detail-label">库存预警</span><span class="detail-value ' + (d.lowStockCount > 0 ? 'text-danger font-bold' : '') + '">' + (d.lowStockCount || 0) + ' 种</span></div>' +
            '</div></div>';

        html += '</div>';
        UI.setContent(html);
    },

    /* ========== 进货单列表 ========== */
    purchaseOrders: function() {
        UI.setTitle('进货');
        UI.setHeaderAction('新建', function() { Forms.openPurchaseOrderForm(); });
        UI.setContent(UI.loadingHtml());
        var self = this;
        Api.get('/api/purchase-orders').then(function(orders) {
            self._renderPurchaseList(orders || []);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    _renderPurchaseList: function(orders) {
        var html = '<div class="page">';
        html += '<div class="search-bar"><div class="search-input-wrapper">' +
            '<input type="date" class="search-input" id="po-start-date" style="padding-left:12px;" value="">' +
            '<span class="text-tertiary text-sm" style="padding:0 4px;">至</span>' +
            '<input type="date" class="search-input" id="po-end-date" style="padding-left:12px;" value="">' +
            '</div><button class="btn btn-primary btn-sm" onclick="Pages.searchPurchaseOrders()">查询</button></div>';
        html += '<div class="filter-row">' +
            '<button class="filter-chip active" onclick="Pages.filterPurchaseOrders(event,\'\')">全部</button>' +
            '<button class="filter-chip" onclick="Pages.filterPurchaseOrders(event,\'UNPAID\')">未付</button>' +
            '<button class="filter-chip" onclick="Pages.filterPurchaseOrders(event,\'PARTIAL\')">部分</button>' +
            '<button class="filter-chip" onclick="Pages.filterPurchaseOrders(event,\'SETTLED\')">已结</button>' +
        '</div>';
        html += '<div id="po-list-container"></div></div>';
        UI.setContent(html);
        this.renderPurchaseItems(orders);
    },

    searchPurchaseOrders: function() {
        var startDate = document.getElementById('po-start-date').value;
        var endDateEl = document.getElementById('po-end-date');
        var endDate = endDateEl ? endDateEl.value : '';
        var container = document.getElementById('po-list-container');
        if (container) container.innerHTML = UI.loadingHtml();
        var params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        var self = this;
        Api.get('/api/purchase-orders', params).then(function(orders) {
            self.renderPurchaseItems(orders || []);
        }).catch(function(e) {
            if (container) container.innerHTML = UI.errorState(e.message);
        });
    },

    filterPurchaseOrders: function(e, status) {
        document.querySelectorAll('.filter-row .filter-chip').forEach(function(c) { c.classList.remove('active'); });
        e.target.classList.add('active');
        this._poFilterStatus = status;
        this.searchPurchaseOrders();
    },

    renderPurchaseItems: function(orders) {
        if (this._poFilterStatus) {
            orders = orders.filter(function(o) { return o.payStatus === Pages._poFilterStatus; });
        }
        var container = document.getElementById('po-list-container');
        if (!container) return;
        if (!orders || orders.length === 0) {
            container.innerHTML = UI.emptyState('暂无进货单', '<button class="btn btn-primary" onclick="Forms.openPurchaseOrderForm()">新建进货单</button>');
            return;
        }
        var html = '';
        orders.forEach(function(order) {
            html += '<div class="list-item" onclick="Pages.purchaseOrderDetail(' + order.id + ')">' +
                '<div class="list-item-header"><div style="flex:1;">' +
                    '<div class="list-item-title">' + Utils.escapeHtml(order.supplierName || '未知供应商') + '</div>' +
                    '<div class="list-item-subtitle">' + Utils.escapeHtml(order.orderNo || '') + ' | ' + Utils.formatDate(order.orderDate) + '</div>' +
                '</div>' + BadgeHelper.payStatus(order.payStatus) + '</div>' +
                '<div class="list-item-meta"><span>' + (order.items || []).length + ' 件商品</span>' + BadgeHelper.payMethod(order.payMethod) + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">' +
                    '<span class="text-tertiary text-sm">' + (order.warehouseName ? Utils.escapeHtml(order.warehouseName) + ' | ' : '') + '进货总额</span>' +
                    '<span class="list-item-amount">&yen;' + Utils.formatMoney(order.grandTotal != null ? order.grandTotal : order.totalAmount) + '</span>' +
                '</div></div>';
        });
        container.innerHTML = html;
    },

    purchaseOrderDetail: function(id) {
        Router.navigate(function() { Pages.purchaseOrderDetail(id); }, '进货单详情');
        UI.setContent(UI.loadingHtml());
        Api.get('/api/purchase-orders/' + id).then(function(o) {
            Pages._renderPurchaseDetail(o);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    _renderPurchaseDetail: function(o) {
        o = o || {};
        var html = '<div class="page">';
        html += '<div class="card"><div class="card-header"><span class="card-title">进货单信息</span>' + BadgeHelper.payStatus(o.payStatus) + '</div>' +
            '<div class="card-body" style="padding:0;">' +
                '<div class="detail-row"><span class="detail-label">单号</span><span class="detail-value">' + Utils.escapeHtml(o.orderNo || '') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">日期</span><span class="detail-value">' + Utils.formatDate(o.orderDate) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">供应商</span><span class="detail-value">' + Utils.escapeHtml(o.supplierName || '') + '</span></div>' +
                (o.warehouseName ? '<div class="detail-row"><span class="detail-label">仓库</span><span class="detail-value">' + Utils.escapeHtml(o.warehouseName) + '</span></div>' : '') +
                '<div class="detail-row"><span class="detail-label">联系人</span><span class="detail-value">' + Utils.escapeHtml(o.contactPerson || '-') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">电话</span><span class="detail-value">' + Utils.escapeHtml(o.phone || '-') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">支付方式</span><span class="detail-value">' + (PAY_METHOD_MAP[o.payMethod] || '-') + '</span></div>' +
            '</div></div>';

        html += '<div class="card"><div class="card-header"><span class="card-title">费用明细</span></div>' +
            '<div class="card-body" style="padding:0;">' +
                '<div class="detail-row"><span class="detail-label">商品总额</span><span class="detail-value">&yen;' + Utils.formatMoney(o.totalAmount) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">运费</span><span class="detail-value">&yen;' + Utils.formatMoney(o.freight) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">包装费</span><span class="detail-value">&yen;' + Utils.formatMoney(o.packingFee) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">其他费用</span><span class="detail-value">&yen;' + Utils.formatMoney(o.miscFee) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">已付金额</span><span class="detail-value text-success">&yen;' + Utils.formatMoney(o.paidAmount) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">总计</span><span class="detail-value amount">&yen;' + Utils.formatMoney(o.grandTotal != null ? o.grandTotal : o.totalAmount) + '</span></div>' +
            '</div></div>';

        if (o.items && o.items.length > 0) {
            html += '<div class="section-title">商品明细</div><div class="card"><div class="card-body" style="padding:0;">';
            o.items.forEach(function(item) {
                html += '<div class="detail-row"><div style="flex:1;">' +
                    '<div style="font-weight:500;">' + Utils.escapeHtml(item.productName || '') + '</div>' +
                    '<div class="text-xs text-tertiary mt-2">' + Utils.escapeHtml(item.spec || '') + ' ' + Utils.escapeHtml(item.model || '') + (item.weight ? ' | 重量:' + item.weight + 'kg' : '') + (item.unit ? ' | ' + Utils.escapeHtml(item.unit) : '') + '</div>' +
                    Utils.renderAllocations(item) + '</div>' +
                    '<div style="text-align:right;"><div>&yen;' + Utils.formatMoney(item.unitPrice) + (item.weight ? '/kg x ' + item.weight + 'kg' : ' x ' + item.quantity + (item.unit ? ' ' + Utils.escapeHtml(item.unit) : '')) + '</div>' +
                    '<div class="font-bold text-primary">&yen;' + Utils.formatMoney(item.totalAmount) + '</div></div></div>';
            });
            html += '</div></div>';
        }

        if (o.remark) {
            html += '<div class="card"><div class="card-body"><div class="text-tertiary text-sm">备注</div><div style="margin-top:4px;">' + Utils.escapeHtml(o.remark) + '</div></div></div>';
        }

        html += '</div>';
        UI.setContent(html);
    },

    /* ========== 发货单列表 ========== */
    salesOrders: function() {
        UI.setTitle('发货');
        UI.setHeaderAction('新建', function() { Forms.openSalesOrderForm(); });
        UI.setContent(UI.loadingHtml());
        var self = this;
        Api.get('/api/sales-orders').then(function(orders) {
            self._renderSalesList(orders || []);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    _renderSalesList: function(orders) {
        var html = '<div class="page">';
        html += '<div class="search-bar"><div class="search-input-wrapper">' +
            '<input type="date" class="search-input" id="so-start-date" style="padding-left:12px;" value="">' +
            '<span class="text-tertiary text-sm" style="padding:0 4px;">至</span>' +
            '<input type="date" class="search-input" id="so-end-date" style="padding-left:12px;" value="">' +
            '</div><button class="btn btn-primary btn-sm" onclick="Pages.searchSalesOrders()">查询</button></div>';
        html += '<div class="filter-row">' +
            '<button class="filter-chip active" onclick="Pages.filterSalesOrders(event,\'\')">全部</button>' +
            '<button class="filter-chip" onclick="Pages.filterSalesOrders(event,\'UNPAID\')">未付</button>' +
            '<button class="filter-chip" onclick="Pages.filterSalesOrders(event,\'PARTIAL\')">部分</button>' +
            '<button class="filter-chip" onclick="Pages.filterSalesOrders(event,\'SETTLED\')">已结</button>' +
        '</div>';
        html += '<div id="so-list-container"></div></div>';
        UI.setContent(html);
        this.renderSalesItems(orders);
    },

    searchSalesOrders: function() {
        var startDate = document.getElementById('so-start-date').value;
        var endDateEl = document.getElementById('so-end-date');
        var endDate = endDateEl ? endDateEl.value : '';
        var container = document.getElementById('so-list-container');
        if (container) container.innerHTML = UI.loadingHtml();
        var params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        var self = this;
        Api.get('/api/sales-orders', params).then(function(orders) {
            self.renderSalesItems(orders || []);
        }).catch(function(e) {
            if (container) container.innerHTML = UI.errorState(e.message);
        });
    },

    filterSalesOrders: function(e, status) {
        document.querySelectorAll('.filter-row .filter-chip').forEach(function(c) { c.classList.remove('active'); });
        e.target.classList.add('active');
        this._soFilterStatus = status;
        this.searchSalesOrders();
    },

    renderSalesItems: function(orders) {
        if (this._soFilterStatus) {
            orders = orders.filter(function(o) { return o.payStatus === Pages._soFilterStatus; });
        }
        var container = document.getElementById('so-list-container');
        if (!container) return;
        if (!orders || orders.length === 0) {
            container.innerHTML = UI.emptyState('暂无发货单', '<button class="btn btn-primary" onclick="Forms.openSalesOrderForm()">新建发货单</button>');
            return;
        }
        var html = '';
        orders.forEach(function(order) {
            html += '<div class="list-item" onclick="Pages.salesOrderDetail(' + order.id + ')">' +
                '<div class="list-item-header"><div style="flex:1;">' +
                    '<div class="list-item-title">' + Utils.escapeHtml(order.customerName || '未知客户') + '</div>' +
                    '<div class="list-item-subtitle">' + Utils.escapeHtml(order.orderNo || '') + ' | ' + Utils.formatDate(order.orderDate) + '</div>' +
                '</div>' + BadgeHelper.payStatus(order.payStatus) + '</div>' +
                '<div class="list-item-meta"><span>' + (order.items || []).length + ' 件商品</span>' + BadgeHelper.deliveryMethod(order.deliveryMethod) + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">' +
                    '<span class="text-tertiary text-sm">' + (order.warehouseName ? Utils.escapeHtml(order.warehouseName) + ' | ' : '') + '发货总额</span>' +
                    '<span class="list-item-amount">&yen;' + Utils.formatMoney(order.grandTotal != null ? order.grandTotal : order.totalAmount) + '</span>' +
                '</div></div>';
        });
        container.innerHTML = html;
    },

    salesOrderDetail: function(id) {
        Router.navigate(function() { Pages.salesOrderDetail(id); }, '发货单详情');
        UI.setContent(UI.loadingHtml());
        Api.get('/api/sales-orders/' + id).then(function(o) {
            Pages._renderSalesDetail(o);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    _renderSalesDetail: function(o) {
        o = o || {};
        var html = '<div class="page">';
        html += '<div class="card"><div class="card-header"><span class="card-title">发货单信息</span>' + BadgeHelper.payStatus(o.payStatus) + '</div>' +
            '<div class="card-body" style="padding:0;">' +
                '<div class="detail-row"><span class="detail-label">单号</span><span class="detail-value">' + Utils.escapeHtml(o.orderNo || '') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">日期</span><span class="detail-value">' + Utils.formatDate(o.orderDate) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">客户</span><span class="detail-value">' + Utils.escapeHtml(o.customerName || '') + '</span></div>' +
                (o.warehouseName ? '<div class="detail-row"><span class="detail-label">仓库</span><span class="detail-value">' + Utils.escapeHtml(o.warehouseName) + '</span></div>' : '') +
                '<div class="detail-row"><span class="detail-label">电话</span><span class="detail-value">' + Utils.escapeHtml(o.phone || '-') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">地址</span><span class="detail-value">' + Utils.escapeHtml(o.address || '-') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">发货方式</span><span class="detail-value">' + (DELIVERY_METHOD_MAP[o.deliveryMethod] || '-') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">支付方式</span><span class="detail-value">' + (PAY_METHOD_MAP[o.payMethod] || '-') + '</span></div>' +
            '</div></div>';

        html += '<div class="card"><div class="card-header"><span class="card-title">金额明细</span></div>' +
            '<div class="card-body" style="padding:0;">' +
                '<div class="detail-row"><span class="detail-label">商品总额</span><span class="detail-value">&yen;' + Utils.formatMoney(o.totalAmount) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">优惠</span><span class="detail-value text-danger">&yen;' + Utils.formatMoney(o.discount) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">运费</span><span class="detail-value">&yen;' + Utils.formatMoney(o.freight) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">杂费</span><span class="detail-value">&yen;' + Utils.formatMoney(o.miscFee) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">已付金额</span><span class="detail-value text-success">&yen;' + Utils.formatMoney(o.paidAmount) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">总计</span><span class="detail-value amount">&yen;' + Utils.formatMoney(o.grandTotal != null ? o.grandTotal : o.totalAmount) + '</span></div>' +
            '</div></div>';

        if (o.items && o.items.length > 0) {
            html += '<div class="section-title">商品明细</div><div class="card"><div class="card-body" style="padding:0;">';
            o.items.forEach(function(item) {
                html += '<div class="detail-row"><div style="flex:1;">' +
                    '<div style="font-weight:500;">' + Utils.escapeHtml(item.productName || '') + '</div>' +
                    '<div class="text-xs text-tertiary mt-2">' + Utils.escapeHtml(item.spec || '') + (item.weight ? ' | 重量:' + item.weight + 'kg' : '') + (item.unit ? ' | ' + Utils.escapeHtml(item.unit) : '') + '</div>' +
                    Utils.renderAllocations(item) + '</div>' +
                    '<div style="text-align:right;"><div>&yen;' + Utils.formatMoney(item.unitPrice) + (item.weight ? '/kg x ' + item.weight + 'kg' : ' x ' + item.quantity + (item.unit ? ' ' + Utils.escapeHtml(item.unit) : '')) + '</div>' +
                    '<div class="font-bold text-primary">&yen;' + Utils.formatMoney(item.totalAmount) + '</div></div></div>';
            });
            html += '</div></div>';
        }

        if (o.remark) {
            html += '<div class="card"><div class="card-body"><div class="text-tertiary text-sm">备注</div><div style="margin-top:4px;">' + Utils.escapeHtml(o.remark) + '</div></div></div>';
        }

        html += '</div>';
        UI.setContent(html);
    },

    /* ========== 库存 ========== */
    inventory: function() {
        UI.setTitle('库存');
        UI.setHeaderAction(null);
        this._invTab = 'products';
        this._renderInventory();
    },

    _renderInventory: function() {
        var tab = this._invTab || 'products';
        var html = '<div class="page">';
        html += '<div class="sub-tabs">' +
            '<div class="sub-tab ' + (tab === 'products' ? 'active' : '') + '" onclick="Pages.setInvTab(\'products\')">商品库存</div>' +
            '<div class="sub-tab ' + (tab === 'lowstock' ? 'active' : '') + '" onclick="Pages.setInvTab(\'lowstock\')">库存预警</div>' +
            '<div class="sub-tab ' + (tab === 'check' ? 'active' : '') + '" onclick="Pages.setInvTab(\'check\')">盘点记录</div>' +
        '</div>';
        html += '<div id="inv-content"></div></div>';
        UI.setContent(html);
        if (tab === 'products') this.loadInventoryProducts();
        else if (tab === 'lowstock') this.loadLowStock();
        else if (tab === 'check') this.loadStockChecks();
    },

    setInvTab: function(tab) {
        this._invTab = tab;
        this._renderInventory();
    },

    loadInventoryProducts: function() {
        var container = document.getElementById('inv-content');
        if (container) container.innerHTML = UI.loadingHtml();
        var self = this;
        Promise.all([Api.get('/api/inventory/products'), Cache.loadWarehouses()]).then(function(results) {
            var products = results[0] || [];
            var warehouses = results[1] || [];
            var whOpts = warehouses.map(function(w) {
                return '<option value="' + w.id + '">' + Utils.escapeHtml(w.name) + '</option>';
            }).join('');
            var html = '<div class="search-bar"><div class="search-input-wrapper">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
                '<input type="text" class="search-input" placeholder="搜索商品名称" id="inv-search" oninput="Pages.filterInventoryProducts()"></div>' +
                '<button class="btn btn-outline-gray btn-sm" onclick="Pages.loadInventoryProducts()">刷新</button></div>' +
                '<div class="filter-row"><select class="search-input" id="inv-warehouse-filter" style="padding-left:12px;flex:1;" onchange="Pages.onInvWarehouseFilter()"><option value="">全部仓库</option>' + whOpts + '</select></div>' +
                '<div id="inv-product-list"></div>';
            container.innerHTML = html;
            self._invProducts = products;
            self.renderInventoryProducts(products);
        }).catch(function(e) {
            if (container) container.innerHTML = UI.errorState(e.message);
        });
    },

    filterInventoryProducts: Utils.debounce(function() {
        var keyword = (document.getElementById('inv-search') && document.getElementById('inv-search').value || '').toLowerCase();
        var filtered = (Pages._invProducts || []).filter(function(p) {
            return (p.name || '').toLowerCase().indexOf(keyword) >= 0 || (p.spec || '').toLowerCase().indexOf(keyword) >= 0;
        });
        Pages.renderInventoryProducts(filtered);
    }, 300),

    onInvWarehouseFilter: function() {
        var select = document.getElementById('inv-warehouse-filter');
        if (!select) return;
        var warehouseId = select.value;
        var container = document.getElementById('inv-product-list');
        if (!container) return;
        if (!warehouseId) {
            Pages.renderInventoryProducts(Pages._invProducts || []);
            return;
        }
        container.innerHTML = UI.loadingHtml();
        Api.get('/api/inventory/warehouse/' + warehouseId).then(function(stocks) {
            stocks = stocks || [];
            if (stocks.length === 0) {
                container.innerHTML = UI.emptyState('该仓库暂无库存商品');
                return;
            }
            var allProducts = Pages._invProducts || [];
            var merged = stocks.map(function(s) {
                var pid = s.productId || s.id;
                var prod = allProducts.find(function(p) { return p.id === pid; }) || {};
                return {
                    id: pid,
                    name: prod.name || s.productName || '',
                    spec: prod.spec || '',
                    model: prod.model || '',
                    color: prod.color || '',
                    thickness: prod.thickness || '',
                    length: prod.length || '',
                    unit: prod.unit || '',
                    category: prod.category || '',
                    currentStock: s.quantity !== undefined ? s.quantity : (s.currentStock || 0),
                    minStock: prod.minStock || 0,
                    defaultPurchasePrice: prod.defaultPurchasePrice,
                    averagePurchasePrice: prod.averagePurchasePrice,
                    defaultSalePrice: prod.defaultSalePrice
                };
            });
            Pages.renderInventoryProducts(merged, parseInt(warehouseId));
        }).catch(function(e) {
            container.innerHTML = UI.errorState(e.message);
        });
    },

    renderInventoryProducts: function(products, warehouseId) {
        var container = document.getElementById('inv-product-list');
        if (!container) return;
        if (!products || products.length === 0) {
            container.innerHTML = UI.emptyState('未找到匹配商品');
            return;
        }
        var html = '';
        products.forEach(function(p) {
            var stock = Utils.toNumber(p.currentStock);
            var minStock = Utils.toNumber(p.minStock);
            var barClass = 'good';
            var barWidth = '100%';
            if (minStock > 0) {
                var ratio = stock / (minStock * 2);
                barWidth = Math.min(Math.max(ratio * 100, 5), 100) + '%';
                if (stock <= 0) { barClass = 'danger'; barWidth = '100%'; }
                else if (stock <= minStock) { barClass = 'warning'; }
            } else if (stock <= 0) {
                barClass = 'danger';
            }
            var statusBadge = stock <= 0 ? '<span class="badge badge-danger">缺货</span>' :
                (stock <= minStock && minStock > 0 ? '<span class="badge badge-danger">不足</span>' : '<span class="badge badge-success">正常</span>');
            var clickHandler = warehouseId
                ? 'Pages.warehouseProductDetail(' + warehouseId + ', ' + p.id + ')'
                : 'Pages.productLedger(' + p.id + ')';
            html += '<div class="list-item" onclick="' + clickHandler + '">' +
                '<div class="list-item-header"><div style="flex:1;">' +
                    '<div class="list-item-title">' + Utils.escapeHtml(p.name) + (p.color ? ' <span style="display:inline-block;padding:1px 8px;border-radius:10px;background:#e3f2fd;color:#1976d2;font-size:12px;font-weight:400;margin-left:4px;">' + Utils.escapeHtml(p.color) + '</span>' : '') + '</div>' +
                    '<div class="text-xs text-tertiary mt-2">' + Utils.escapeHtml(p.spec || '') + ' ' + Utils.escapeHtml(p.model || '') + (p.color ? ' | 颜色:' + Utils.escapeHtml(p.color) : '') + (p.thickness ? ' | 厚:' + Utils.escapeHtml(p.thickness) : '') + (p.length ? ' | 长:' + Utils.escapeHtml(p.length) : '') + (p.unit ? ' | ' + Utils.escapeHtml(p.unit) : '') + '</div>' +
                '</div>' + statusBadge + '</div>' +
                '<div class="stock-bar"><div class="stock-bar-fill ' + barClass + '" style="width:' + barWidth + '"></div></div>' +
                '<div class="stock-level-text"><span>当前库存: <strong>' + stock + '</strong></span><span>最低库存: ' + minStock + '</span></div>' +
                '<div class="list-item-meta"><span>平均进价: &yen;' + Utils.formatMoney(p.averagePurchasePrice) + '</span></div>' +
            '</div>';
        });
        container.innerHTML = html;
    },

    productLedger: function(id) {
        Router.navigate(function() { Pages.productLedger(id); }, '商品流水');
        UI.setContent(UI.loadingHtml());
        Promise.all([Cache.loadProducts(), Api.get('/api/inventory/products/' + id + '/ledger'), Api.get('/api/products/' + id + '/warehouses')]).then(function(results) {
            var products = results[0];
            var ledger = results[1] || [];
            var warehouseStocks = results[2] || [];
            var product = products.find(function(p) { return p.id === id; }) || {};
            Pages._renderProductLedger(product, ledger, warehouseStocks);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    _renderProductLedger: function(product, ledger, warehouseStocks) {
        product = product || {};
        ledger = ledger || [];
        warehouseStocks = warehouseStocks || [];
        var html = '<div class="page">';
        html += '<div class="card"><div class="card-body">' +
            '<div style="font-size:17px;font-weight:600;">' + Utils.escapeHtml(product.name) + '</div>' +
            '<div class="text-sm text-tertiary mt-2">' + Utils.escapeHtml(product.spec || '') + ' ' + Utils.escapeHtml(product.model || '') + (product.thickness ? ' | 厚:' + Utils.escapeHtml(product.thickness) : '') + (product.length ? ' | 长:' + Utils.escapeHtml(product.length) : '') + (product.unit ? ' | ' + Utils.escapeHtml(product.unit) : '') + '</div>' +
            '<div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;">' +
                '<div><span class="text-tertiary text-sm">当前库存</span><div class="font-bold text-lg">' + Utils.toNumber(product.currentStock) + (product.unit ? ' ' + Utils.escapeHtml(product.unit) : '') + '</div></div>' +
                '<div><span class="text-tertiary text-sm">最低库存</span><div class="font-bold text-lg">' + Utils.toNumber(product.minStock) + (product.unit ? ' ' + Utils.escapeHtml(product.unit) : '') + '</div></div>' +
                '<div><span class="text-tertiary text-sm">平均进价</span><div class="font-bold text-lg text-warning">&yen;' + Utils.formatMoney(product.averagePurchasePrice) + '</div></div>' +
            '</div></div></div>';

        /* 仓库库存分布 */
        if (warehouseStocks.length > 0) {
            html += '<div class="section-title">仓库库存分布</div>';
            html += '<div class="card"><div class="card-body" style="padding:0;">';
            warehouseStocks.forEach(function(ws) {
                var qty = Utils.toNumber(ws.quantity);
                html += '<div class="detail-row"><span class="detail-label">' + Utils.escapeHtml(ws.warehouseName || '未知仓库') + '</span>' +
                    '<span class="detail-value font-bold ' + (qty <= 0 ? 'text-danger' : 'text-primary') + '">' + qty + (ws.unit ? ' ' + Utils.escapeHtml(ws.unit) : (product.unit ? ' ' + Utils.escapeHtml(product.unit) : '')) + '</span></div>';
            });
            html += '</div></div>';
        }

        html += '<div class="section-title">库存流水</div>';
        if (ledger.length === 0) {
            html += UI.emptyState('暂无流水记录');
        } else {
            html += '<div class="card"><div class="card-body" style="padding:0;">';
            ledger.forEach(function(entry) {
                var qty = Utils.toNumber(entry.quantity);
                var isIn = qty > 0;
                var unit = entry.unit || product.unit || '';
                var whName = entry.warehouseName || '';
                var desc = RECORD_TYPE_MAP[entry.recordType] || entry.recordType || '';
                if (entry.remark) desc += ' (' + entry.remark + ')';
                var dateStr = Utils.formatDateTime(entry.createdAt) || Utils.formatDate(entry.recordDate);
                html += '<div class="ledger-item">' +
                    '<div class="ledger-type ' + (isIn ? 'in' : 'out') + '">' + (isIn ? '入' : '出') + '</div>' +
                    '<div class="ledger-info"><div class="ledger-desc">' + Utils.escapeHtml(desc) +
                        (whName ? ' <span class="badge badge-gray" style="margin-left:4px;">' + Utils.escapeHtml(whName) + '</span>' : '') +
                        (entry.relatedOrderNo ? ' <span class="text-xs text-tertiary">' + Utils.escapeHtml(entry.relatedOrderNo) + '</span>' : '') + '</div>' +
                    '<div class="ledger-date">' + dateStr + '</div></div>' +
                    '<div class="ledger-qty ' + (isIn ? 'in' : 'out') + '">' + (isIn ? '+' : '') + qty + (unit ? ' ' + Utils.escapeHtml(unit) : '') + '</div>' +
                '</div>';
            });
            html += '</div></div>';
        }
        html += '</div>';
        UI.setContent(html);
    },

    loadLowStock: function() {
        var container = document.getElementById('inv-content');
        if (container) container.innerHTML = UI.loadingHtml();
        Api.get('/api/inventory/low-stock').then(function(products) {
            products = products || [];
            if (products.length === 0) {
                container.innerHTML = UI.emptyState('暂无库存预警', '<p class="text-sm text-tertiary">所有商品库存充足</p>');
                return;
            }
            var html = '<div class="section-title">库存预警 (' + products.length + ')</div>';
            products.forEach(function(p) {
                var stock = Utils.toNumber(p.currentStock);
                var minStock = Utils.toNumber(p.minStock);
                html += '<div class="list-item" onclick="Pages.productLedger(' + p.id + ')">' +
                    '<div class="list-item-header"><div style="flex:1;">' +
                        '<div class="list-item-title">' + Utils.escapeHtml(p.name) + (p.color ? ' <span style="display:inline-block;padding:1px 8px;border-radius:10px;background:#e3f2fd;color:#1976d2;font-size:12px;font-weight:400;margin-left:4px;">' + Utils.escapeHtml(p.color) + '</span>' : '') + '</div>' +
                        '<div class="text-xs text-tertiary mt-2">' + Utils.escapeHtml(p.spec || '') + (p.color ? ' | ' + Utils.escapeHtml(p.color) : '') + (p.thickness ? ' | 厚:' + Utils.escapeHtml(p.thickness) : '') + (p.length ? ' | 长:' + Utils.escapeHtml(p.length) : '') + (p.unit ? ' | ' + Utils.escapeHtml(p.unit) : '') + '</div>' +
                    '</div><span class="badge badge-danger">库存不足</span></div>' +
                    '<div class="stock-level-text"><span class="text-danger">当前: <strong>' + stock + '</strong></span><span>最低: ' + minStock + '</span></div>' +
                '</div>';
            });
            container.innerHTML = html;
        }).catch(function(e) {
            if (container) container.innerHTML = UI.errorState(e.message);
        });
    },

    loadStockChecks: function() {
        var container = document.getElementById('inv-content');
        if (container) container.innerHTML = UI.loadingHtml();
        Api.get('/api/stock-checks').then(function(checks) {
            checks = checks || [];
            var html = '<div style="padding:12px;"><button class="btn btn-primary btn-block" onclick="Forms.openStockCheckForm()">' +
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>新建盘点</button></div>';
            if (checks.length === 0) {
                html += UI.emptyState('暂无盘点记录');
            } else {
                checks.forEach(function(c) {
                    html += '<div class="list-item"><div class="list-item-header"><div style="flex:1;">' +
                        '<div class="list-item-title">' + Utils.formatDate(c.checkDate) + '</div>' +
                        '<div class="list-item-subtitle">' + (c.items || []).length + ' 项商品</div></div>' +
                        BadgeHelper.checkType(c.checkType) + '</div>' +
                        (c.remark ? '<div class="text-sm text-tertiary">' + Utils.escapeHtml(c.remark) + '</div>' : '') +
                    '</div>';
                });
            }
            container.innerHTML = html;
        }).catch(function(e) {
            if (container) container.innerHTML = UI.errorState(e.message);
        });
    },

    /* ========== 更多菜单 ========== */
    more: function() {
        UI.setTitle('更多');
        UI.setHeaderAction(null);
        var html = '<div class="page">';

        html += '<div class="section-title">基础数据</div>';
        html += '<div class="menu-list">' +
            this._menuItem('products', 'var(--primary-lighter)', 'var(--primary)', '<path d="M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4 8-4V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', '商品管理', '商品信息、规格、价格') +
            this._menuItem('warehouses', 'var(--success-light)', 'var(--success)', '<path d="M3 9l1-5h16l1 5M5 9v11h14V9M9 14h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', '仓库管理', '仓库信息与库存分布') +
            this._menuItem('suppliers', 'var(--info-light)', 'var(--info)', '<path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', '供应商管理', '厂家与市场供应商') +
            this._menuItem('customers', 'var(--success-light)', 'var(--success)', '<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4 0-8 2-8 6h16c0-4-4-6-8-6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', '客户管理', '客户信息与联系方式') +
        '</div>';

        html += '<div class="section-title">财务管理</div>';
        html += '<div class="menu-list">' +
            this._menuItem('receivables', 'var(--danger-light)', 'var(--danger)', '<path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', '应收账款', '客户欠款管理') +
            this._menuItem('payables', 'var(--warning-light)', 'var(--warning)', '<rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M2 10h20" stroke="currentColor" stroke-width="2"/>', '应付账款', '供应商欠款管理') +
            this._menuItem('transferOrders', 'var(--primary-light)', 'var(--primary)', '<path d="M4 7h13l-3-3M20 17H7l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', '市场调货单', '市场调货、换货、补货') +
        '</div>';

        html += '<div class="section-title">统计报表</div>';
        html += '<div class="menu-list">' +
            this._menuItem('dailyReport', 'var(--primary-lighter)', 'var(--primary)', '<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>', '日报表', '每日经营数据汇总') +
            this._menuItem('monthlyReport', 'var(--info-light)', 'var(--info)', '<path d="M3 3v18h18M7 14l3-3 3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', '月报表', '每月经营数据汇总') +
        '</div>';

        html += '</div>';
        UI.setContent(html);
    },

    _menuItem: function(fn, bg, color, svgPath, title, desc) {
        return '<div class="menu-item" onclick="Pages.' + fn + '()">' +
            '<div class="menu-icon" style="background:' + bg + ';color:' + color + ';"><svg width="20" height="20" viewBox="0 0 24 24" fill="none">' + svgPath + '</svg></div>' +
            '<div class="menu-text"><div class="menu-text-title">' + title + '</div><div class="menu-text-desc">' + desc + '</div></div>' +
            '<span class="menu-arrow"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '</div>';
    },

    /* ========== 商品管理 ========== */
    products: function() {
        Router.navigate(function() { Pages.products(); }, '商品管理');
        UI.setHeaderAction('添加', function() { Forms.openProductForm(); });
        this.loadProducts();
    },

    loadProducts: function(keyword) {
        UI.setContent(UI.loadingHtml());
        Api.get('/api/products', { name: keyword || '' }).then(function(products) {
            products = products || [];
            var html = '<div class="page">';
            html += '<div class="search-bar"><div class="search-input-wrapper">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
                '<input type="text" class="search-input" placeholder="搜索商品" id="product-search" value="' + Utils.escapeHtml(keyword || '') + '" oninput="Pages.onProductSearch()"></div></div>';
            html += '<div id="product-list-container"></div></div>';
            UI.setContent(html);
            Pages.renderProductList(products);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    onProductSearch: Utils.debounce(function() {
        var keyword = document.getElementById('product-search').value;
        Pages.loadProducts(keyword);
    }, 400),

    renderProductList: function(products) {
        var container = document.getElementById('product-list-container');
        if (!container) return;
        if (!products || products.length === 0) {
            container.innerHTML = UI.emptyState('暂无商品', '<button class="btn btn-primary" onclick="Forms.openProductForm()">添加商品</button>');
            return;
        }
        var html = '';
        products.forEach(function(p) {
            var stock = Utils.toNumber(p.currentStock);
            var minStock = Utils.toNumber(p.minStock);
            var stockClass = stock <= minStock ? 'text-danger' : 'text-success';
            html += '<div class="list-item" onclick="Forms.openProductForm(' + p.id + ')">' +
                '<div class="list-item-header"><div style="flex:1;">' +
                    '<div class="list-item-title">' + Utils.escapeHtml(p.name) + (p.color ? ' <span style="display:inline-block;padding:1px 8px;border-radius:10px;background:#e3f2fd;color:#1976d2;font-size:12px;font-weight:400;margin-left:4px;">' + Utils.escapeHtml(p.color) + '</span>' : '') + '</div>' +
                    '<div class="text-xs text-tertiary mt-2">' + Utils.escapeHtml(p.spec || '') + ' ' + Utils.escapeHtml(p.model || '') + (p.color ? ' | ' + Utils.escapeHtml(p.color) : '') + (p.thickness ? ' | 厚:' + Utils.escapeHtml(p.thickness) : '') + (p.length ? ' | 长:' + Utils.escapeHtml(p.length) : '') + (p.unit ? ' | ' + Utils.escapeHtml(p.unit) : '') + '</div>' +
                '</div>' + BadgeHelper.productStatus(p.status) + '</div>' +
                '<div class="list-item-meta">' +
                    '<span>库存: <strong class="' + stockClass + '">' + stock + '</strong></span>' +
                    '<span>平均进价: &yen;' + Utils.formatMoney(p.averagePurchasePrice) + '</span>' +
                '</div></div>';
        });
        container.innerHTML = html;
    },

    /* ========== 仓库管理 ========== */
    warehouses: function() {
        Router.navigate(function() { Pages.warehouses(); }, '仓库管理');
        UI.setHeaderAction('添加', function() { Forms.openWarehouseForm(); });
        this.loadWarehouses();
    },

    loadWarehouses: function(keyword) {
        UI.setContent(UI.loadingHtml());
        Api.get('/api/warehouses/capacity').then(function(warehouses) {
            warehouses = warehouses || [];
            if (keyword) {
                var kw = keyword.toLowerCase();
                warehouses = warehouses.filter(function(w) {
                    return (w.name || '').toLowerCase().indexOf(kw) >= 0;
                });
            }
            var html = '<div class="page">';
            html += '<div class="search-bar"><div class="search-input-wrapper">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
                '<input type="text" class="search-input" placeholder="搜索仓库名称" id="warehouse-search" value="' + Utils.escapeHtml(keyword || '') + '" oninput="Pages.onWarehouseSearch()"></div></div>';
            html += '<div id="warehouse-list-container"></div></div>';
            UI.setContent(html);
            Pages.renderWarehouseList(warehouses);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    onWarehouseSearch: Utils.debounce(function() {
        var keyword = document.getElementById('warehouse-search').value;
        Pages.loadWarehouses(keyword);
    }, 400),

    renderWarehouseList: function(warehouses) {
        var container = document.getElementById('warehouse-list-container');
        if (!container) return;
        if (!warehouses || warehouses.length === 0) {
            container.innerHTML = UI.emptyState('暂无仓库', '<button class="btn btn-primary" onclick="Forms.openWarehouseForm()">添加仓库</button>');
            return;
        }
        var html = '';
        warehouses.forEach(function(w) {
            var maxCap = Utils.toNumber(w.maxCapacity);
            var used = Utils.toNumber(w.currentUsed);
            var remaining = Utils.toNumber(w.remainingCapacity);
            var capHtml = '';
            if (maxCap > 0) {
                var pct = Math.min(100, Math.round(used / maxCap * 100));
                var barColor = pct >= 90 ? 'var(--danger)' : (pct >= 70 ? 'var(--warning)' : 'var(--success)');
                capHtml = '<div style="margin-top:6px;">' +
                    '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-tertiary);">' +
                    '<span>容量: ' + Utils.formatMoney(used) + ' / ' + Utils.formatMoney(maxCap) + '</span>' +
                    '<span style="color:' + barColor + ';">剩余' + Utils.formatMoney(remaining) + '</span></div>' +
                    '<div style="height:4px;background:var(--bg-secondary);border-radius:2px;margin-top:3px;overflow:hidden;">' +
                    '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:2px;"></div></div></div>';
            } else {
                capHtml = '<div style="margin-top:6px;font-size:12px;color:var(--text-tertiary);">已存: ' + Utils.formatMoney(used) + ' (未设容量限制)</div>';
            }
            html += '<div class="list-item" onclick="Pages.warehouseStock(' + w.id + ')">' +
                '<div class="list-item-header"><div style="flex:1;">' +
                    '<div class="list-item-title">' + Utils.escapeHtml(w.name) + '</div>' +
                    '<div class="text-xs text-tertiary mt-2">' + (w.code ? '编码: ' + Utils.escapeHtml(w.code) : '') + '</div>' +
                '</div></div>' +
                '<div class="list-item-meta">' +
                    (w.location ? '<span>' + Utils.escapeHtml(w.location) + '</span>' : '') +
                '</div>' +
                capHtml +
                '<div class="list-item-actions">' +
                    '<button class="btn btn-outline btn-sm" style="flex:1;" onclick="event.stopPropagation();Forms.openWarehouseForm(' + w.id + ')">编辑</button>' +
                    '<button class="btn btn-danger btn-sm" style="flex:1;" onclick="event.stopPropagation();Forms.deleteWarehouse(' + w.id + ')">删除</button>' +
                '</div></div>';
        });
        container.innerHTML = html;
    },

    warehouseStock: function(id) {
        Router.navigate(function() { Pages.warehouseStock(id); }, '仓库库存');
        UI.setContent(UI.loadingHtml());
        Promise.all([Api.get('/api/inventory/warehouse/' + id), Cache.loadProducts()]).then(function(results) {
            var products = results[0] || [];
            var allProducts = results[1] || [];
            var wh = (Cache.warehouses || []).find(function(w) { return w.id === id; }) || {};
            var html = '<div class="page">';
            html += '<div class="card"><div class="card-body">' +
                '<div style="font-size:17px;font-weight:600;">' + Utils.escapeHtml(wh.name || '仓库库存') + '</div>' +
                '<div class="text-sm text-tertiary mt-2">' + (wh.code ? '编码: ' + Utils.escapeHtml(wh.code) + ' ' : '') + (wh.location ? '| ' + Utils.escapeHtml(wh.location) : '') + '</div>' +
            '</div></div>';
            if (products.length === 0) {
                html += UI.emptyState('该仓库暂无库存商品');
            } else {
                html += '<div class="section-title">库存商品 (' + products.length + ')</div>';
                products.forEach(function(p) {
                    var qty = Utils.toNumber(p.quantity !== undefined ? p.quantity : p.currentStock);
                    var pid = p.productId || p.id;
                    var prod = allProducts.find(function(pr) { return pr.id === pid; }) || {};
                    var statusBadge = qty <= 0 ? '<span class="badge badge-danger">缺货</span>' :
                        (prod.minStock && qty <= Utils.toNumber(prod.minStock) ? '<span class="badge badge-danger">不足</span>' : '<span class="badge badge-success">正常</span>');
                    html += '<div class="list-item" onclick="Pages.warehouseProductDetail(' + id + ', ' + pid + ')">' +
                        '<div class="list-item-header"><div style="flex:1;">' +
                            '<div class="list-item-title">' + Utils.escapeHtml(p.productName || prod.name || '') + (prod.color ? ' <span style="display:inline-block;padding:1px 8px;border-radius:10px;background:#e3f2fd;color:#1976d2;font-size:12px;font-weight:400;margin-left:4px;">' + Utils.escapeHtml(prod.color) + '</span>' : '') + '</div>' +
                            '<div class="text-xs text-tertiary mt-2">' + Utils.escapeHtml(prod.spec || p.spec || '') + ' ' + Utils.escapeHtml(prod.model || p.model || '') + (prod.color ? ' | 颜色:' + Utils.escapeHtml(prod.color) : '') + (prod.thickness ? ' | 厚:' + Utils.escapeHtml(prod.thickness) : '') + (prod.length ? ' | 长:' + Utils.escapeHtml(prod.length) : '') + (prod.unit || p.unit ? ' | ' + Utils.escapeHtml(prod.unit || p.unit) : '') + '</div>' +
                        '</div>' + statusBadge + '</div>' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">' +
                            '<span class="text-tertiary text-sm">库存数量</span>' +
                            '<span class="font-bold text-primary">' + qty + '</span>' +
                        '</div>' +
                        '<div class="list-item-meta"><span>平均进价: &yen;' + Utils.formatMoney(prod.averagePurchasePrice) + '</span></div>' +
                    '</div>';
                });
            }
            html += '</div>';
            UI.setContent(html);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },
    warehouseProductDetail: function(warehouseId, productId) {
        Router.navigate(function() { Pages.warehouseProductDetail(warehouseId, productId); }, '仓库商品流水');
        UI.setContent(UI.loadingHtml());
        Promise.all([
            Cache.loadProducts(),
            Cache.loadWarehouses(),
            Api.get('/api/inventory/warehouse/' + warehouseId),
            Api.get('/api/inventory/products/' + productId + '/warehouses/' + warehouseId + '/ledger')
        ]).then(function(results) {
            var allProducts = results[0] || [];
            var warehouses = results[1] || [];
            var warehouseStocks = results[2] || [];
            var ledger = results[3] || [];
            var product = allProducts.find(function(p) { return p.id === productId; }) || {};
            var wh = warehouses.find(function(w) { return w.id === warehouseId; }) || {};
            var ws = warehouseStocks.find(function(s) { return (s.productId || s.id) === productId; }) || {};
            var qty = Utils.toNumber(ws.quantity !== undefined ? ws.quantity : ws.currentStock);

            var html = '<div class="page">';
            html += '<div class="card"><div class="card-body">' +
                '<div style="font-size:17px;font-weight:600;">' + Utils.escapeHtml(product.name || '') +
                    (product.color ? ' <span style="display:inline-block;padding:1px 8px;border-radius:10px;background:#e3f2fd;color:#1976d2;font-size:12px;font-weight:400;margin-left:4px;">' + Utils.escapeHtml(product.color) + '</span>' : '') +
                '</div>' +
                '<div class="text-sm text-tertiary mt-2">' + Utils.escapeHtml(product.spec || '') + ' ' + Utils.escapeHtml(product.model || '') + (product.color ? ' | 颜色:' + Utils.escapeHtml(product.color) : '') + (product.thickness ? ' | 厚:' + Utils.escapeHtml(product.thickness) : '') + (product.length ? ' | 长:' + Utils.escapeHtml(product.length) : '') + (product.unit ? ' | ' + Utils.escapeHtml(product.unit) : '') + '</div>' +
                '<div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;">' +
                    '<div><span class="text-tertiary text-sm">仓库</span><div class="font-bold text-lg">' + Utils.escapeHtml(wh.name || '') + '</div></div>' +
                    '<div><span class="text-tertiary text-sm">库存数量</span><div class="font-bold text-lg text-primary">' + qty + '</div></div>' +
                    '<div><span class="text-tertiary text-sm">平均进价</span><div class="font-bold text-lg text-warning">&yen;' + Utils.formatMoney(product.averagePurchasePrice) + '</div></div>' +
                '</div></div></div>';

            if (ledger.length === 0) {
                html += UI.emptyState('该仓库暂无此商品的流水记录');
            } else {
                html += '<div class="section-title">流水记录 (' + ledger.length + ')</div>';
                html += '<div class="card"><div class="card-body" style="padding:0;">';
                ledger.forEach(function(entry) {
                    var changeQty = Utils.toNumber(entry.quantity);
                    var isIn = changeQty > 0;
                    var unit = entry.unit || product.unit || '';
                    var desc = RECORD_TYPE_MAP[entry.recordType] || entry.recordType || '';
                    if (entry.remark) desc += ' (' + entry.remark + ')';
                    var dateStr = Utils.formatDateTime(entry.createdAt) || Utils.formatDate(entry.recordDate);
                    html += '<div class="ledger-item">' +
                        '<div class="ledger-type ' + (isIn ? 'in' : 'out') + '">' + (isIn ? '入' : '出') + '</div>' +
                        '<div class="ledger-info"><div class="ledger-desc">' + Utils.escapeHtml(desc) +
                            (entry.relatedOrderNo ? ' <span class="badge badge-gray" style="margin-left:4px;">' + Utils.escapeHtml(entry.relatedOrderNo) + '</span>' : '') +
                        '</div>' +
                        '<div class="ledger-date">' + (dateStr || '') + '</div></div>' +
                        '<div class="ledger-qty ' + (isIn ? 'text-success' : 'text-danger') + '">' +
                            (isIn ? '+' : '') + changeQty + ' ' + Utils.escapeHtml(unit) +
                        '</div></div>';
                });
                html += '</div></div>';
            }
            html += '</div>';
            UI.setContent(html);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },
    /* ========== 退货单列表 ========== */
    returnOrders: function() {
        UI.setTitle('退货');
        UI.setHeaderAction('新建', function() { Forms.openReturnOrderForm(); });
        UI.setContent(UI.loadingHtml());
        var self = this;
        Api.get('/api/return-orders').then(function(orders) {
            self._renderReturnList(orders || []);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    _renderReturnList: function(orders) {
        var html = '<div class="page">';
        html += '<div class="filter-row">' +
            '<button class="filter-chip active" onclick="Pages.filterReturnOrders(event,\'\')">全部</button>' +
            '<button class="filter-chip" onclick="Pages.filterReturnOrders(event,\'SUPPLIER\')">退给供应商</button>' +
            '<button class="filter-chip" onclick="Pages.filterReturnOrders(event,\'CUSTOMER\')">客户退货</button>' +
        '</div>';
        html += '<div id="ro-list-container"></div></div>';
        UI.setContent(html);
        this.renderReturnItems(orders);
    },

    filterReturnOrders: function(e, type) {
        document.querySelectorAll('.filter-row .filter-chip').forEach(function(c) { c.classList.remove('active'); });
        e.target.classList.add('active');
        this._roFilterType = type;
        this.loadReturnOrders();
    },

    loadReturnOrders: function() {
        var container = document.getElementById('ro-list-container');
        if (container) container.innerHTML = UI.loadingHtml();
        var self = this;
        Api.get('/api/return-orders').then(function(orders) {
            orders = orders || [];
            if (self._roFilterType) {
                orders = orders.filter(function(o) { return o.returnType === self._roFilterType; });
            }
            self.renderReturnItems(orders);
        }).catch(function(e) {
            if (container) container.innerHTML = UI.errorState(e.message);
        });
    },

    renderReturnItems: function(orders) {
        var container = document.getElementById('ro-list-container');
        if (!container) return;
        if (!orders || orders.length === 0) {
            container.innerHTML = UI.emptyState('暂无退货单', '<button class="btn btn-primary" onclick="Forms.openReturnOrderForm()">新建退货单</button>');
            return;
        }
        var html = '';
        orders.forEach(function(order) {
            html += '<div class="list-item" onclick="Pages.returnOrderDetail(' + order.id + ')">' +
                '<div class="list-item-header"><div style="flex:1;">' +
                    '<div class="list-item-title">' + Utils.escapeHtml(order.targetName || '未知') + '</div>' +
                    '<div class="list-item-subtitle">' + Utils.escapeHtml(order.orderNo || '') + ' | ' + Utils.formatDate(order.orderDate) + '</div>' +
                '</div>' + BadgeHelper.returnType(order.returnType) + '</div>' +
                '<div class="list-item-meta"><span>' + (order.items || []).length + ' 件</span>' + BadgeHelper.payStatus(order.payStatus) + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">' +
                    '<span class="text-tertiary text-sm">' + (order.warehouseName ? Utils.escapeHtml(order.warehouseName) + ' | ' : '') + '退货总额</span>' +
                    '<span class="list-item-amount">&yen;' + Utils.formatMoney(order.totalAmount) + '</span>' +
                '</div></div>';
        });
        container.innerHTML = html;
    },

    returnOrderDetail: function(id) {
        Router.navigate(function() { Pages.returnOrderDetail(id); }, '退货单详情');
        UI.setContent(UI.loadingHtml());
        Api.get('/api/return-orders/' + id).then(function(o) {
            Pages._renderReturnDetail(o);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    _renderReturnDetail: function(o) {
        o = o || {};
        var html = '<div class="page">';
        html += '<div class="card"><div class="card-header"><span class="card-title">退货单信息</span>' + BadgeHelper.returnType(o.returnType) + '</div>' +
            '<div class="card-body" style="padding:0;">' +
                '<div class="detail-row"><span class="detail-label">单号</span><span class="detail-value">' + Utils.escapeHtml(o.orderNo || '') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">日期</span><span class="detail-value">' + Utils.formatDate(o.orderDate) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">' + (o.returnType === 'SUPPLIER' ? '供应商' : '客户') + '</span><span class="detail-value">' + Utils.escapeHtml(o.targetName || '') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">联系人</span><span class="detail-value">' + Utils.escapeHtml(o.contactPerson || '-') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">电话</span><span class="detail-value">' + Utils.escapeHtml(o.phone || '-') + '</span></div>' +
                (o.warehouseName ? '<div class="detail-row"><span class="detail-label">仓库</span><span class="detail-value">' + Utils.escapeHtml(o.warehouseName) + '</span></div>' : '') +
                '<div class="detail-row"><span class="detail-label">支付方式</span><span class="detail-value">' + (PAY_METHOD_MAP[o.payMethod] || '-') + '</span></div>' +
            '</div></div>';
        html += '<div class="card"><div class="card-header"><span class="card-title">费用明细</span></div>' +
            '<div class="card-body" style="padding:0;">' +
                '<div class="detail-row"><span class="detail-label">商品总额</span><span class="detail-value">&yen;' + Utils.formatMoney(o.totalAmount) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">运费</span><span class="detail-value">&yen;' + Utils.formatMoney(o.freight) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">其他费用</span><span class="detail-value">&yen;' + Utils.formatMoney(o.miscFee) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">已付金额</span><span class="detail-value text-success">&yen;' + Utils.formatMoney(o.paidAmount) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">总计</span><span class="detail-value amount">&yen;' + Utils.formatMoney(o.grandTotal != null ? o.grandTotal : o.totalAmount) + '</span></div>' +
            '</div></div>';
        if (o.items && o.items.length > 0) {
            html += '<div class="section-title">商品明细</div><div class="card"><div class="card-body" style="padding:0;">';
            o.items.forEach(function(item) {
                html += '<div class="detail-row"><div style="flex:1;">' +
                    '<div style="font-weight:500;">' + Utils.escapeHtml(item.productName || '') + '</div>' +
                    '<div class="text-xs text-tertiary mt-2">' + Utils.escapeHtml(item.spec || '') + (item.color ? ' | ' + Utils.escapeHtml(item.color) : '') + (item.unit ? ' | ' + Utils.escapeHtml(item.unit) : '') + '</div>' +
                    '</div>' +
                    '<div style="text-align:right;"><div>&yen;' + Utils.formatMoney(item.unitPrice) + ' x ' + item.quantity + (item.unit ? ' ' + Utils.escapeHtml(item.unit) : '') + '</div>' +
                    '<div class="font-bold text-primary">&yen;' + Utils.formatMoney(item.totalAmount) + '</div></div></div>';
            });
            html += '</div></div>';
        }
        if (o.remark) {
            html += '<div class="card"><div class="card-body"><div class="text-tertiary text-sm">备注</div><div style="margin-top:4px;">' + Utils.escapeHtml(o.remark) + '</div></div></div>';
        }
        html += '</div>';
        UI.setContent(html);
    },

/* ========== 供应商管理 ========== */
    suppliers: function() {
        Router.navigate(function() { Pages.suppliers(); }, '供应商管理');
        UI.setHeaderAction('添加', function() { Forms.openSupplierForm(); });
        this._supplierFilter = '';
        this.loadSuppliers();
    },

    loadSuppliers: function(keyword) {
        UI.setContent(UI.loadingHtml());
        var params = {};
        if (keyword) params.name = keyword;
        if (this._supplierFilter) params.type = this._supplierFilter;
        Api.get('/api/suppliers', params).then(function(suppliers) {
            suppliers = suppliers || [];
            var html = '<div class="page">';
            html += '<div class="search-bar"><div class="search-input-wrapper">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
                '<input type="text" class="search-input" placeholder="搜索供应商" id="supplier-search" value="' + Utils.escapeHtml(keyword || '') + '" oninput="Pages.onSupplierSearch()"></div></div>';
            html += '<div class="filter-row">' +
                '<button class="filter-chip ' + (!Pages._supplierFilter ? 'active' : '') + '" onclick="Pages.filterSuppliers(\'\')">全部</button>' +
                '<button class="filter-chip ' + (Pages._supplierFilter === 'FACTORY' ? 'active' : '') + '" onclick="Pages.filterSuppliers(\'FACTORY\')">厂家</button>' +
                '<button class="filter-chip ' + (Pages._supplierFilter === 'MARKET' ? 'active' : '') + '" onclick="Pages.filterSuppliers(\'MARKET\')">市场</button>' +
            '</div>';
            html += '<div id="supplier-list-container"></div></div>';
            UI.setContent(html);
            Pages.renderSupplierList(suppliers);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    filterSuppliers: function(type) {
        this._supplierFilter = type;
        var keyword = (document.getElementById('supplier-search') && document.getElementById('supplier-search').value) || '';
        this.loadSuppliers(keyword);
    },

    onSupplierSearch: Utils.debounce(function() {
        var keyword = document.getElementById('supplier-search').value;
        Pages.loadSuppliers(keyword);
    }, 400),

    renderSupplierList: function(suppliers) {
        var container = document.getElementById('supplier-list-container');
        if (!container) return;
        if (!suppliers || suppliers.length === 0) {
            container.innerHTML = UI.emptyState('暂无供应商', '<button class="btn btn-primary" onclick="Forms.openSupplierForm()">添加供应商</button>');
            return;
        }
        var html = '';
        suppliers.forEach(function(s) {
            html += '<div class="list-item" onclick="Forms.openSupplierForm(' + s.id + ')">' +
                '<div class="list-item-header"><div style="flex:1;">' +
                    '<div class="list-item-title">' + Utils.escapeHtml(s.name) + '</div>' +
                    (s.contactPerson ? '<div class="list-item-subtitle">' + Utils.escapeHtml(s.contactPerson) + '</div>' : '') +
                '</div>' + BadgeHelper.supplierType(s.type) + '</div>' +
                '<div class="list-item-meta">' +
                    (s.phone ? '<span>' + Utils.escapeHtml(s.phone) + '</span>' : '') +
                    (s.address ? '<span>' + Utils.escapeHtml(s.address) + '</span>' : '') +
                '</div>' +
                (function() {
                    var bal = Utils.toNumber(s.balance);
                    if (bal > 0) return '<div class="list-item-meta"><span style="color:var(--danger);font-weight:500;">欠供应商: ¥' + Utils.formatMoney(bal) + '</span></div>';
                    if (bal < 0) return '<div class="list-item-meta"><span style="color:var(--success);font-weight:500;">供应商欠我们: ¥' + Utils.formatMoney(-bal) + '</span></div>';
                    return '';
                })() + '</div>';
        });
        container.innerHTML = html;
    },

    /* ========== 客户管理 ========== */
    customers: function() {
        Router.navigate(function() { Pages.customers(); }, '客户管理');
        UI.setHeaderAction('添加', function() { Forms.openCustomerForm(); });
        this.loadCustomers();
    },

    loadCustomers: function(keyword) {
        UI.setContent(UI.loadingHtml());
        Api.get('/api/customers', { keyword: keyword || '' }).then(function(customers) {
            customers = customers || [];
            var html = '<div class="page">';
            html += '<div class="search-bar"><div class="search-input-wrapper">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
                '<input type="text" class="search-input" placeholder="搜索客户" id="customer-search" value="' + Utils.escapeHtml(keyword || '') + '" oninput="Pages.onCustomerSearch()"></div></div>';
            html += '<div id="customer-list-container"></div></div>';
            UI.setContent(html);
            Pages.renderCustomerList(customers);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    onCustomerSearch: Utils.debounce(function() {
        var keyword = document.getElementById('customer-search').value;
        Pages.loadCustomers(keyword);
    }, 400),

    renderCustomerList: function(customers) {
        var container = document.getElementById('customer-list-container');
        if (!container) return;
        if (!customers || customers.length === 0) {
            container.innerHTML = UI.emptyState('暂无客户', '<button class="btn btn-primary" onclick="Forms.openCustomerForm()">添加客户</button>');
            return;
        }
        var html = '';
        customers.forEach(function(c) {
            html += '<div class="list-item" onclick="Forms.openCustomerForm(' + c.id + ')">' +
                '<div class="list-item-header"><div style="flex:1;"><div class="list-item-title">' + Utils.escapeHtml(c.name) + '</div></div></div>' +
                '<div class="list-item-meta">' +
                    (c.phone ? '<span>' + Utils.escapeHtml(c.phone) + '</span>' : '') +
                    (c.address ? '<span>' + Utils.escapeHtml(c.address) + '</span>' : '') +
                '</div>' +
                (function() {
                    var bal = Utils.toNumber(c.balance);
                    if (bal > 0) return '<div class="list-item-meta"><span style="color:var(--danger);font-weight:500;">客户欠我们: ¥' + Utils.formatMoney(bal) + '</span></div>';
                    if (bal < 0) return '<div class="list-item-meta"><span style="color:var(--success);font-weight:500;">我们欠客户: ¥' + Utils.formatMoney(-bal) + '</span></div>';
                    return '';
                })() + '</div>';
        });
        container.innerHTML = html;
    },

    /* ========== 市场调货单 ========== */
    transferOrders: function() {
        UI.setTitle('调货');
        UI.setHeaderAction('新建', function() { Forms.openTransferOrderForm(); });
        UI.setContent(UI.loadingHtml());
        var self = this;
        Api.get('/api/transfer-orders').then(function(orders) {
            self._renderTransferList(orders || []);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    _renderTransferList: function(orders) {
        var html = '<div class="page">';
        html += '<div class="filter-row">' +
            '<button class="filter-chip active" onclick="Pages.filterTransferOrders(event,\'\')">全部</button>' +
            '<button class="filter-chip" onclick="Pages.filterTransferOrders(event,\'UNPAID\')">未付</button>' +
            '<button class="filter-chip" onclick="Pages.filterTransferOrders(event,\'PARTIAL\')">部分</button>' +
            '<button class="filter-chip" onclick="Pages.filterTransferOrders(event,\'SETTLED\')">已结</button>' +
        '</div>';
        html += '<div id="to-list-container"></div></div>';
        UI.setContent(html);
        this.renderTransferItems(orders);
    },

    filterTransferOrders: function(e, status) {
        document.querySelectorAll('.filter-row .filter-chip').forEach(function(c) { c.classList.remove('active'); });
        e.target.classList.add('active');
        this._toFilterStatus = status;
        this.loadTransferOrders();
    },

    loadTransferOrders: function() {
        var container = document.getElementById('to-list-container');
        if (container) container.innerHTML = UI.loadingHtml();
        var self = this;
        Api.get('/api/transfer-orders').then(function(orders) {
            orders = orders || [];
            if (self._toFilterStatus) {
                orders = orders.filter(function(o) { return o.payStatus === self._toFilterStatus; });
            }
            self.renderTransferItems(orders);
        }).catch(function(e) {
            if (container) container.innerHTML = UI.errorState(e.message);
        });
    },

    renderTransferItems: function(orders) {
        var container = document.getElementById('to-list-container');
        if (!container) return;
        if (!orders || orders.length === 0) {
            container.innerHTML = UI.emptyState('暂无调货单', '<button class="btn btn-primary" onclick="Forms.openTransferOrderForm()">新建调货单</button>');
            return;
        }
        var html = '';
        orders.forEach(function(order) {
            html += '<div class="list-item" onclick="Pages.transferOrderDetail(' + order.id + ')">' +
                '<div class="list-item-header"><div style="flex:1;">' +
                    '<div class="list-item-title">' + Utils.escapeHtml(order.supplierName || '未知供应商') + '</div>' +
                    '<div class="list-item-subtitle">' + Utils.escapeHtml(order.orderNo || '') + ' | ' + Utils.formatDate(order.orderDate) + '</div>' +
                '</div>' + BadgeHelper.transferType(order.transferType) + '</div>' +
                '<div class="list-item-meta"><span>' + (order.items || []).length + ' 件</span>' + BadgeHelper.payStatus(order.payStatus) + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">' +
                    '<span class="text-tertiary text-sm">' + (order.warehouseName ? Utils.escapeHtml(order.warehouseName) + ' | ' : '') + '调货总额</span>' +
                    '<span class="list-item-amount">&yen;' + Utils.formatMoney(order.totalAmount) + '</span>' +
                '</div></div>';
        });
        container.innerHTML = html;
    },

    transferOrderDetail: function(id) {
        Router.navigate(function() { Pages.transferOrderDetail(id); }, '调货单详情');
        UI.setContent(UI.loadingHtml());
        Api.get('/api/transfer-orders/' + id).then(function(o) {
            Pages._renderTransferDetail(o);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    _renderTransferDetail: function(o) {
        o = o || {};
        var html = '<div class="page">';
        html += '<div class="card"><div class="card-header"><span class="card-title">调货单信息</span>' + BadgeHelper.payStatus(o.payStatus) + '</div>' +
            '<div class="card-body" style="padding:0;">' +
                '<div class="detail-row"><span class="detail-label">单号</span><span class="detail-value">' + Utils.escapeHtml(o.orderNo || '') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">日期</span><span class="detail-value">' + Utils.formatDate(o.orderDate) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">供应商</span><span class="detail-value">' + Utils.escapeHtml(o.supplierName || '') + '</span></div>' +
                (o.warehouseName ? '<div class="detail-row"><span class="detail-label">仓库</span><span class="detail-value">' + Utils.escapeHtml(o.warehouseName) + '</span></div>' : '') +
                '<div class="detail-row"><span class="detail-label">调货类型</span><span class="detail-value">' + (TRANSFER_TYPE_MAP[o.transferType] || '-') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">支付方式</span><span class="detail-value">' + (PAY_METHOD_MAP[o.payMethod] || '-') + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">已付金额</span><span class="detail-value text-success">&yen;' + Utils.formatMoney(o.paidAmount) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">总金额</span><span class="detail-value amount">&yen;' + Utils.formatMoney(o.totalAmount) + '</span></div>' +
            '</div></div>';

        if (o.items && o.items.length > 0) {
            html += '<div class="section-title">商品明细</div><div class="card"><div class="card-body" style="padding:0;">';
            o.items.forEach(function(item) {
                html += '<div class="detail-row"><div style="flex:1;">' +
                    '<div style="font-weight:500;">' + Utils.escapeHtml(item.productName || '') + '</div>' +
                    '<div class="text-xs text-tertiary mt-2">' + Utils.escapeHtml(item.spec || '') + (item.unit ? ' | ' + Utils.escapeHtml(item.unit) : '') + '</div>' +
                    Utils.renderAllocations(item) + '</div>' +
                    '<div style="text-align:right;"><div>&yen;' + Utils.formatMoney(item.unitPrice) + ' x ' + item.quantity + (item.unit ? ' ' + Utils.escapeHtml(item.unit) : '') + '</div>' +
                    '<div class="font-bold text-primary">&yen;' + Utils.formatMoney(item.totalAmount) + '</div></div></div>';
            });
            html += '</div></div>';
        }
        if (o.remark) {
            html += '<div class="card"><div class="card-body"><div class="text-tertiary text-sm">备注</div><div style="margin-top:4px;">' + Utils.escapeHtml(o.remark) + '</div></div></div>';
        }
        html += '<div style="padding:12px;"><button class="btn btn-danger btn-block" onclick="Pages.deleteTransferOrder(' + o.id + ')">删除调货单</button></div>';
        html += '</div>';
        UI.setContent(html);
    },

    deleteTransferOrder: function(id) {
        UI.confirm('确定删除此调货单吗？', function() {
            UI.showLoading();
            Api.delete('/api/transfer-orders/' + id).then(function() {
                UI.hideLoading();
                UI.toast('删除成功', 'success');
                Router.goBack();
            }).catch(function(e) {
                UI.hideLoading();
                UI.toast(e.message, 'error');
            });
        });
    },

    /* ========== 应收账款 ========== */
    receivables: function() {
        Router.navigate(function() { Pages.receivables(); }, '应收账款');
        this._recvFilter = '';
        this.loadReceivables();
    },

    loadReceivables: function() {
        UI.setContent(UI.loadingHtml());
        var self = this;
        Api.get('/api/accounts/receivables', { status: this._recvFilter || '' }).then(function(accounts) {
            accounts = accounts || [];
            self._renderReceivables(accounts);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    _renderReceivables: function(accounts) {
        var html = '<div class="page">';
        html += '<div class="filter-row">' +
            '<button class="filter-chip ' + (!this._recvFilter ? 'active' : '') + '" onclick="Pages.filterReceivables(\'\')">全部</button>' +
            '<button class="filter-chip ' + (this._recvFilter === 'UNPAID' ? 'active' : '') + '" onclick="Pages.filterReceivables(\'UNPAID\')">未付</button>' +
            '<button class="filter-chip ' + (this._recvFilter === 'PARTIAL' ? 'active' : '') + '" onclick="Pages.filterReceivables(\'PARTIAL\')">部分</button>' +
            '<button class="filter-chip ' + (this._recvFilter === 'SETTLED' ? 'active' : '') + '" onclick="Pages.filterReceivables(\'SETTLED\')">已结清</button>' +
        '</div>';
        var totalUnpaid = 0;
        accounts.forEach(function(a) { totalUnpaid += Utils.toNumber(a.unpaidAmount); });
        html += '<div class="card" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;"><div class="card-body">' +
            '<div style="font-size:13px;opacity:0.85;">应收总额</div>' +
            '<div style="font-size:24px;font-weight:700;margin-top:4px;">&yen;' + Utils.formatMoney(totalUnpaid) + '</div></div></div>';

        if (accounts.length === 0) {
            html += UI.emptyState('暂无应收账款');
        } else {
            accounts.forEach(function(a) {
                html += '<div class="list-item"><div class="list-item-header"><div style="flex:1;">' +
                    '<div class="list-item-title">' + Utils.escapeHtml(a.customerName || '未知客户') + '</div>' +
                    '<div class="list-item-subtitle">' + Utils.escapeHtml(a.orderNo || '') + '</div></div>' +
                    BadgeHelper.accountStatus(a.status) + '</div>' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                        '<div><div class="text-tertiary text-xs">应收金额</div><div class="font-bold">&yen;' + Utils.formatMoney(a.totalAmount) + '</div></div>' +
                        '<div style="text-align:right;"><div class="text-tertiary text-xs">未收金额</div><div class="font-bold text-danger">&yen;' + Utils.formatMoney(a.unpaidAmount) + '</div></div>' +
                    '</div>';
                if (a.status !== 'SETTLED') {
                    html += '<div class="list-item-actions"><button class="btn btn-success btn-sm" style="flex:1;" onclick="Forms.openPaymentForm(\'RECEIVABLE\', ' + a.id + ', ' + a.unpaidAmount + ')">收款</button></div>';
                }
                html += '</div>';
            });
        }
        html += '</div>';
        UI.setContent(html);
    },

    filterReceivables: function(status) {
        this._recvFilter = status;
        this.loadReceivables();
    },

    /* ========== 应付账款 ========== */
    payables: function() {
        Router.navigate(function() { Pages.payables(); }, '应付账款');
        this._payFilter = '';
        this.loadPayables();
    },

    loadPayables: function() {
        UI.setContent(UI.loadingHtml());
        var self = this;
        Api.get('/api/accounts/payables', { status: this._payFilter || '' }).then(function(accounts) {
            accounts = accounts || [];
            self._renderPayables(accounts);
        }).catch(function(e) {
            UI.setContent(UI.errorState(e.message));
        });
    },

    _renderPayables: function(accounts) {
        var html = '<div class="page">';
        html += '<div class="filter-row">' +
            '<button class="filter-chip ' + (!this._payFilter ? 'active' : '') + '" onclick="Pages.filterPayables(\'\')">全部</button>' +
            '<button class="filter-chip ' + (this._payFilter === 'UNPAID' ? 'active' : '') + '" onclick="Pages.filterPayables(\'UNPAID\')">未付</button>' +
            '<button class="filter-chip ' + (this._payFilter === 'PARTIAL' ? 'active' : '') + '" onclick="Pages.filterPayables(\'PARTIAL\')">部分</button>' +
            '<button class="filter-chip ' + (this._payFilter === 'SETTLED' ? 'active' : '') + '" onclick="Pages.filterPayables(\'SETTLED\')">已结清</button>' +
        '</div>';
        var totalUnpaid = 0;
        accounts.forEach(function(a) { totalUnpaid += Utils.toNumber(a.unpaidAmount); });
        html += '<div class="card" style="background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff;"><div class="card-body">' +
            '<div style="font-size:13px;opacity:0.85;">应付总额</div>' +
            '<div style="font-size:24px;font-weight:700;margin-top:4px;">&yen;' + Utils.formatMoney(totalUnpaid) + '</div></div></div>';

        if (accounts.length === 0) {
            html += UI.emptyState('暂无应付账款');
        } else {
            accounts.forEach(function(a) {
                html += '<div class="list-item"><div class="list-item-header"><div style="flex:1;">' +
                    '<div class="list-item-title">' + Utils.escapeHtml(a.supplierName || '未知供应商') + '</div>' +
                    '<div class="list-item-subtitle">' + Utils.escapeHtml(a.orderNo || '') + '</div></div>' +
                    BadgeHelper.accountStatus(a.status) + '</div>' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                        '<div><div class="text-tertiary text-xs">应付金额</div><div class="font-bold">&yen;' + Utils.formatMoney(a.totalAmount) + '</div></div>' +
                        '<div style="text-align:right;"><div class="text-tertiary text-xs">未付金额</div><div class="font-bold text-warning">&yen;' + Utils.formatMoney(a.unpaidAmount) + '</div></div>' +
                    '</div>';
                if (a.status !== 'SETTLED') {
                    html += '<div class="list-item-actions"><button class="btn btn-primary btn-sm" style="flex:1;" onclick="Forms.openPaymentForm(\'PAYABLE\', ' + a.id + ', ' + a.unpaidAmount + ')">付款</button></div>';
                }
                html += '</div>';
            });
        }
        html += '</div>';
        UI.setContent(html);
    },

    filterPayables: function(status) {
        this._payFilter = status;
        this.loadPayables();
    },

    /* ========== 日报表 ========== */
    dailyReport: function() {
        Router.navigate(function() { Pages.dailyReport(); }, '日报表');
        var today = Utils.today();
        this._renderDailyReportForm(today);
    },

    _renderDailyReportForm: function(date) {
        var html = '<div class="page">';
        html += '<div class="card"><div class="card-body"><div class="form-group" style="margin-bottom:0;">' +
            '<label class="form-label">选择日期</label><div class="form-row">' +
                '<input type="date" class="form-input" id="daily-date" value="' + date + '" max="' + Utils.today() + '">' +
                '<button class="btn btn-primary" onclick="Pages.loadDailyReport()">查询</button>' +
            '</div></div></div></div>';
        html += '<div id="daily-report-content"></div></div>';
        UI.setContent(html);
        this.loadDailyReport();
    },

    loadDailyReport: function() {
        var date = (document.getElementById('daily-date') && document.getElementById('daily-date').value) || Utils.today();
        var container = document.getElementById('daily-report-content');
        if (container) container.innerHTML = UI.loadingHtml();
        Api.get('/api/reports/daily', { date: date }).then(function(d) {
            d = d || {};
            var html = '';
            var dailyPurchaseExtra = '';
            var pFreight = d.purchaseFreight || d.todayPurchaseFreight || 0;
            var pPacking = d.purchasePackingFee || d.todayPurchasePackingFee || 0;
            var pMisc = d.purchaseMiscFee || d.todayPurchaseMiscFee || 0;
            var purchaseExtraTotal = pFreight + pPacking + pMisc;
            if (purchaseExtraTotal > 0) {
                var purchaseExtraParts = [];
                if (pFreight > 0) purchaseExtraParts.push('运费' + Utils.formatMoney(pFreight));
                if (pPacking > 0) purchaseExtraParts.push('打包费' + Utils.formatMoney(pPacking));
                if (pMisc > 0) purchaseExtraParts.push('杂费' + Utils.formatMoney(pMisc));
                dailyPurchaseExtra = '<div style="font-size:11px;color:var(--warning);margin-top:2px;">其他费用 ' + Utils.formatMoney(purchaseExtraTotal) + '（' + purchaseExtraParts.join(' / ') + '）</div>';
            }
            var dailySalesExtra = '';
            var freight = d.salesFreight || d.todaySalesFreight || 0;
            var miscFee = d.salesMiscFee || d.todaySalesMiscFee || 0;
            var salesExtraTotal = freight + miscFee;
            if (salesExtraTotal > 0) {
                var salesExtraParts = [];
                if (freight > 0) salesExtraParts.push('运费' + Utils.formatMoney(freight));
                if (miscFee > 0) salesExtraParts.push('杂费' + Utils.formatMoney(miscFee));
                dailySalesExtra = '<div style="font-size:11px;color:var(--warning);margin-top:2px;">其他费用 ' + Utils.formatMoney(salesExtraTotal) + '（' + salesExtraParts.join(' / ') + '）</div>';
            }
            html += '<div class="stat-grid">' +
                '<div class="stat-card blue"><div class="stat-label">进货总额</div><div class="stat-value">&yen;' + Utils.formatMoney(d.purchaseTotal || d.todayPurchaseTotal) + '</div>' + dailyPurchaseExtra + '</div>' +
                '<div class="stat-card cyan"><div class="stat-label">调货总额</div><div class="stat-value">&yen;' + Utils.formatMoney(d.transferTotal || d.todayTransferTotal) + '</div></div>' +
                '<div class="stat-card green"><div class="stat-label">发货总额</div><div class="stat-value">&yen;' + Utils.formatMoney(d.salesTotal || d.todaySalesTotal) + '</div>' + dailySalesExtra + '</div>' +
                '<div class="stat-card orange"><div class="stat-label">毛利润</div><div class="stat-value">&yen;' + Utils.formatMoney(d.grossProfit || d.todayGrossProfit) + '</div></div>' +
            '</div>';
            html += '<div class="card"><div class="card-header"><span class="card-title">收付款明细</span></div><div class="card-body" style="padding:0;">' +
                '<div class="detail-row"><span class="detail-label">应收新增</span><span class="detail-value amount">&yen;' + Utils.formatMoney(d.newReceivable || d.todayNewReceivable) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">应付新增</span><span class="detail-value amount">&yen;' + Utils.formatMoney(d.newPayable || d.todayNewPayable) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">收款金额</span><span class="detail-value text-success">&yen;' + Utils.formatMoney(d.receivedPayment || d.todayReceivedPayment) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">付款金额</span><span class="detail-value text-danger">&yen;' + Utils.formatMoney(d.paidPayment || d.todayPaidPayment) + '</span></div>' +
            '</div></div>';
            if (d.purchaseCount !== undefined || d.salesCount !== undefined) {
                html += '<div class="card"><div class="card-header"><span class="card-title">单据统计</span></div><div class="card-body" style="padding:0;">' +
                    (d.purchaseCount !== undefined ? '<div class="detail-row"><span class="detail-label">进货单数</span><span class="detail-value">' + d.purchaseCount + '</span></div>' : '') +
                    (d.transferCount !== undefined ? '<div class="detail-row"><span class="detail-label">调货单数</span><span class="detail-value">' + d.transferCount + '</span></div>' : '') +
                    (d.salesCount !== undefined ? '<div class="detail-row"><span class="detail-label">发货单数</span><span class="detail-value">' + d.salesCount + '</span></div>' : '') +
                '</div></div>';
            }
            container.innerHTML = html;
        }).catch(function(e) {
            if (container) container.innerHTML = UI.errorState(e.message);
        });
    },

    /* ========== 月报表 ========== */
    monthlyReport: function() {
        Router.navigate(function() { Pages.monthlyReport(); }, '月报表');
        var now = new Date();
        this._renderMonthlyReportForm(now.getFullYear(), now.getMonth() + 1);
    },

    _renderMonthlyReportForm: function(year, month) {
        var years = [2024, 2025, 2026];
        var yearOpts = years.map(function(y) { return '<option value="' + y + '" ' + (y === year ? 'selected' : '') + '>' + y + '年</option>'; }).join('');
        var monthOpts = '';
        for (var i = 1; i <= 12; i++) {
            monthOpts += '<option value="' + i + '" ' + (i === month ? 'selected' : '') + '>' + i + '月</option>';
        }
        var html = '<div class="page">';
        html += '<div class="card"><div class="card-body"><div class="form-row" style="align-items:flex-end;">' +
            '<div class="form-group" style="margin-bottom:0;"><label class="form-label">年份</label><select class="form-select" id="monthly-year">' + yearOpts + '</select></div>' +
            '<div class="form-group" style="margin-bottom:0;"><label class="form-label">月份</label><select class="form-select" id="monthly-month">' + monthOpts + '</select></div>' +
            '<button class="btn btn-primary" style="min-height:44px;" onclick="Pages.loadMonthlyReport()">查询</button>' +
        '</div></div></div>';
        html += '<div id="monthly-report-content"></div></div>';
        UI.setContent(html);
        this.loadMonthlyReport();
    },

    loadMonthlyReport: function() {
        var year = document.getElementById('monthly-year') && document.getElementById('monthly-year').value;
        var month = document.getElementById('monthly-month') && document.getElementById('monthly-month').value;
        var container = document.getElementById('monthly-report-content');
        if (container) container.innerHTML = UI.loadingHtml();
        Api.get('/api/reports/monthly', { year: year, month: month }).then(function(d) {
            d = d || {};
            var html = '';
            html += '<div class="stat-grid">' +
                '<div class="stat-card blue"><div class="stat-label">进货总额</div><div class="stat-value">&yen;' + Utils.formatMoney(d.totalPurchaseCost) + '</div></div>' +
                '<div class="stat-card cyan"><div class="stat-label">调货总额</div><div class="stat-value">&yen;' + Utils.formatMoney(d.totalTransferCost) + '</div></div>' +
                '<div class="stat-card green"><div class="stat-label">发货总额</div><div class="stat-value">&yen;' + Utils.formatMoney(d.totalSales) + '</div></div>' +
                '<div class="stat-card orange"><div class="stat-label">毛利润</div><div class="stat-value">&yen;' + Utils.formatMoney(d.grossProfit) + '</div></div>' +
            '</div>';
            html += '<div class="card"><div class="card-header"><span class="card-title">月度汇总</span></div><div class="card-body" style="padding:0;">' +
                '<div class="detail-row"><span class="detail-label">总收款</span><span class="detail-value text-success">&yen;' + Utils.formatMoney(d.totalReceived || d.receivedPayment) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">总付款</span><span class="detail-value text-danger">&yen;' + Utils.formatMoney(d.totalPaid || d.paidPayment) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">净利润</span><span class="detail-value amount">&yen;' + Utils.formatMoney(d.netProfit || d.grossProfit) + '</span></div>' +
            '</div></div>';
            if (d.dailyDetails && d.dailyDetails.length > 0) {
                html += '<div class="section-title">每日明细</div>';
                html += '<div class="card"><div style="overflow-x:auto;"><table class="report-table"><thead><tr><th>日期</th><th class="num">进货</th><th class="num">发货</th><th class="num">毛利</th></tr></thead><tbody>';
                d.dailyDetails.forEach(function(day) {
                    html += '<tr><td>' + Utils.formatDate(day.date) + '</td><td class="num">' + Utils.formatMoney(day.purchaseTotal) + '</td><td class="num">' + Utils.formatMoney(day.salesTotal) + '</td><td class="num">' + Utils.formatMoney(day.grossProfit) + '</td></tr>';
                });
                html += '</tbody></table></div></div>';
            }
            container.innerHTML = html;
        }).catch(function(e) {
            if (container) container.innerHTML = UI.errorState(e.message);
        });
    }
};

/* ===== 表单模块 ===== */
var Forms = {

    /* ========== 商品表单 ========== */
    openProductForm: function(id) {
        if (id) {
            UI.showLoading();
            Api.get('/api/products').then(function(list) {
                UI.hideLoading();
                var product = (list || []).find(function(p) { return p.id === id; }) || {};
                Forms._showProductForm(product, true);
            }).catch(function(e) {
                UI.hideLoading();
                UI.toast(e.message, 'error');
            });
        } else {
            this._showProductForm({}, false);
        }
    },

    _showProductForm: function(product, isEdit) {
        var html = '<form id="product-form" onsubmit="return false;">' +
            '<div class="form-group"><label class="form-label">商品名称<span class="required">*</span></label>' +
                '<input type="text" class="form-input" name="name" value="' + Utils.escapeHtml(product.name || '') + '" placeholder="请输入商品名称" required></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">规格</label>' +
                '<input type="text" class="form-input" name="spec" value="' + Utils.escapeHtml(product.spec || '') + '" placeholder="规格"></div>' +
            '<div class="form-group"><label class="form-label">型号</label>' +
                '<input type="text" class="form-input" name="model" value="' + Utils.escapeHtml(product.model || '') + '" placeholder="型号"></div></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">单位</label>' +
                '<input type="text" class="form-input" name="unit" value="' + Utils.escapeHtml(product.unit || '') + '" placeholder="如: 个/箱/件"></div>' +
            '<div class="form-group"><label class="form-label">分类</label>' +
                '<input type="text" class="form-input" name="category" value="' + Utils.escapeHtml(product.category || '') + '" placeholder="分类"></div></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">厚度</label>' +
                '<input type="text" class="form-input" name="thickness" value="' + Utils.escapeHtml(product.thickness || '') + '" placeholder="如: 1.2mm"></div>' +
            '<div class="form-group"><label class="form-label">颜色</label>' +
                '<input type="text" class="form-input" name="color" value="' + Utils.escapeHtml(product.color || '') + '" placeholder="如: 喷涂白色"></div>' +
            '<div class="form-group"><label class="form-label">长度</label>' +
                '<input type="text" class="form-input" name="length" value="' + Utils.escapeHtml(product.length || '') + '" placeholder="如: 6m"></div></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">最低库存</label>' +
                '<input type="number" class="form-input" name="minStock" value="' + (product.minStock || 0) + '" placeholder="0"></div>' +
            '<div class="form-group"><label class="form-label">当前库存</label>' +
                '<input type="number" class="form-input" name="currentStock" value="' + (product.currentStock || 0) + '" placeholder="0" ' + (isEdit ? 'readonly' : '') + '></div></div>' +
            '<div class="form-group"><label class="form-label">状态</label><select class="form-select" name="status">' +
                '<option value="ACTIVE" ' + (product.status === 'ACTIVE' || !product.status ? 'selected' : '') + '>启用</option>' +
                '<option value="INACTIVE" ' + (product.status === 'INACTIVE' ? 'selected' : '') + '>停用</option></select></div>' +
            '<div class="form-group"><label class="form-label">备注</label>' +
                '<textarea class="form-textarea" name="remark" placeholder="备注信息">' + Utils.escapeHtml(product.remark || '') + '</textarea></div>' +
        '</form>';

        UI.showModal(isEdit ? '编辑商品' : '添加商品', html,
            '<button class="btn btn-gray" style="flex:1" onclick="UI.hideModal()">取消</button>' +
            (isEdit ? '<button class="btn btn-danger" style="flex:1" onclick="Forms.deleteProduct(' + product.id + ')">删除</button>' : '') +
            '<button class="btn btn-primary" style="flex:1" onclick="Forms.saveProduct(' + (isEdit ? product.id : 'null') + ')">' + (isEdit ? '保存' : '添加') + '</button>'
        );
    },

    deleteProduct: function(id) {
        UI.confirm('确定删除此商品吗？删除后不可恢复。', function() {
            UI.showLoading();
            Api.delete('/api/products/' + id).then(function() {
                UI.hideLoading();
                UI.hideModal();
                UI.toast('商品删除成功', 'success');
                Cache.loadProducts();
                if (Router.currentTab === 'inventory') Pages.loadInventoryProducts();
                else Pages.loadProducts();
            }).catch(function(e) {
                UI.hideLoading();
                UI.toast(e.message, 'error');
            });
        });
    },

    saveProduct: function(id) {
        var form = document.getElementById('product-form');
        var data = {
            name: form.name.value.trim(),
            spec: form.spec.value.trim(),
            model: form.model.value.trim(),
            unit: form.unit.value.trim(),
            category: form.category.value.trim(),
            thickness: form.thickness.value.trim(),
            color: form.color.value.trim(),
            length: form.length.value.trim(),
            minStock: Utils.toNumber(form.minStock.value),
            currentStock: Utils.toNumber(form.currentStock.value),
            status: form.status.value,
            remark: form.remark.value.trim()
        };
        if (!data.name) { UI.toast('请输入商品名称', 'warning'); return; }
        UI.showLoading();
        var promise = id ? Api.put('/api/products/' + id, data) : Api.post('/api/products', data);
        promise.then(function() {
            UI.hideLoading();
            UI.hideModal();
            UI.toast(id ? '商品更新成功' : '商品添加成功', 'success');
            Cache.loadProducts();
            if (Router.currentTab === 'inventory') Pages.loadInventoryProducts();
            else if (Router.navStack.length > 0) Pages.loadProducts();
        }).catch(function(e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        });
    },

    /* ========== 仓库表单 ========== */
    openWarehouseForm: function(id) {
        if (id) {
            UI.showLoading();
            Api.get('/api/warehouses/' + id).then(function(warehouse) {
                UI.hideLoading();
                Forms._showWarehouseForm(warehouse || {}, true);
            }).catch(function(e) {
                UI.hideLoading();
                UI.toast(e.message, 'error');
            });
        } else {
            this._showWarehouseForm({}, false);
        }
    },

    _showWarehouseForm: function(warehouse, isEdit) {
        var html = '<form id="warehouse-form" onsubmit="return false;">' +
            '<div class="form-group"><label class="form-label">仓库名称<span class="required">*</span></label>' +
                '<input type="text" class="form-input" name="name" value="' + Utils.escapeHtml(warehouse.name || '') + '" placeholder="请输入仓库名称" required></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">仓库编码</label>' +
                '<input type="text" class="form-input" name="code" value="' + Utils.escapeHtml(warehouse.code || '') + '" placeholder="如: WH001"></div>' +
            '<div class="form-group"><label class="form-label">仓库位置</label>' +
                '<input type="text" class="form-input" name="location" value="' + Utils.escapeHtml(warehouse.location || '') + '" placeholder="仓库位置"></div></div>' +
            '<div class="form-group"><label class="form-label">最大存储数量</label>' +
                '<input type="number" step="0.01" class="form-input" name="maxCapacity" value="' + Utils.formatMoney(warehouse.maxCapacity || 0) + '" placeholder="0表示不限制"></div>' +
            '<div class="form-group"><label class="form-label">备注</label>' +
                '<textarea class="form-textarea" name="remark" placeholder="备注信息">' + Utils.escapeHtml(warehouse.remark || '') + '</textarea></div>' +
        '</form>';
        UI.showModal(isEdit ? '编辑仓库' : '添加仓库', html,
            '<button class="btn btn-gray" style="flex:1" onclick="UI.hideModal()">取消</button>' +
            (isEdit ? '<button class="btn btn-danger" style="flex:1" onclick="Forms.deleteWarehouse(' + warehouse.id + ')">删除</button>' : '') +
            '<button class="btn btn-primary" style="flex:1" onclick="Forms.saveWarehouse(' + (isEdit ? warehouse.id : 'null') + ')">' + (isEdit ? '保存' : '添加') + '</button>'
        );
    },

    deleteWarehouse: function(id) {
        UI.confirm('确定删除此仓库吗？删除后不可恢复。', function() {
            UI.showLoading();
            Api.delete('/api/warehouses/' + id).then(function() {
                UI.hideLoading();
                UI.hideModal();
                UI.toast('仓库删除成功', 'success');
                Cache.loadWarehouses();
                Pages.loadWarehouses();
            }).catch(function(e) {
                UI.hideLoading();
                UI.toast(e.message, 'error');
            });
        });
    },

    saveWarehouse: function(id) {
        var form = document.getElementById('warehouse-form');
        var data = {
            name: form.name.value.trim(),
            code: form.code.value.trim(),
            location: form.location.value.trim(),
            maxCapacity: Utils.toNumber(form.maxCapacity.value),
            remark: form.remark.value.trim()
        };
        if (!data.name) { UI.toast('请输入仓库名称', 'warning'); return; }
        UI.showLoading();
        var promise = id ? Api.put('/api/warehouses/' + id, data) : Api.post('/api/warehouses', data);
        promise.then(function() {
            UI.hideLoading();
            UI.hideModal();
            UI.toast(id ? '仓库更新成功' : '仓库添加成功', 'success');
            Cache.loadWarehouses();
            Pages.loadWarehouses();
        }).catch(function(e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        });
    },

    /* ========== 供应商表单 ========== */
    openSupplierForm: function(id) {
        if (id) {
            UI.showLoading();
            Api.get('/api/suppliers').then(function(list) {
                UI.hideLoading();
                var supplier = (list || []).find(function(s) { return s.id === id; }) || {};
                Forms._showSupplierForm(supplier, true);
            }).catch(function(e) {
                UI.hideLoading();
                UI.toast(e.message, 'error');
            });
        } else {
            this._showSupplierForm({}, false);
        }
    },

    _showSupplierForm: function(supplier, isEdit) {
        var html = '<form id="supplier-form" onsubmit="return false;">' +
            '<div class="form-group"><label class="form-label">供应商名称<span class="required">*</span></label>' +
                '<input type="text" class="form-input" name="name" value="' + Utils.escapeHtml(supplier.name || '') + '" placeholder="请输入名称" required></div>' +
            '<div class="form-group"><label class="form-label">类型<span class="required">*</span></label><select class="form-select" name="type">' +
                '<option value="FACTORY" ' + (supplier.type === 'FACTORY' || !supplier.type ? 'selected' : '') + '>厂家</option>' +
                '<option value="MARKET" ' + (supplier.type === 'MARKET' ? 'selected' : '') + '>市场</option></select></div>' +
            '<div class="form-group"><label class="form-label">联系人</label>' +
                '<input type="text" class="form-input" name="contactPerson" value="' + Utils.escapeHtml(supplier.contactPerson || '') + '" placeholder="联系人"></div>' +
            '<div class="form-group"><label class="form-label">电话</label>' +
                '<input type="tel" class="form-input" name="phone" value="' + Utils.escapeHtml(supplier.phone || '') + '" placeholder="电话号码"></div>' +
            '<div class="form-group"><label class="form-label">地址</label>' +
                '<input type="text" class="form-input" name="address" value="' + Utils.escapeHtml(supplier.address || '') + '" placeholder="地址"></div>' +
            '<div class="form-group"><label class="form-label">备注</label>' +
                '<textarea class="form-textarea" name="remark" placeholder="备注">' + Utils.escapeHtml(supplier.remark || '') + '</textarea></div>' +
        '</form>';
        UI.showModal(isEdit ? '编辑供应商' : '添加供应商', html,
            '<button class="btn btn-gray" style="flex:1" onclick="UI.hideModal()">取消</button>' +
            (isEdit ? '<button class="btn btn-danger" style="flex:1" onclick="Forms.deleteSupplier(' + supplier.id + ')">删除</button>' : '') +
            '<button class="btn btn-primary" style="flex:1" onclick="Forms.saveSupplier(' + (isEdit ? supplier.id : 'null') + ')">' + (isEdit ? '保存' : '添加') + '</button>'
        );
    },

    deleteSupplier: function(id) {
        UI.confirm('确定删除此供应商吗？删除后不可恢复。', function() {
            UI.showLoading();
            Api.delete('/api/suppliers/' + id).then(function() {
                UI.hideLoading();
                UI.hideModal();
                UI.toast('供应商删除成功', 'success');
                Cache.loadSuppliers();
                Pages.loadSuppliers();
            }).catch(function(e) {
                UI.hideLoading();
                UI.toast(e.message, 'error');
            });
        });
    },

    saveSupplier: function(id) {
        var form = document.getElementById('supplier-form');
        var data = {
            name: form.name.value.trim(),
            type: form.type.value,
            contactPerson: form.contactPerson.value.trim(),
            phone: form.phone.value.trim(),
            address: form.address.value.trim(),
            remark: form.remark.value.trim()
        };
        if (!data.name) { UI.toast('请输入供应商名称', 'warning'); return; }
        UI.showLoading();
        var promise = id ? Api.put('/api/suppliers/' + id, data) : Api.post('/api/suppliers', data);
        promise.then(function() {
            UI.hideLoading();
            UI.hideModal();
            UI.toast(id ? '供应商更新成功' : '供应商添加成功', 'success');
            Cache.loadSuppliers();
            Pages.loadSuppliers();
        }).catch(function(e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        });
    },

    /* ========== 客户表单 ========== */
    openCustomerForm: function(id) {
        if (id) {
            UI.showLoading();
            Api.get('/api/customers').then(function(list) {
                UI.hideLoading();
                var customer = (list || []).find(function(c) { return c.id === id; }) || {};
                Forms._showCustomerForm(customer, true);
            }).catch(function(e) {
                UI.hideLoading();
                UI.toast(e.message, 'error');
            });
        } else {
            this._showCustomerForm({}, false);
        }
    },

    _showCustomerForm: function(customer, isEdit) {
        var html = '<form id="customer-form" onsubmit="return false;">' +
            '<div class="form-group"><label class="form-label">客户名称<span class="required">*</span></label>' +
                '<input type="text" class="form-input" name="name" value="' + Utils.escapeHtml(customer.name || '') + '" placeholder="请输入客户名称" required></div>' +
            '<div class="form-group"><label class="form-label">电话</label>' +
                '<input type="tel" class="form-input" name="phone" value="' + Utils.escapeHtml(customer.phone || '') + '" placeholder="电话号码"></div>' +
            '<div class="form-group"><label class="form-label">地址</label>' +
                '<input type="text" class="form-input" name="address" value="' + Utils.escapeHtml(customer.address || '') + '" placeholder="地址"></div>' +
            '<div class="form-group"><label class="form-label">备注</label>' +
                '<textarea class="form-textarea" name="remark" placeholder="备注">' + Utils.escapeHtml(customer.remark || '') + '</textarea></div>' +
        '</form>';
        UI.showModal(isEdit ? '编辑客户' : '添加客户', html,
            '<button class="btn btn-gray" style="flex:1" onclick="UI.hideModal()">取消</button>' +
            (isEdit ? '<button class="btn btn-danger" style="flex:1" onclick="Forms.deleteCustomer(' + customer.id + ')">删除</button>' : '') +
            '<button class="btn btn-primary" style="flex:1" onclick="Forms.saveCustomer(' + (isEdit ? customer.id : 'null') + ')">' + (isEdit ? '保存' : '添加') + '</button>'
        );
    },

    deleteCustomer: function(id) {
        UI.confirm('确定删除此客户吗？删除后不可恢复。', function() {
            UI.showLoading();
            Api.delete('/api/customers/' + id).then(function() {
                UI.hideLoading();
                UI.hideModal();
                UI.toast('客户删除成功', 'success');
                Cache.loadCustomers();
                Pages.loadCustomers();
            }).catch(function(e) {
                UI.hideLoading();
                UI.toast(e.message, 'error');
            });
        });
    },

    saveCustomer: function(id) {
        var form = document.getElementById('customer-form');
        var data = {
            name: form.name.value.trim(),
            phone: form.phone.value.trim(),
            address: form.address.value.trim(),
            remark: form.remark.value.trim()
        };
        if (!data.name) { UI.toast('请输入客户名称', 'warning'); return; }
        UI.showLoading();
        var promise = id ? Api.put('/api/customers/' + id, data) : Api.post('/api/customers', data);
        promise.then(function() {
            UI.hideLoading();
            UI.hideModal();
            UI.toast(id ? '客户更新成功' : '客户添加成功', 'success');
            Cache.loadCustomers();
            Pages.loadCustomers();
        }).catch(function(e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        });
    },

    /* ========== 订单商品行操作 ========== */
    _stockinWarehouses: [],

    addOrderItem: function(prefix) {
        var container = document.getElementById(prefix + '-items');
        if (!container) return;
        var index = container.children.length;
        var html = '<div class="item-row" data-index="' + index + '">' +
            '<div class="item-row-header"><span class="item-row-index">商品 ' + (index + 1) + '</span>' +
                '<button type="button" class="item-row-remove" onclick="Forms.removeOrderItem(\'' + prefix + '\', this)">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>删除</button></div>' +
            '<div class="item-row-fields">' +
                '<div class="full autocomplete-wrapper"><input type="text" class="item-row-input item-product-search" placeholder="搜索商品名称..." oninput="Forms.showProductSuggestions(this, \'' + prefix + '\')" onfocus="Forms.showProductSuggestions(this, \'' + prefix + '\')" onblur="Forms.hideProductSuggestions(this)" autocomplete="off"><div class="autocomplete-suggestions item-product-suggestions"></div></div>' +
                '<input type="hidden" class="item-product-id" value="">' +
                '<input type="text" class="item-row-input item-product-name" placeholder="商品名称" value="">' +
                '<input type="text" class="item-row-input item-spec" placeholder="规格" value="">' +
                '<input type="text" class="item-row-input item-unit" placeholder="单位" value="">' +
                '<input type="number" step="0.01" class="item-row-input item-unit-price" placeholder="单价" value="" oninput="Forms.calcItemTotal(\'' + prefix + '\', this)">' +
                (prefix === 'to' ? '' : '<input type="number" step="0.01" class="item-row-input item-weight" placeholder="' + (prefix === 'po' ? '重量' : '重量(选填)') + '" value="" oninput="Forms.calcItemTotal(\'' + prefix + '\', this)">') +
                '<input type="number" step="0.01" class="item-row-input item-quantity" placeholder="数量" value="" oninput="Forms.calcItemTotal(\'' + prefix + '\', this)">' +
                '<div class="item-row-total"><span class="item-row-total-label">小计:</span><span class="item-row-total-value">&yen;0.00</span></div>' +
                (prefix === 'ro' ? '' : '<div class="item-allocations">' +
                    '<div class="item-allocations-title">仓库分配</div>' +
                    '<div class="allocation-rows"></div>' +
                    '<div class="allocation-add-btn" onclick="Forms.addAllocation(\'' + prefix + '\', this)">+ 添加仓库</div>' +
                    '<div class="allocation-summary">已分配: 0 / 需要: 0</div>' +
                '</div>') +
            '</div></div>';
        container.insertAdjacentHTML('beforeend', html);
    },

    _getWarehouseOptions: function(prefix, row) {
        if (prefix === 'so') {
            var json = row.dataset.stockoutWarehouses || '[]';
            try { return JSON.parse(json); } catch(e) { return []; }
        }
        return this._stockinWarehouses || [];
    },

    addAllocation: function(prefix, btn) {
        var row = btn.closest('.item-row');
        var container = row.querySelector('.allocation-rows');
        var warehouses = this._getWarehouseOptions(prefix, row);
        if (!warehouses || warehouses.length === 0) {
            UI.toast(prefix === 'so' ? '该商品暂无库存，无法分配仓库' : '暂无可用仓库', 'warning');
            return;
        }
        // 排除已选仓库
        var selectedIds = [];
        row.querySelectorAll('.allocation-row .allocation-warehouse').forEach(function(s) {
            if (s.value) selectedIds.push(parseInt(s.value));
        });
        warehouses = warehouses.filter(function(w) {
            var id = parseInt(w.warehouseId || w.id);
            return selectedIds.indexOf(id) === -1;
        });
        if (warehouses.length === 0) {
            UI.toast('没有更多仓库可选了', 'warning');
            return;
        }
        var opts = '<option value="">选择仓库</option>' + warehouses.map(function(w) {
            var id = w.warehouseId || w.id;
            var name = w.warehouseName || w.name;
            var info = '';
            if (prefix === 'so') {
                info = ' (库存' + Utils.formatMoney(w.availableStock) + ')';
            } else {
                var remaining = Utils.toNumber(w.remainingCapacity);
                var maxCap = Utils.toNumber(w.maxCapacity);
                if (maxCap > 0) {
                    info = ' (剩余' + Utils.formatMoney(remaining) + ')';
                } else {
                    info = ' (无限制)';
                }
            }
            return '<option value="' + id + '" data-name="' + Utils.escapeHtml(name) + '">' +
                Utils.escapeHtml(name) + info + '</option>';
        }).join('');
        var html = '<div class="allocation-row">' +
            '<select class="allocation-warehouse">' + opts + '</select>' +
            '<input type="number" step="0.01" class="allocation-quantity" placeholder="数量" value="" oninput="Forms.updateAllocationSummary(this.closest(\'.item-row\'))">' +
            '<button type="button" onclick="Forms.removeAllocation(this)">\u00d7</button>' +
        '</div>';
        container.insertAdjacentHTML('beforeend', html);
        this.updateAllocationSummary(row);
    },

    removeAllocation: function(btn) {
        var row = btn.closest('.item-row');
        btn.closest('.allocation-row').remove();
        this.updateAllocationSummary(row);
    },

    updateAllocationSummary: function(row) {
        if (!row) return;
        var quantity = Utils.toNumber(row.querySelector('.item-quantity').value);
        var allocated = 0;
        row.querySelectorAll('.allocation-row').forEach(function(allocRow) {
            allocated += Utils.toNumber(allocRow.querySelector('.allocation-quantity').value);
        });
        var summary = row.querySelector('.allocation-summary');
        if (summary) {
            var match = quantity > 0 && allocated === quantity;
            summary.textContent = '已分配: ' + Utils.formatMoney(allocated) + ' / 需要: ' + Utils.formatMoney(quantity);
            summary.className = 'allocation-summary' + (match ? ' match' : (allocated > 0 ? ' mismatch' : ''));
        }
    },

    removeOrderItem: function(prefix, btn) {
        btn.closest('.item-row').remove();
        this.calcOrderTotal(prefix);
    },

    onProductSelect: function(prefix, select) {
        var row = select.closest('.item-row');
        if (!select.value) return;
        var product = Cache.products.find(function(p) { return p.id == select.value; });
        if (product) {
            row.querySelector('.item-product-id').value = product.id;
            row.querySelector('.item-product-name').value = product.name || '';
            row.querySelector('.item-spec').value = product.spec || '';
            var unitEl = row.querySelector('.item-unit');
            if (unitEl) unitEl.value = product.unit || '';
            var priceField = row.querySelector('.item-unit-price');
            this.calcItemTotal(prefix, priceField);
            if (prefix === 'so') {
                this._loadStockoutWarehouses(row, product.id);
            }
        }
    },

    showProductSuggestions: function(input, prefix) {
        var row = input.closest('.item-row');
        if (!row) return;
        var keyword = (input.value || '').toLowerCase().trim();
        var list = Cache.products || [];
        if (keyword) {
            list = list.filter(function(p) {
                return (p.name || '').toLowerCase().indexOf(keyword) >= 0 ||
                       (p.color || '').toLowerCase().indexOf(keyword) >= 0 ||
                       (p.spec || '').toLowerCase().indexOf(keyword) >= 0 ||
                       (p.thickness || '').toLowerCase().indexOf(keyword) >= 0;
            });
        }
        var container = row.querySelector('.item-product-suggestions');
        if (!container) return;
        var html = '';
        list.forEach(function(p) {
            var stock = Utils.toNumber(p.currentStock);
            if ((prefix === 'so' || (prefix === 'ro' && Forms._roTargetType === 'SUPPLIER')) && stock <= 0) return;
            var info = Utils.escapeHtml(p.name);
            if (p.color) info += ' ' + Utils.escapeHtml(p.color);
            if (p.thickness) info += ' 厚' + Utils.escapeHtml(p.thickness);
            if (p.length) info += ' 长' + Utils.escapeHtml(p.length);
            if (p.unit) info += ' 库存:' + stock + Utils.escapeHtml(p.unit);
            else info += ' 库存:' + stock;
            html += '<div class="autocomplete-item" data-id="' + p.id + '" onmousedown="Forms.selectProduct(this, \'' + prefix + '\')">' +
                '<div class="autocomplete-item-name">' + info + '</div></div>';
        });
        if (!html) html = '<div class="autocomplete-empty">无匹配商品</div>';
        container.innerHTML = html;
        container.classList.add('show');
    },

    selectProduct: function(item, prefix) {
        var row = item.closest('.item-row');
        if (!row) return;
        var productId = item.dataset.id;
        var product = Cache.products.find(function(p) { return p.id == productId; });
        if (!product) return;
        var searchInput = row.querySelector('.item-product-search');
        var hiddenId = row.querySelector('.item-product-id');
        var container = row.querySelector('.item-product-suggestions');
        var displayText = Utils.escapeHtml(product.name);
        if (product.color) displayText += ' ' + Utils.escapeHtml(product.color);
        if (product.thickness) displayText += ' 厚' + Utils.escapeHtml(product.thickness);
        if (product.length) displayText += ' 长' + Utils.escapeHtml(product.length);
        if (searchInput) searchInput.value = displayText;
        if (hiddenId) hiddenId.value = product.id;
        if (container) container.classList.remove('show');
        row.querySelector('.item-product-name').value = product.name || '';
        row.querySelector('.item-spec').value = product.spec || '';
        var unitEl = row.querySelector('.item-unit');
        if (unitEl) unitEl.value = product.unit || '';
        var priceField = row.querySelector('.item-unit-price');
        this.calcItemTotal(prefix, priceField);
        if (prefix === 'so') {
            this._loadStockoutWarehouses(row, product.id);
        }
    },

    hideProductSuggestions: function(input) {
        setTimeout(function() {
            var row = input.closest('.item-row');
            if (!row) return;
            var container = row.querySelector('.item-product-suggestions');
            if (container) container.classList.remove('show');
        }, 200);
    },
    /* ========== 通用自动补全搜索组件 ========== */
    _autocompleteData: {},
    _autocompleteActiveIndex: -1,

    showSuggestions: function(key, type, keyword) {
        var list = [];
        if (type === 'supplier') {
            if (key === 'po-supplier') {
                list = (Cache.suppliers || []).filter(function(s) { return s.type === 'FACTORY' || !s.type; });
            } else if (key === 'to-supplier') {
                list = (Cache.suppliers || []).filter(function(s) { return s.type === 'MARKET' || !s.type; });
            } else {
                list = Cache.suppliers || [];
            }
        } else if (type === 'customer') {
            list = (Cache.customers || []).slice();
            var marketSuppliers = (Cache.suppliers || []).filter(function(s) { return s.type === 'MARKET'; });
            list = list.concat(marketSuppliers);
        }
        keyword = (keyword || '').toLowerCase().trim();
        if (keyword) {
            list = list.filter(function(item) {
                return (item.name || '').toLowerCase().indexOf(keyword) >= 0 ||
                       (item.contactPerson || '').toLowerCase().indexOf(keyword) >= 0 ||
                       (item.phone || '').toLowerCase().indexOf(keyword) >= 0;
            });
        }
        this._autocompleteData[key] = list;
        this._autocompleteActiveIndex = -1;
        var container = document.getElementById(key + '-suggestions');
        if (!container) return;
        if (list.length === 0) {
            container.innerHTML = '<div class="autocomplete-empty">无匹配结果</div>';
            container.classList.add('show');
            return;
        }
        var html = '';
        list.forEach(function(item, idx) {
            var sub = '';
            if (item.contactPerson) sub += item.contactPerson;
            if (item.phone) sub += (sub ? ' | ' : '') + item.phone;
            var badge = '';
            if (item.type === 'MARKET' && type === 'customer') badge = ' <span style="color:var(--info);font-size:11px;">市场</span>';
            html += '<div class="autocomplete-item" data-id="' + item.id + '" data-idx="' + idx + '" onmousedown="Forms.selectSuggestion(\'' + key + '\', ' + item.id + ')">' +
                '<div class="autocomplete-item-name">' + Utils.escapeHtml(item.name || '') + badge + '</div>' +
                (sub ? '<div class="autocomplete-item-sub">' + Utils.escapeHtml(sub) + '</div>' : '') +
            '</div>';
        });
        container.innerHTML = html;
        container.classList.add('show');
    },

    hideSuggestions: function(key) {
        setTimeout(function() {
            var container = document.getElementById(key + '-suggestions');
            if (container) container.classList.remove('show');
        }, 200);
    },

    selectSuggestion: function(key, id) {
        var list = this._autocompleteData[key] || [];
        var item = list.find(function(i) { return i.id == id; });
        if (!item) return;
        var inputEl = document.getElementById(key + '-input');
        var hiddenEl = document.getElementById(key + '-hidden');
        if (inputEl) inputEl.value = item.name || '';
        if (hiddenEl) hiddenEl.value = item.id;
        var container = document.getElementById(key + '-suggestions');
        if (container) container.classList.remove('show');
        if (key === 'po-supplier') {
            this.onSupplierChange('po');
        } else if (key === 'to-supplier') {
            this.onSupplierChange('to');
        } else if (key === 'so-customer') {
            if (item.type === 'MARKET') {
                var existingCustomer = Cache.customers.find(function(c) { return c.name === item.name; });
                if (existingCustomer) {
                    if (inputEl) inputEl.value = existingCustomer.name || '';
                    if (hiddenEl) hiddenEl.value = existingCustomer.id;
                    this.onCustomerChange();
                } else {
                    var self = this;
                    Api.post('/api/customers', {
                        name: item.name,
                        phone: item.phone || '',
                        address: item.address || '',
                        remark: '从市场供应商转入'
                    }).then(function(customer) {
                        Cache.customers.push(customer);
                        if (inputEl) inputEl.value = customer.name || '';
                        if (hiddenEl) hiddenEl.value = customer.id;
                        self.onCustomerChange();
                    }).catch(function(e) {
                        UI.toast('创建客户失败: ' + e.message, 'error');
                    });
                }
            } else {
                this.onCustomerChange();
            }
        } else if (key === 'po-filter') {
            Pages.searchPurchaseOrders();
        } else if (key === 'so-filter') {
            Pages.searchSalesOrders();
        }
    },

    clearAutocomplete: function(key) {
        var hiddenEl = document.getElementById(key + '-hidden');
        if (hiddenEl) hiddenEl.value = '';
        var inputEl = document.getElementById(key + '-input');
        if (inputEl && !inputEl.value) {
            var container = document.getElementById(key + '-suggestions');
            if (container) container.classList.remove('show');
            if (key === 'po-filter') Pages.searchPurchaseOrders();
            else if (key === 'so-filter') Pages.searchSalesOrders();
        }
    },

    _loadStockoutWarehouses: function(row, productId) {
        Api.get('/api/warehouses/available-for-stockout', { productId: productId }).then(function(warehouses) {
            row.dataset.stockoutWarehouses = JSON.stringify(warehouses || []);
        }).catch(function() {
            row.dataset.stockoutWarehouses = '[]';
        });
    },

    calcItemTotal: function(prefix, input) {         var row = input.closest('.item-row');         var unitPrice = Utils.toNumber(row.querySelector('.item-unit-price').value);         var quantity = Utils.toNumber(row.querySelector('.item-quantity').value);         var weightEl = row.querySelector('.item-weight');         var weight = weightEl ? Utils.toNumber(weightEl.value) : 0;         var total;         if (prefix === 'po') {             total = unitPrice * weight;         } else if (prefix === 'so' || prefix === 'ro') {             total = weight > 0 ? unitPrice * weight : unitPrice * quantity;         } else {             total = unitPrice * quantity;         }         row.querySelector('.item-row-total-value').textContent = '\u00a5' + Utils.formatMoney(total);         this.calcOrderTotal(prefix);         this.updateAllocationSummary(row);     },

    calcOrderTotal: function(prefix) {
        var container = document.getElementById(prefix + '-items');
        if (!container) return;
        var itemsTotal = 0;
        container.querySelectorAll('.item-row').forEach(function(row) {
            var unitPrice = Utils.toNumber(row.querySelector('.item-unit-price').value);
            var quantity = Utils.toNumber(row.querySelector('.item-quantity').value);
            var weightEl = row.querySelector('.item-weight');             var weight = weightEl ? Utils.toNumber(weightEl.value) : 0;             if (prefix === 'po') {                 itemsTotal += unitPrice * weight;             } else if (prefix === 'so' || prefix === 'ro') {                 itemsTotal += weight > 0 ? unitPrice * weight : unitPrice * quantity;             } else {                 itemsTotal += unitPrice * quantity;             }
        });
        var formId = prefix === 'po' ? 'purchase-order-form' : (prefix === 'to' ? 'transfer-order-form' : (prefix === 'ro' ? 'return-order-form' : 'sales-order-form'));
        var form = document.getElementById(formId);
        var extra = 0, discount = 0;
        if (prefix === 'po' && form) {
            extra = Utils.toNumber(form.freight.value) + Utils.toNumber(form.packingFee.value) + Utils.toNumber(form.miscFee.value);
        } else if (prefix === 'so' && form) {
            extra = Utils.toNumber(form.freight.value) + Utils.toNumber(form.miscFee.value);
            discount = Utils.toNumber(form.discount.value);
        } else if (prefix === 'ro' && form) {
            extra = Utils.toNumber(form.freight.value) + Utils.toNumber(form.miscFee.value);
        }
        var grandTotal = itemsTotal + extra - discount;
        var summary = document.getElementById(prefix + '-summary');
        var html = '<div class="summary-row"><span class="summary-label">商品合计</span><span class="summary-value">&yen;' + Utils.formatMoney(itemsTotal) + '</span></div>';
        if (prefix === 'po' && form) {
            html += '<div class="summary-row"><span class="summary-label">运费</span><span class="summary-value">&yen;' + Utils.formatMoney(form.freight.value) + '</span></div>';
            html += '<div class="summary-row"><span class="summary-label">包装费</span><span class="summary-value">&yen;' + Utils.formatMoney(form.packingFee.value) + '</span></div>';
            html += '<div class="summary-row"><span class="summary-label">其他费用</span><span class="summary-value">&yen;' + Utils.formatMoney(form.miscFee.value) + '</span></div>';
        }
        if (prefix === 'so' && form) {
            html += '<div class="summary-row"><span class="summary-label">运费</span><span class="summary-value">&yen;' + Utils.formatMoney(form.freight.value) + '</span></div>';
            html += '<div class="summary-row"><span class="summary-label">杂费</span><span class="summary-value">&yen;' + Utils.formatMoney(form.miscFee.value) + '</span></div>';
            if (discount > 0) {
                html += '<div class="summary-row"><span class="summary-label">折扣</span><span class="summary-value text-danger">-&yen;' + Utils.formatMoney(discount) + '</span></div>';
            }
        }
        if (prefix === 'ro' && form) {
            html += '<div class="summary-row"><span class="summary-label">运费</span><span class="summary-value">&yen;' + Utils.formatMoney(form.freight.value) + '</span></div>';
            html += '<div class="summary-row"><span class="summary-label">其他费用</span><span class="summary-value">&yen;' + Utils.formatMoney(form.miscFee.value) + '</span></div>';
        }
        html += '<div class="summary-row total"><span class="summary-label">总计</span><span class="summary-value">&yen;' + Utils.formatMoney(grandTotal) + '</span></div>';
        summary.innerHTML = html;
    },

    onSupplierChange: function(prefix) {
        var hiddenEl = document.getElementById(prefix + '-supplier-hidden');
        var supplierId = hiddenEl ? hiddenEl.value : '';
        var supplier = Cache.suppliers.find(function(s) { return s.id == supplierId; });
        var balanceEl = document.getElementById(prefix + '-supplier-balance');
        if (supplier) {
            var contactEl = document.getElementById(prefix + '-contact');
            var phoneEl = document.getElementById(prefix + '-phone');
            if (contactEl) contactEl.value = supplier.contactPerson || '';
            if (phoneEl) phoneEl.value = supplier.phone || '';
            if (balanceEl) {
                var balance = Utils.toNumber(supplier.balance);
                if (balance > 0) {
                    balanceEl.innerHTML = '<span style="color:var(--danger);font-weight:500;">欠供应商: ¥' + Utils.formatMoney(balance) + '</span>';
                    balanceEl.style.display = 'block';
                } else if (balance < 0) {
                    balanceEl.innerHTML = '<span style="color:var(--success);font-weight:500;">供应商欠我们: ¥' + Utils.formatMoney(-balance) + '</span>';
                    balanceEl.style.display = 'block';
                } else {
                    balanceEl.style.display = 'none';
                }
            }
        } else {
            if (balanceEl) balanceEl.style.display = 'none';
        }
    },

    onCustomerChange: function() {
        var hiddenEl = document.getElementById('so-customer-hidden');
        var customerId = hiddenEl ? hiddenEl.value : '';
        var customer = Cache.customers.find(function(c) { return c.id == customerId; });
        var balanceEl = document.getElementById('so-customer-balance');
        if (customer) {
            document.getElementById('so-phone').value = customer.phone || '';
            document.getElementById('so-address').value = customer.address || '';
            if (balanceEl) {
                var balance = Utils.toNumber(customer.balance);
                if (balance > 0) {
                    balanceEl.innerHTML = '<span style="color:var(--danger);font-weight:500;">客户欠我们: ¥' + Utils.formatMoney(balance) + '</span>';
                    balanceEl.style.display = 'block';
                } else if (balance < 0) {
                    balanceEl.innerHTML = '<span style="color:var(--success);font-weight:500;">我们欠客户: ¥' + Utils.formatMoney(-balance) + '</span>';
                    balanceEl.style.display = 'block';
                } else {
                    balanceEl.style.display = 'none';
                }
            }
        } else {
            if (balanceEl) balanceEl.style.display = 'none';
        }
    },

    collectItems: function(prefix) {
        var container = document.getElementById(prefix + '-items');
        var items = [];
        var valid = true;
        var errorMsg = '';
        container.querySelectorAll('.item-row').forEach(function(row, idx) {
            var productId = row.querySelector('.item-product-id').value;
            var productName = row.querySelector('.item-product-name').value.trim();
            var spec = row.querySelector('.item-spec').value.trim();
            var unitEl = row.querySelector('.item-unit');
            var unit = unitEl ? unitEl.value.trim() : '';
            var unitPrice = Utils.toNumber(row.querySelector('.item-unit-price').value);
            var quantity = Utils.toNumber(row.querySelector('.item-quantity').value);
            var weightEl = row.querySelector('.item-weight');
            var weight = weightEl ? Utils.toNumber(weightEl.value) : 0;
            if (!productName) { valid = false; errorMsg = '第' + (idx + 1) + '行请填写商品名称'; return; }
            if (quantity <= 0) { valid = false; errorMsg = '第' + (idx + 1) + '行数量必须大于0'; return; }
            if (prefix === 'po' && weight <= 0) { valid = false; errorMsg = '第' + (idx + 1) + '行重量必须大于0'; return; }

            var allocations = [];
            row.querySelectorAll('.allocation-row').forEach(function(allocRow) {
                var whSelect = allocRow.querySelector('.allocation-warehouse');
                var whId = whSelect.value;
                var selectedOpt = whSelect.selectedOptions[0];
                var whName = selectedOpt ? (selectedOpt.dataset.name || selectedOpt.textContent.split(' (')[0]) : '';
                var allocQty = Utils.toNumber(allocRow.querySelector('.allocation-quantity').value);
                if (whId && allocQty > 0) {
                    allocations.push({
                        warehouseId: parseInt(whId),
                        warehouseName: whName,
                        quantity: allocQty
                    });
                }
            });

            if (allocations.length > 0) {
                var totalAllocated = allocations.reduce(function(sum, a) { return sum + a.quantity; }, 0);
                if (totalAllocated !== quantity) {
                    valid = false;
                    errorMsg = '第' + (idx + 1) + '行仓库分配总量(' + totalAllocated + ')与数量(' + quantity + ')不一致';
                    return;
                }
            }

            var itemTotal;
            if (prefix === 'po') {
                itemTotal = unitPrice * weight;
            } else if (prefix === 'so' || prefix === 'ro') {
                itemTotal = weight > 0 ? unitPrice * weight : unitPrice * quantity;
            } else {
                itemTotal = unitPrice * quantity;
            }
            items.push({
                productId: productId || null,
                productName: productName,
                spec: spec,
                unit: unit,
                unitPrice: unitPrice,
                quantity: quantity,
                weight: weight > 0 ? weight : null,
                totalAmount: itemTotal,
                allocations: allocations.length > 0 ? JSON.stringify(allocations) : null
            });
        });
        if (items.length === 0 && valid) { valid = false; errorMsg = '请至少添加一条商品明细'; }
        return { items: items, valid: valid, errorMsg: errorMsg };
    },

    /* ========== 进货单表单 ========== */
    openPurchaseOrderForm: function() {
        UI.showLoading();
        var self = this;
        Promise.all([Cache.loadProducts(), Cache.loadSuppliers('FACTORY'), Cache.loadWarehouses()]).then(function() {
            return Api.get('/api/warehouses/available-for-stockin');
        }).then(function(warehouses) {
            UI.hideLoading();
            self._stockinWarehouses = warehouses || [];
            Forms._showPurchaseOrderForm();
        }).catch(function() {
            UI.hideLoading();
            UI.toast('加载数据失败', 'error');
        });
    },

    _showPurchaseOrderForm: function() {
        var today = Utils.today();
        var html = '<form id="purchase-order-form" onsubmit="return false;">' +
            '<div class="form-group"><label class="form-label">供应商<span class="required">*</span></label>' +
                '<div class="autocomplete-wrapper"><input type="text" class="form-input" id="po-supplier-input" placeholder="搜索供应商..." oninput="Forms.showSuggestions(\'po-supplier\', \'supplier\', this.value); Forms.clearAutocomplete(\'po-supplier\')" onfocus="Forms.showSuggestions(\'po-supplier\', \'supplier\', this.value)" onblur="Forms.hideSuggestions(\'po-supplier\')" autocomplete="off"><input type="hidden" id="po-supplier-hidden" value=""><div class="autocomplete-suggestions" id="po-supplier-suggestions"></div></div></div>' +
            '<div id="po-supplier-balance" class="form-hint" style="display:none;"></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">联系人</label>' +
                '<input type="text" class="form-input" name="contactPerson" id="po-contact" placeholder="自动带入" readonly></div>' +
            '<div class="form-group"><label class="form-label">电话</label>' +
                '<input type="text" class="form-input" name="phone" id="po-phone" placeholder="自动带入" readonly></div></div>' +
            '<div class="form-group"><label class="form-label">进货日期<span class="required">*</span></label>' +
                '<input type="date" class="form-input" name="orderDate" value="' + today + '" required></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">运费</label>' +
                '<input type="number" step="0.01" class="form-input" name="freight" value="0" oninput="Forms.calcOrderTotal(\'po\')"></div>' +
            '<div class="form-group"><label class="form-label">包装费</label>' +
                '<input type="number" step="0.01" class="form-input" name="packingFee" value="0" oninput="Forms.calcOrderTotal(\'po\')"></div></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">其他费用</label>' +
                '<input type="number" step="0.01" class="form-input" name="miscFee" value="0" oninput="Forms.calcOrderTotal(\'po\')"></div>' +
            '<div class="form-group"><label class="form-label">已付金额</label>' +
                '<input type="number" step="0.01" class="form-input" name="paidAmount" value="0"></div></div>' +
            '<div class="form-group"><label class="form-label">支付方式</label><select class="form-select" name="payMethod">' +
                '<option value="CASH">现金</option><option value="WECHAT">微信</option><option value="ALIPAY">支付宝</option><option value="BANK">银行转账</option><option value="MONTHLY">月结</option></select></div>' +
            '<div class="section-title" style="padding-left:0;"><span>商品明细</span>' +
                '<button type="button" class="btn btn-outline btn-sm" onclick="Forms.addOrderItem(\'po\')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>添加</button></div>' +
            '<div class="item-rows" id="po-items"></div>' +
            '<div class="order-summary" id="po-summary"></div>' +
            '<div class="form-group mt-3"><label class="form-label">备注</label><textarea class="form-textarea" name="remark" placeholder="备注信息"></textarea></div>' +
        '</form>';
        UI.showModal('新建进货单', html,
            '<button class="btn btn-gray" style="flex:1" onclick="UI.hideModal()">取消</button>' +
            '<button class="btn btn-primary" style="flex:1" onclick="Forms.savePurchaseOrder()">提交</button>'
        );
        this.addOrderItem('po');
        this.calcOrderTotal('po');
    },

    savePurchaseOrder: function() {
        var form = document.getElementById('purchase-order-form');
        var supplierIdVal = document.getElementById('po-supplier-hidden').value;
        if (!supplierIdVal) { UI.toast('请选择供应商', 'warning'); return; }
        if (!form.orderDate.value) { UI.toast('请选择进货日期', 'warning'); return; }
        var collected = this.collectItems('po');
        if (!collected.valid) { UI.toast(collected.errorMsg, 'warning'); return; }
        var supplier = Cache.suppliers.find(function(s) { return s.id == supplierIdVal; });
        var itemsTotal = collected.items.reduce(function(sum, i) { return sum + i.totalAmount; }, 0);
        var extra = Utils.toNumber(form.freight.value) + Utils.toNumber(form.packingFee.value) + Utils.toNumber(form.miscFee.value);
        var data = {
            orderDate: form.orderDate.value,
            supplierId: parseInt(supplierIdVal),
            supplierName: supplier ? supplier.name : '',
            contactPerson: form.contactPerson.value,
            phone: form.phone.value,
            freight: Utils.toNumber(form.freight.value),
            packingFee: Utils.toNumber(form.packingFee.value),
            miscFee: Utils.toNumber(form.miscFee.value),
            payMethod: form.payMethod.value,
            paidAmount: Utils.toNumber(form.paidAmount.value),
            remark: form.remark.value.trim(),
            items: collected.items,
            totalAmount: itemsTotal,
            grandTotal: itemsTotal + extra
        };
        UI.showLoading();
        Api.post('/api/purchase-orders', data).then(function() {
            UI.hideLoading();
            UI.hideModal();
            UI.toast('进货单创建成功', 'success');
            Pages.purchaseOrders();
        }).catch(function(e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        });
    },

    /* ========== 调货单表单 ========== */
    openTransferOrderForm: function() {
        UI.showLoading();
        var self = this;
        Promise.all([Cache.loadProducts(), Cache.loadSuppliers('MARKET'), Cache.loadWarehouses()]).then(function() {
            return Api.get('/api/warehouses/available-for-stockin');
        }).then(function(warehouses) {
            UI.hideLoading();
            self._stockinWarehouses = warehouses || [];
            Forms._showTransferOrderForm();
        }).catch(function() {
            UI.hideLoading();
            UI.toast('加载数据失败', 'error');
        });
    },

    _showTransferOrderForm: function() {
        var today = Utils.today();
        var html = '<form id="transfer-order-form" onsubmit="return false;">' +
            '<div class="form-group"><label class="form-label">供应商<span class="required">*</span></label>' +
                '<div class="autocomplete-wrapper"><input type="text" class="form-input" id="to-supplier-input" placeholder="搜索供应商..." oninput="Forms.showSuggestions(\'to-supplier\', \'supplier\', this.value); Forms.clearAutocomplete(\'to-supplier\')" onfocus="Forms.showSuggestions(\'to-supplier\', \'supplier\', this.value)" onblur="Forms.hideSuggestions(\'to-supplier\')" autocomplete="off"><input type="hidden" id="to-supplier-hidden" value=""><div class="autocomplete-suggestions" id="to-supplier-suggestions"></div></div></div>' +
            '<div id="to-supplier-balance" class="form-hint" style="display:none;"></div>' +
            '<div class="form-group"><label class="form-label">调货日期<span class="required">*</span></label>' +
                '<input type="date" class="form-input" name="orderDate" value="' + today + '" required></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">调货类型</label><select class="form-select" name="transferType">' +
                '<option value="NORMAL">正常调货</option><option value="EXCHANGE">换货</option><option value="MAKEUP">补货</option><option value="TEMP_LOAN">暂借</option></select></div>' +
            '<div class="form-group"><label class="form-label">支付方式</label><select class="form-select" name="payMethod">' +
                '<option value="CASH">现金</option><option value="WECHAT">微信</option><option value="ALIPAY">支付宝</option><option value="BANK">银行转账</option><option value="MONTHLY">月结</option></select></div></div>' +
            '<div class="form-group"><label class="form-label">已付金额</label>' +
                '<input type="number" step="0.01" class="form-input" name="paidAmount" value="0"></div>' +
            '<div class="section-title" style="padding-left:0;"><span>商品明细</span>' +
                '<button type="button" class="btn btn-outline btn-sm" onclick="Forms.addOrderItem(\'to\')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>添加</button></div>' +
            '<div class="item-rows" id="to-items"></div>' +
            '<div class="order-summary" id="to-summary"></div>' +
            '<div class="form-group mt-3"><label class="form-label">备注</label><textarea class="form-textarea" name="remark" placeholder="备注信息"></textarea></div>' +
        '</form>';
        UI.showModal('新建调货单', html,
            '<button class="btn btn-gray" style="flex:1" onclick="UI.hideModal()">取消</button>' +
            '<button class="btn btn-primary" style="flex:1" onclick="Forms.saveTransferOrder()">提交</button>'
        );
        this.addOrderItem('to');
        this.calcOrderTotal('to');
    },

    saveTransferOrder: function() {
        var form = document.getElementById('transfer-order-form');
        var supplierIdVal = document.getElementById('to-supplier-hidden').value;
        if (!supplierIdVal) { UI.toast('请选择供应商', 'warning'); return; }
        if (!form.orderDate.value) { UI.toast('请选择调货日期', 'warning'); return; }
        var collected = this.collectItems('to');
        if (!collected.valid) { UI.toast(collected.errorMsg, 'warning'); return; }
        var supplier = Cache.suppliers.find(function(s) { return s.id == supplierIdVal; });
        var itemsTotal = collected.items.reduce(function(sum, i) { return sum + i.totalAmount; }, 0);
        var data = {
            orderDate: form.orderDate.value,
            supplierId: parseInt(supplierIdVal),
            supplierName: supplier ? supplier.name : '',
            transferType: form.transferType.value,
            payMethod: form.payMethod.value,
            paidAmount: Utils.toNumber(form.paidAmount.value),
            remark: form.remark.value.trim(),
            items: collected.items,
            totalAmount: itemsTotal
        };
        UI.showLoading();
        Api.post('/api/transfer-orders', data).then(function() {
            UI.hideLoading();
            UI.hideModal();
            UI.toast('调货单创建成功', 'success');
            if (Router.currentTab === 'more') Pages.transferOrders();
            else Router.goBack();
        }).catch(function(e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        });
    },

    /* ========== 退货单表单 ========== */
    openReturnOrderForm: function() {
        UI.showLoading();
        var self = this;
        Promise.all([Cache.loadProducts(), Cache.loadSuppliers(), Cache.loadCustomers(), Cache.loadWarehouses()]).then(function() {
            UI.hideLoading();
            Forms._showReturnOrderForm();
        }).catch(function() {
            UI.hideLoading();
            UI.toast('加载数据失败', 'error');
        });
    },

    _showReturnOrderForm: function() {
        var today = Utils.today();
        var html = '<form id="return-order-form" onsubmit="return false;">' +
            '<div class="form-group"><label class="form-label">退货类型<span class="required">*</span></label>' +
                '<select class="form-select" name="returnType" onchange="Forms.onReturnTypeChange()">' +
                    '<option value="SUPPLIER">退给供应商</option>' +
                    '<option value="CUSTOMER">客户退货</option>' +
                '</select></div>' +
            '<div class="form-group"><label class="form-label">退货对象<span class="required">*</span></label>' +
                '<div class="autocomplete-wrapper"><input type="text" class="form-input" id="ro-target-input" placeholder="搜索供应商..." oninput="Forms.clearAutocomplete(\'ro-target\'); Forms.onReturnTargetSearch(this.value)" onfocus="Forms.onReturnTargetSearch(this.value)" onblur="Forms.hideSuggestions(\'ro-target\')" autocomplete="off"><input type="hidden" id="ro-target-hidden" value=""><div class="autocomplete-suggestions" id="ro-target-suggestions"></div></div></div>' +
            '<div class="form-group"><label class="form-label">退货日期<span class="required">*</span></label>' +
                '<input type="date" class="form-input" name="orderDate" value="' + today + '" required></div>' +
            '<div class="form-group"><label class="form-label">仓库<span class="required">*</span></label>' +
                '<select class="form-select" name="warehouseId" id="ro-warehouse"><option value="">选择仓库</option></select></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">运费</label>' +
                '<input type="number" step="0.01" class="form-input" name="freight" value="0" oninput="Forms.calcOrderTotal(\'ro\')"></div>' +
            '<div class="form-group"><label class="form-label">其他费用</label>' +
                '<input type="number" step="0.01" class="form-input" name="miscFee" value="0" oninput="Forms.calcOrderTotal(\'ro\')"></div></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">已付金额</label>' +
                '<input type="number" step="0.01" class="form-input" name="paidAmount" value="0"></div>' +
            '<div class="form-group"><label class="form-label">支付方式</label><select class="form-select" name="payMethod">' +
                '<option value="CASH">现金</option><option value="WECHAT">微信</option><option value="ALIPAY">支付宝</option><option value="BANK">银行转账</option><option value="MONTHLY">月结</option></select></div></div>' +
            '<div class="section-title" style="padding-left:0;"><span>商品明细</span>' +
                '<button type="button" class="btn btn-outline btn-sm" onclick="Forms.addOrderItem(\'ro\')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>添加</button></div>' +
            '<div class="item-rows" id="ro-items"></div>' +
            '<div class="order-summary" id="ro-summary"></div>' +
            '<div class="form-group mt-3"><label class="form-label">备注</label><textarea class="form-textarea" name="remark" placeholder="备注信息"></textarea></div>' +
        '</form>';
        UI.showModal('新建退货单', html,
            '<button class="btn btn-gray" style="flex:1" onclick="UI.hideModal()">取消</button>' +
            '<button class="btn btn-primary" style="flex:1" onclick="Forms.saveReturnOrder()">提交</button>'
        );
        this._roTargetType = 'SUPPLIER';
        this.onReturnTypeChange();
        this.addOrderItem('ro');
        this.calcOrderTotal('ro');
    },

    onReturnTypeChange: function() {
        var form = document.getElementById('return-order-form');
        if (!form) return;
        var returnType = form.returnType.value;
        this._roTargetType = returnType;
        var inputEl = document.getElementById('ro-target-input');
        var hiddenEl = document.getElementById('ro-target-hidden');
        if (inputEl) { inputEl.value = ''; inputEl.placeholder = returnType === 'SUPPLIER' ? '搜索供应商...' : '搜索客户...'; }
        if (hiddenEl) hiddenEl.value = '';
        this._updateReturnWarehouses(returnType);
    },

    _updateReturnWarehouses: function(returnType) {
        var select = document.getElementById('ro-warehouse');
        if (!select) return;
        var warehouses = Cache.warehouses || [];
        if (returnType === 'CUSTOMER') {
            Api.get('/api/warehouses/available-for-stockin').then(function(whs) {
                whs = whs || [];
                var html = '<option value="">选择仓库</option>';
                whs.forEach(function(w) {
                    var remaining = Utils.toNumber(w.remainingCapacity);
                    var maxCap = Utils.toNumber(w.maxCapacity);
                    var info = maxCap > 0 ? ' (剩余' + Utils.formatMoney(remaining) + ')' : ' (无限制)';
                    html += '<option value="' + (w.warehouseId || w.id) + '">' + Utils.escapeHtml(w.warehouseName || w.name) + info + '</option>';
                });
                select.innerHTML = html;
            }).catch(function() {
                select.innerHTML = '<option value="">选择仓库</option>';
            });
        } else {
            var html = '<option value="">选择仓库</option>';
            warehouses.forEach(function(w) {
                html += '<option value="' + w.id + '">' + Utils.escapeHtml(w.name) + '</option>';
            });
            select.innerHTML = html;
        }
    },

    onReturnTargetSearch: function(keyword) {
        var list = [];
        if (this._roTargetType === 'SUPPLIER') {
            list = (Cache.suppliers || []).slice();
        } else {
            list = (Cache.customers || []).slice();
            var marketSuppliers = (Cache.suppliers || []).filter(function(s) { return s.type === 'MARKET'; });
            list = list.concat(marketSuppliers);
        }
        keyword = (keyword || '').toLowerCase().trim();
        if (keyword) {
            list = list.filter(function(item) {
                return (item.name || '').toLowerCase().indexOf(keyword) >= 0 ||
                       (item.contactPerson || '').toLowerCase().indexOf(keyword) >= 0 ||
                       (item.phone || '').toLowerCase().indexOf(keyword) >= 0;
            });
        }
        this._autocompleteData['ro-target'] = list;
        var container = document.getElementById('ro-target-suggestions');
        if (!container) return;
        if (list.length === 0) {
            container.innerHTML = '<div class="autocomplete-empty">无匹配结果</div>';
            container.classList.add('show');
            return;
        }
        var self = this;
        var html = '';
        list.forEach(function(item, idx) {
            var sub = '';
            if (item.contactPerson) sub += item.contactPerson;
            if (item.phone) sub += (sub ? ' | ' : '') + item.phone;
            var badge = '';
            if (item.type === 'MARKET' && self._roTargetType === 'CUSTOMER') badge = ' <span style="color:var(--info);font-size:11px;">市场</span>';
            html += '<div class="autocomplete-item" data-id="' + item.id + '" data-idx="' + idx + '" onmousedown="Forms.selectReturnTarget(' + item.id + ')">' +
                '<div class="autocomplete-item-name">' + Utils.escapeHtml(item.name || '') + badge + '</div>' +
                (sub ? '<div class="autocomplete-item-sub">' + Utils.escapeHtml(sub) + '</div>' : '') +
            '</div>';
        });
        container.innerHTML = html;
        container.classList.add('show');
    },

    selectReturnTarget: function(id) {
        var list = this._autocompleteData['ro-target'] || [];
        var item = list.find(function(i) { return i.id == id; });
        if (!item) return;
        var inputEl = document.getElementById('ro-target-input');
        var hiddenEl = document.getElementById('ro-target-hidden');
        if (inputEl) inputEl.value = item.name || '';
        if (hiddenEl) hiddenEl.value = item.id;
        var container = document.getElementById('ro-target-suggestions');
        if (container) container.classList.remove('show');
    },

    saveReturnOrder: function() {
        var form = document.getElementById('return-order-form');
        var targetIdVal = document.getElementById('ro-target-hidden').value;
        if (!targetIdVal) { UI.toast('请选择退货对象', 'warning'); return; }
        if (!form.orderDate.value) { UI.toast('请选择退货日期', 'warning'); return; }
        if (!form.warehouseId.value) { UI.toast('请选择仓库', 'warning'); return; }
        var collected = this.collectItems('ro');
        if (!collected.valid) { UI.toast(collected.errorMsg, 'warning'); return; }
        var itemsTotal = collected.items.reduce(function(sum, i) { return sum + i.totalAmount; }, 0);
        var extra = Utils.toNumber(form.freight.value) + Utils.toNumber(form.miscFee.value);
        var data = {
            orderDate: form.orderDate.value,
            returnType: form.returnType.value,
            targetId: parseInt(targetIdVal),
            warehouseId: parseInt(form.warehouseId.value),
            freight: Utils.toNumber(form.freight.value),
            miscFee: Utils.toNumber(form.miscFee.value),
            payMethod: form.payMethod.value,
            paidAmount: Utils.toNumber(form.paidAmount.value),
            remark: form.remark.value.trim(),
            items: collected.items,
            totalAmount: itemsTotal,
            grandTotal: itemsTotal + extra
        };
        UI.showLoading();
        Api.post('/api/return-orders', data).then(function() {
            UI.hideLoading();
            UI.hideModal();
            UI.toast('退货单创建成功', 'success');
            if (Router.currentTab === 'return') Pages.returnOrders();
            else Router.goBack();
        }).catch(function(e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        });
    },

    /* ========== 发货单表单 ========== */
    openSalesOrderForm: function() {
        UI.showLoading();
        Promise.all([Cache.loadProducts(), Cache.loadCustomers(), Cache.loadWarehouses(), Cache.loadSuppliers()]).then(function() {
            UI.hideLoading();
            Forms._showSalesOrderForm();
        }).catch(function() {
            UI.hideLoading();
            UI.toast('加载数据失败', 'error');
        });
    },

    _showSalesOrderForm: function() {
        var today = Utils.today();
        var html = '<form id="sales-order-form" onsubmit="return false;">' +
            '<div class="form-group"><label class="form-label">客户<span class="required">*</span></label>' +
                '<div class="autocomplete-wrapper"><input type="text" class="form-input" id="so-customer-input" placeholder="搜索客户..." oninput="Forms.showSuggestions(\'so-customer\', \'customer\', this.value); Forms.clearAutocomplete(\'so-customer\')" onfocus="Forms.showSuggestions(\'so-customer\', \'customer\', this.value)" onblur="Forms.hideSuggestions(\'so-customer\')" autocomplete="off"><input type="hidden" id="so-customer-hidden" value=""><div class="autocomplete-suggestions" id="so-customer-suggestions"></div></div></div>' +
            '<div id="so-customer-balance" class="form-hint" style="display:none;"></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">电话</label>' +
                '<input type="text" class="form-input" name="phone" id="so-phone" placeholder="自动带入" readonly></div>' +
            '<div class="form-group"><label class="form-label">地址</label>' +
                '<input type="text" class="form-input" name="address" id="so-address" placeholder="自动带入" readonly></div></div>' +
            '<div class="form-group"><label class="form-label">发货日期<span class="required">*</span></label>' +
                '<input type="date" class="form-input" name="orderDate" value="' + today + '" required></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">发货方式</label><select class="form-select" name="deliveryMethod">' +
                '<option value="SELF_PICKUP">自提</option><option value="DELIVERY">配送</option><option value="LOGISTICS">物流</option></select></div>' +
            '<div class="form-group"><label class="form-label">支付方式</label><select class="form-select" name="payMethod">' +
                '<option value="CASH">现金</option><option value="WECHAT">微信</option><option value="ALIPAY">支付宝</option><option value="BANK">银行转账</option><option value="MONTHLY">月结</option></select></div></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">运费</label>' +
                '<input type="number" step="0.01" class="form-input" name="freight" value="0" oninput="Forms.calcOrderTotal(\'so\')"></div>' +
            '<div class="form-group"><label class="form-label">杂费</label>' +
                '<input type="number" step="0.01" class="form-input" name="miscFee" value="0" oninput="Forms.calcOrderTotal(\'so\')"></div></div>' +
            '<div class="form-row"><div class="form-group"><label class="form-label">折扣</label>' +
                '<input type="number" step="0.01" class="form-input" name="discount" value="0" oninput="Forms.calcOrderTotal(\'so\')"></div>' +
            '<div class="form-group"><label class="form-label">已付金额</label>' +
                '<input type="number" step="0.01" class="form-input" name="paidAmount" value="0"></div></div>' +
            '<div class="section-title" style="padding-left:0;"><span>商品明细</span>' +
                '<button type="button" class="btn btn-outline btn-sm" onclick="Forms.addOrderItem(\'so\')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>添加</button></div>' +
            '<div class="item-rows" id="so-items"></div>' +
            '<div class="order-summary" id="so-summary"></div>' +
            '<div class="form-group mt-3"><label class="form-label">备注</label><textarea class="form-textarea" name="remark" placeholder="备注信息"></textarea></div>' +
        '</form>';
        UI.showModal('新建发货单', html,
            '<button class="btn btn-gray" style="flex:1" onclick="UI.hideModal()">取消</button>' +
            '<button class="btn btn-primary" style="flex:1" onclick="Forms.saveSalesOrder()">提交</button>'
        );
        this.addOrderItem('so');
        this.calcOrderTotal('so');
    },

    saveSalesOrder: function() {
        var form = document.getElementById('sales-order-form');
        var customerIdVal = document.getElementById('so-customer-hidden').value;
        if (!customerIdVal) { UI.toast('请选择客户', 'warning'); return; }
        if (!form.orderDate.value) { UI.toast('请选择发货日期', 'warning'); return; }
        var collected = this.collectItems('so');
        if (!collected.valid) { UI.toast(collected.errorMsg, 'warning'); return; }
        var customer = Cache.customers.find(function(c) { return c.id == customerIdVal; });
        var itemsTotal = collected.items.reduce(function(sum, i) { return sum + i.totalAmount; }, 0);
        var discount = Utils.toNumber(form.discount.value);
        var extra = Utils.toNumber(form.freight.value) + Utils.toNumber(form.miscFee.value);
        var data = {
            orderDate: form.orderDate.value,
            customerId: parseInt(customerIdVal),
            customerName: customer ? customer.name : '',
            phone: form.phone.value,
            address: form.address.value,
            freight: Utils.toNumber(form.freight.value),
            miscFee: Utils.toNumber(form.miscFee.value),
            discount: discount,
            payMethod: form.payMethod.value,
            paidAmount: Utils.toNumber(form.paidAmount.value),
            deliveryMethod: form.deliveryMethod.value,
            remark: form.remark.value.trim(),
            items: collected.items,
            totalAmount: itemsTotal,
            grandTotal: itemsTotal + extra - discount
        };
        UI.showLoading();
        Api.post('/api/sales-orders', data).then(function() {
            UI.hideLoading();
            UI.hideModal();
            UI.toast('发货单创建成功', 'success');
            Pages.salesOrders();
        }).catch(function(e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        });
    },

    /* ========== 收付款表单 ========== */
    openPaymentForm: function(direction, relatedId, amount) {
        var isReceive = direction === 'RECEIVABLE';
        var today = Utils.today();
        var html = '<form id="payment-form" onsubmit="return false;">' +
            '<input type="hidden" name="direction" value="' + direction + '">' +
            '<input type="hidden" name="relatedId" value="' + (relatedId || '') + '">' +
            '<div class="form-group"><label class="form-label">类型</label><div style="padding:4px 0;"><span class="badge ' + (isReceive ? 'badge-danger' : 'badge-warning') + '">' + (isReceive ? '应收收款' : '应付付款') + '</span></div></div>' +
            '<div class="form-group"><label class="form-label">金额<span class="required">*</span></label>' +
                '<input type="number" step="0.01" class="form-input" name="amount" value="' + (amount || '') + '" placeholder="请输入金额"></div>' +
            '<div class="form-group"><label class="form-label">支付方式</label><select class="form-select" name="payMethod">' +
                '<option value="CASH">现金</option><option value="WECHAT">微信</option><option value="ALIPAY">支付宝</option><option value="BANK">银行转账</option></select></div>' +
            '<div class="form-group"><label class="form-label">日期<span class="required">*</span></label>' +
                '<input type="date" class="form-input" name="payDate" value="' + today + '" required></div>' +
            '<div class="form-group"><label class="form-label">备注</label>' +
                '<textarea class="form-textarea" name="remark" placeholder="备注信息"></textarea></div>' +
        '</form>';
        UI.showModal(isReceive ? '收款登记' : '付款登记', html,
            '<button class="btn btn-gray" style="flex:1" onclick="UI.hideModal()">取消</button>' +
            '<button class="btn ' + (isReceive ? 'btn-success' : 'btn-primary') + '" style="flex:1" onclick="Forms.savePayment()">确认' + (isReceive ? '收款' : '付款') + '</button>'
        );
    },

    savePayment: function() {
        var form = document.getElementById('payment-form');
        var amount = Utils.toNumber(form.amount.value);
        if (amount <= 0) { UI.toast('请输入有效金额', 'warning'); return; }
        if (!form.payDate.value) { UI.toast('请选择日期', 'warning'); return; }
        var data = {
            direction: form.direction.value,
            relatedId: parseInt(form.relatedId.value),
            amount: amount,
            payMethod: form.payMethod.value,
            payDate: form.payDate.value,
            remark: form.remark.value.trim()
        };
        UI.showLoading();
        Api.post('/api/accounts/payment', data).then(function() {
            UI.hideLoading();
            UI.hideModal();
            UI.toast('登记成功', 'success');
            if (data.direction === 'RECEIVABLE') Pages.loadReceivables();
            else Pages.loadPayables();
        }).catch(function(e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        });
    },

    /* ========== 盘点表单 ========== */
    openStockCheckForm: function() {
        UI.showLoading();
        Cache.loadProducts().then(function() {
            UI.hideLoading();
            Forms._showStockCheckForm();
        }).catch(function() {
            UI.hideLoading();
            UI.toast('加载数据失败', 'error');
        });
    },

    _showStockCheckForm: function() {
        var today = Utils.today();
        var html = '<form id="stock-check-form" onsubmit="return false;">' +
            '<div class="form-row"><div class="form-group"><label class="form-label">盘点日期<span class="required">*</span></label>' +
                '<input type="date" class="form-input" name="checkDate" value="' + today + '" required></div>' +
            '<div class="form-group"><label class="form-label">盘点类型</label><select class="form-select" name="checkType">' +
                '<option value="DAILY">日盘</option><option value="MONTHLY">月盘</option></select></div></div>' +
            '<div class="form-group"><label class="form-label">备注</label>' +
                '<textarea class="form-textarea" name="remark" placeholder="备注信息"></textarea></div>' +
            '<div class="section-title" style="padding-left:0;"><span>盘点明细</span>' +
                '<button type="button" class="btn btn-outline btn-sm" onclick="Forms.addCheckItem()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>添加</button></div>' +
            '<div class="item-rows" id="check-items"></div>' +
        '</form>';
        UI.showModal('新建盘点', html,
            '<button class="btn btn-gray" style="flex:1" onclick="UI.hideModal()">取消</button>' +
            '<button class="btn btn-primary" style="flex:1" onclick="Forms.saveStockCheck()">提交</button>'
        );
        this.addCheckItem();
    },

    addCheckItem: function() {
        var container = document.getElementById('check-items');
        if (!container) return;
        var index = container.children.length;
        var productOpts = Cache.products.map(function(p) {
            return '<option value="' + p.id + '" data-name="' + Utils.escapeHtml(p.name) + '">' + Utils.escapeHtml(p.name) + (p.spec ? ' (' + Utils.escapeHtml(p.spec) + ')' : '') + '</option>';
        }).join('');
        var html = '<div class="item-row" data-index="' + index + '">' +
            '<div class="item-row-header"><span class="item-row-index">商品 ' + (index + 1) + '</span>' +
                '<button type="button" class="item-row-remove" onclick="Forms.removeCheckItem(this)">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>删除</button></div>' +
            '<div class="item-row-fields">' +
                '<div class="full"><select class="item-row-input" onchange="Forms.onCheckProductSelect(this)"><option value="">请选择商品</option>' + productOpts + '</select></div>' +
                '<input type="hidden" class="item-product-id" value="">' +
                '<input type="text" class="item-row-input item-product-name" placeholder="商品名称" value="" readonly>' +
                '<input type="number" step="0.01" class="item-row-input item-actual-stock" placeholder="实际库存" value="">' +
                '<input type="text" class="item-row-input item-check-remark" placeholder="备注" value="">' +
            '</div></div>';
        container.insertAdjacentHTML('beforeend', html);
    },

    removeCheckItem: function(btn) {
        btn.closest('.item-row').remove();
    },

    onCheckProductSelect: function(select) {
        var row = select.closest('.item-row');
        if (!select.value) return;
        var product = Cache.products.find(function(p) { return p.id == select.value; });
        if (product) {
            row.querySelector('.item-product-id').value = product.id;
            row.querySelector('.item-product-name').value = product.name || '';
        }
    },

    saveStockCheck: function() {
        var form = document.getElementById('stock-check-form');
        if (!form.checkDate.value) { UI.toast('请选择盘点日期', 'warning'); return; }
        var container = document.getElementById('check-items');
        var items = [];
        var valid = true;
        var errorMsg = '';
        container.querySelectorAll('.item-row').forEach(function(row, idx) {
            var productId = row.querySelector('.item-product-id').value;
            var productName = row.querySelector('.item-product-name').value.trim();
            var actualStock = Utils.toNumber(row.querySelector('.item-actual-stock').value);
            var remark = row.querySelector('.item-check-remark').value.trim();
            if (!productName) { valid = false; errorMsg = '第' + (idx + 1) + '行请选择商品'; return; }
                var itemTotal;                 if (prefix === 'po') {                     itemTotal = unitPrice * weight;                 } else if (prefix === 'so') {                     itemTotal = weight > 0 ? unitPrice * weight : unitPrice * quantity;                 } else {                     itemTotal = unitPrice * quantity;                 }
            items.push({ productId: productId || null, productName: productName, actualStock: actualStock, remark: remark });
        });
        if (items.length === 0 && valid) { valid = false; errorMsg = '请至少添加一条盘点明细'; }
        if (!valid) { UI.toast(errorMsg, 'warning'); return; }

        var data = {
            checkDate: form.checkDate.value,
            checkType: form.checkType.value,
            remark: form.remark.value.trim(),
            items: items
        };
        UI.showLoading();
        Api.post('/api/stock-checks', data).then(function() {
            UI.hideLoading();
            UI.hideModal();
            UI.toast('盘点提交成功', 'success');
            Pages.loadStockChecks();
        }).catch(function(e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        });
    }
};

/* ===== 应用入口 ===== */
var App = {
    init: function() {
        Router.switchTab('dashboard');
    },

    switchTab: function(tab) {
        Router.switchTab(tab);
    },

    goBack: function() {
        Router.goBack();
    }
};

/* 页面加载完成后初始化 */
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});