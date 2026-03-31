#!/bin/bash
# 家庭资产负债管理 PWA - 项目初始化脚本

set -e

PROJECT_DIR="$HOME/.openclaw/workspace/family-wealth-pwa"

echo "🏠 初始化家庭资产负债管理 PWA..."

cd "$PROJECT_DIR"

# 初始化 Git（如果尚未初始化）
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git add .
    git commit -m "🎉 Initial commit: 无限开发框架初始化

- 项目结构搭建
- feature_list.json (32 个功能)
- PROGRESS.md 进度跟踪
- 完整数据模型设计"
fi

# 创建目录结构
echo "📁 创建目录结构..."
mkdir -p assets/icons
mkdir -p styles
mkdir -p scripts/components
mkdir -p data

# 创建 PWA 入口文件
echo "🌐 创建 PWA Shell..."

cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#1a365d">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>家庭资产负债管理</title>
  <link rel="manifest" href="manifest.json">
  <link rel="stylesheet" href="styles/main.css">
</head>
<body>
  <div id="app">
    <header class="app-header">
      <h1>🏠 家庭资产负债管理</h1>
    </header>
    
    <main id="main-content">
      <!-- 路由内容注入位置 -->
    </main>
    
    <nav class="bottom-nav">
      <a href="#/assets" class="nav-item" data-route="assets">
        <span class="nav-icon">💰</span>
        <span class="nav-label">资产</span>
      </a>
      <a href="#/liabilities" class="nav-item" data-route="liabilities">
        <span class="nav-icon">📋</span>
        <span class="nav-label">负债</span>
      </a>
      <a href="#/reports" class="nav-item" data-route="reports">
        <span class="nav-icon">📊</span>
        <span class="nav-label">报表</span>
      </a>
      <a href="#/allocation" class="nav-item" data-route="allocation">
        <span class="nav-icon">📈</span>
        <span class="nav-label">配置</span>
      </a>
    </nav>
  </div>
  
  <script src="scripts/data-layer.js"></script>
  <script src="scripts/router.js"></script>
  <script src="scripts/app.js"></script>
  <script>
    // 注册 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SW registered'))
        .catch(err => console.log('SW registration failed:', err));
    }
    
    // 启动应用
    window.addEventListener('DOMContentLoaded', () => {
      App.init();
    });
  </script>
</body>
</html>
EOF

cat > manifest.json << 'EOF'
{
  "name": "家庭资产负债管理",
  "short_name": "家庭财富",
  "description": "家庭资产台账、负债管理、财务报表",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a365d",
  "orientation": "portrait",
  "icons": [
    {
      "src": "assets/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
EOF

cat > sw.js << 'EOF'
const CACHE_NAME = 'family-wealth-pwa-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/main.css',
  '/scripts/data-layer.js',
  '/scripts/router.js',
  '/scripts/app.js'
];

// 安装事件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活事件
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => caches.match('/index.html'))
  );
});
EOF

cat > styles/main.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary: #1a365d;
  --primary-light: #2c5282;
  --accent: #d69e2e;
  --bg: #f7fafc;
  --card-bg: #ffffff;
  --text: #2d3748;
  --text-light: #718096;
  --border: #e2e8f0;
  --success: #38a169;
  --danger: #e53e3e;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding-bottom: 60px;
}

.app-header {
  background: var(--primary);
  color: white;
  padding: 16px;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header h1 {
  font-size: 18px;
  font-weight: 600;
}

#main-content {
  padding: 16px;
  max-width: 100%;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--card-bg);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: var(--text-light);
  padding: 4px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-item.active {
  color: var(--primary);
  background: rgba(26, 54, 93, 0.1);
}

.nav-icon {
  font-size: 20px;
}

.nav-label {
  font-size: 11px;
  margin-top: 2px;
}

/* Card styles */
.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 12px;
}

/* Summary row */
.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-label {
  color: var(--text-light);
  font-size: 13px;
}

.summary-value {
  font-weight: 600;
  font-size: 14px;
}

.summary-value.positive {
  color: var(--success);
}

.summary-value.negative {
  color: var(--danger);
}

/* List styles */
.asset-list {
  list-style: none;
}

.asset-item {
  padding: 12px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.asset-item:last-child {
  border-bottom: none;
}

.asset-info {
  flex: 1;
}

.asset-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.asset-meta {
  font-size: 12px;
  color: var(--text-light);
}

.asset-value {
  text-align: right;
  font-weight: 500;
}

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:active {
  background: var(--primary-light);
}

.btn-danger {
  background: var(--danger);
  color: white;
}

/* FAB */
.fab {
  position: fixed;
  bottom: 76px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  cursor: pointer;
  border: none;
}

/* Form styles */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Year selector */
.year-selector {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 0;
  margin-bottom: 16px;
  -webkit-overflow-scrolling: touch;
}

.year-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--card-bg);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.year-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* Section header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 2px solid var(--primary);
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary);
}

.section-total {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
}
EOF

cat > scripts/data-layer.js << 'EOF'
// 数据层抽象 - LocalStorage 封装
const DataLayer = {
  STORAGE_KEY: 'family_wealth_data',
  
  // 默认数据结构
  defaults: {
    assets: [],
    liabilities: [],
    settings: {
      baseYear: 2023,
      currentYear: 2026,
      targetAllocation: {
        selfUse: 0.1,
        investment: 0.9,
        realAsset: 0.225,
        financial: 0.775
      }
    },
    initialized: false
  },
  
  // 加载数据
  load() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return { ...this.defaults };
  },
  
  // 保存数据
  save(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },
  
  // 初始化种子数据（从 Excel 导入的示例数据）
  initSeedData() {
    const seedAssets = [
      {
        id: 'A001',
        type: 'selfUse',
        category: 'selfUseRealEstate',
        city: '深圳',
        name: '蔚蓝海岸',
        buyYear: 2000,
        buyPricePerSqm: 5,
        area: 300,
        buyTotalPrice: 1500,
        initialized: true,
        initData: {
          cumulativeHoldReturn: -10,
          initTotalPrice: 3100,
          cumulativeDisposeReturn: 1600,
          cumulativeUtilizationRate: 1
        }
      },
      {
        id: 'A002',
        type: 'selfUse',
        category: 'selfUseRealEstate',
        city: '深圳',
        name: '天元',
        buyYear: 2019,
        buyPricePerSqm: 13,
        area: 1000,
        buyTotalPrice: 13000,
        initialized: true,
        initData: {
          cumulativeHoldReturn: 0,
          initTotalPrice: 13000,
          cumulativeDisposeReturn: 0,
          cumulativeUtilizationRate: 0.5
        }
      }
    ];
    
    const seedLiabilities = [
      {
        id: 'L001',
        type: 'bank',
        category: 'bankLiability',
        creditor: '建行',
        buyYear: 2000,
        interestRate: 0.08,
        borrowAmount: 20000,
        initialized: true,
        initData: {
          initBorrowAmount: 20000,
          cumulativeUnpaidInterest: 1000,
          cumulativePaidInterest: -29000
        }
      }
    ];
    
    const data = {
      assets: seedAssets,
      liabilities: seedLiabilities,
      settings: {
        baseYear: 2023,
        currentYear: 2026,
        targetAllocation: {
          selfUse: 0.1,
          investment: 0.9,
          realAsset: 0.225,
          financial: 0.775
        }
      },
      initialized: true
    };
    
    this.save(data);
    return data;
  }
};
EOF

cat > scripts/router.js << 'EOF'
// 简易 Hash 路由
const Router = {
  routes: {},
  
  // 注册路由
  register(path, handler) {
    this.routes[path] = handler;
  },
  
  // 导航
  navigate(path) {
    window.location.hash = path;
  },
  
  // 解析并执行路由
  resolve() {
    const hash = window.location.hash.slice(1) || '/assets';
    const handler = this.routes[hash];
    if (handler) {
      handler();
    } else {
      // 默认到资产页
      this.routes['/assets'] && this.routes['/assets']();
    }
  },
  
  // 初始化监听
  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }
};
EOF

cat > scripts/app.js << 'EOF'
// 主应用
const App = {
  data: null,
  
  init() {
    // 加载数据
    this.data = DataLayer.load();
    
    // 如果没有初始化数据，导入种子数据
    if (!this.data.initialized) {
      this.data = DataLayer.initSeedData();
    }
    
    // 注册路由
    Router.register('/assets', () => this.renderAssets());
    Router.register('/liabilities', () => this.renderLiabilities());
    Router.register('/reports', () => this.renderReports());
    Router.register('/allocation', () => this.renderAllocation());
    
    // 初始化路由
    Router.init();
    
    // 更新导航高亮
    this.updateNavHighlight();
    window.addEventListener('hashchange', () => this.updateNavHighlight());
    
    console.log('🏠 家庭资产负债管理 PWA 已启动');
  },
  
  updateNavHighlight() {
    const currentRoute = window.location.hash.slice(1) || '/assets';
    document.querySelectorAll('.nav-item').forEach(item => {
      const route = item.getAttribute('data-route');
      if (currentRoute.startsWith('/' + route)) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  },
  
  renderAssets() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="year-selector">
        ${[2023,2024,2025,2026,2027,2028].map(y => `
          <button class="year-btn ${y === this.data.settings.currentYear ? 'active' : ''}" 
                  data-year="${y}">${y}</button>
        `).join('')}
      </div>
      
      <div class="card">
        <div class="section-header">
          <span class="section-title">💰 实物资产</span>
          <span class="section-total">¥ ${this.formatMoney(this.getTotalAssets('real'))} 万</span>
        </div>
        <ul class="asset-list">
          ${this.data.assets.filter(a => a.type === 'selfUse' || a.type === 'investment').map(asset => `
            <li class="asset-item">
              <div class="asset-info">
                <div class="asset-name">${asset.name}</div>
                <div class="asset-meta">${asset.city} · ${asset.area}㎡</div>
              </div>
              <div class="asset-value">
                <div>¥ ${this.formatMoney(asset.buyTotalPrice)} 万</div>
                <div class="asset-meta">买入价</div>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
      
      <div class="card">
        <div class="section-header">
          <span class="section-title">💎 金融资产</span>
          <span class="section-total">¥ ${this.formatMoney(this.getTotalAssets('financial'))} 万</span>
        </div>
        <ul class="asset-list">
          ${this.data.assets.filter(a => a.type === 'financial').map(asset => `
            <li class="asset-item">
              <div class="asset-info">
                <div class="asset-name">${asset.name}</div>
                <div class="asset-meta">${asset.city || ''}</div>
              </div>
              <div class="asset-value">
                <div>¥ ${this.formatMoney(asset.buyTotalPrice)} 万</div>
              </div>
            </li>
          `).join('')}
          <li class="asset-item" style="color: var(--text-light); font-style: italic;">
            暂无金融资产记录
          </li>
        </ul>
      </div>
      
      <button class="fab" onclick="App.showAssetForm()">+</button>
    `;
    
    // 年份选择事件
    main.querySelectorAll('.year-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.data.settings.currentYear = parseInt(e.target.dataset.year);
        DataLayer.save(this.data);
        this.renderAssets();
      });
    });
  },
  
  renderLiabilities() {
    const main = document.getElementById('main-content');
    const totalLiabilities = this.getTotalLiabilities();
    
    main.innerHTML = `
      <div class="card">
        <div class="section-header">
          <span class="section-title">📋 负债总览</span>
          <span class="section-total negative">¥ ${this.formatMoney(totalLiabilities)} 万</span>
        </div>
        
        <div class="summary-row">
          <span class="summary-label">银行负债</span>
          <span class="summary-value negative">¥ ${this.formatMoney(this.getTotalLiabilitiesByType('bank'))} 万</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">非银行负债</span>
          <span class="summary-value negative">¥ ${this.formatMoney(this.getTotalLiabilitiesByType('nonBank'))} 万</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">私人负债</span>
          <span class="summary-value negative">¥ ${this.formatMoney(this.getTotalLiabilitiesByType('private'))} 万</span>
        </div>
      </div>
      
      <div class="card">
        <div class="section-header">
          <span class="section-title">🏦 银行负债</span>
        </div>
        <ul class="asset-list">
          ${this.data.liabilities.filter(l => l.type === 'bank').map(liability => `
            <li class="asset-item">
              <div class="asset-info">
                <div class="asset-name">${liability.creditor}</div>
                <div class="asset-meta">利率 ${(liability.interestRate * 100).toFixed(1)}% · 剩余 ${liability.remainingMonths || '-'} 月</div>
              </div>
              <div class="asset-value negative">
                <div>¥ ${this.formatMoney(liability.borrowAmount)} 万</div>
                <div class="asset-meta">借入</div>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
      
      <button class="fab" onclick="App.showLiabilityForm()">+</button>
    `;
  },
  
  renderReports() {
    const main = document.getElementById('main-content');
    const totalAssets = this.getTotalAssets('all');
    const totalLiabilities = this.getTotalLiabilities();
    const netAssets = totalAssets - totalLiabilities;
    
    main.innerHTML = `
      <div class="year-selector">
        ${[2023,2024,2025,2026].map(y => `
          <button class="year-btn ${y === this.data.settings.currentYear ? 'active' : ''}" 
                  data-year="${y}">${y}</button>
        `).join('')}
      </div>
      
      <div class="card">
        <div class="card-title">📊 资产负债表</div>
        <div class="summary-row">
          <span class="summary-label">资产合计</span>
          <span class="summary-value positive">¥ ${this.formatMoney(totalAssets)} 万</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">负债合计</span>
          <span class="summary-value negative">¥ ${this.formatMoney(totalLiabilities)} 万</span>
        </div>
        <div class="summary-row" style="border-top: 2px solid var(--primary); margin-top: 8px; padding-top: 12px;">
          <span class="summary-label" style="font-weight: 600;">净资产</span>
          <span class="summary-value ${netAssets >= 0 ? 'positive' : 'negative'}" style="font-size: 16px;">
            ¥ ${this.formatMoney(netAssets)} 万
          </span>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">🏠 资产构成</div>
        <div class="summary-row">
          <span class="summary-label">实物资产</span>
          <span class="summary-value">¥ ${this.formatMoney(this.getTotalAssets('real'))} 万</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">金融资产</span>
          <span class="summary-value">¥ ${this.formatMoney(this.getTotalAssets('financial'))} 万</span>
        </div>
      </div>
    `;
    
    main.querySelectorAll('.year-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.data.settings.currentYear = parseInt(e.target.dataset.year);
        DataLayer.save(this.data);
        this.renderReports();
      });
    });
  },
  
  renderAllocation() {
    const main = document.getElementById('main-content');
    const totalAssets = this.getTotalAssets('all');
    const selfUseAssets = this.getTotalAssets('selfUse');
    const investmentAssets = this.getTotalAssets('investment');
    const realAssets = this.getTotalAssets('real');
    const financialAssets = this.getTotalAssets('financial');
    
    main.innerHTML = `
      <div class="card">
        <div class="card-title">📈 资产配置（当前 vs 目标）</div>
        
        <div class="summary-row">
          <span class="summary-label">自用性 vs 投资性</span>
          <span class="summary-value">${totalAssets > 0 ? ((selfUseAssets/totalAssets)*100).toFixed(1) : 0}% / ${totalAssets > 0 ? ((investmentAssets/totalAssets)*100).toFixed(1) : 0}%</span>
        </div>
        <div class="summary-row">
          <span class="summary-label" style="padding-left: 16px; color: var(--text-light);">目标</span>
          <span class="summary-value" style="color: var(--text-light);">10% / 90%</span>
        </div>
        
        <div class="summary-row" style="margin-top: 12px;">
          <span class="summary-label">实物 vs 金融</span>
          <span class="summary-value">${totalAssets > 0 ? ((realAssets/totalAssets)*100).toFixed(1) : 0}% / ${totalAssets > 0 ? ((financialAssets/totalAssets)*100).toFixed(1) : 0}%</span>
        </div>
        <div class="summary-row">
          <span class="summary-label" style="padding-left: 16px; color: var(--text-light);">目标</span>
          <span class="summary-value" style="color: var(--text-light);">22.5% / 77.5%</span>
        </div>
      </div>
    `;
  },
  
  // ========== 计算方法 ==========
  
  getTotalAssets(category) {
    const year = this.data.settings.currentYear;
    return this.data.assets.reduce((sum, asset) => {
      if (category === 'all') return sum + (asset.buyTotalPrice || 0);
      if (category === 'real') {
        if (asset.type === 'selfUse' || asset.type === 'investment') {
          return sum + (asset.buyTotalPrice || 0);
        }
      }
      if (category === 'financial') {
        if (asset.type === 'financial') {
          return sum + (asset.buyTotalPrice || 0);
        }
      }
      if (category === 'selfUse') {
        if (asset.type === 'selfUse') return sum + (asset.buyTotalPrice || 0);
      }
      if (category === 'investment') {
        if (asset.type === 'investment') return sum + (asset.buyTotalPrice || 0);
      }
      return sum;
    }, 0);
  },
  
  getTotalLiabilities() {
    return this.data.liabilities.reduce((sum, l) => sum + (l.borrowAmount || 0), 0);
  },
  
  getTotalLiabilitiesByType(type) {
    return this.data.liabilities
      .filter(l => l.type === type)
      .reduce((sum, l) => sum + (l.borrowAmount || 0), 0);
  },
  
  formatMoney(num) {
    return (num || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  },
  
  // ========== 表单方法（占位）==========
  
  showAssetForm() {
    alert('F006 资产新增 - 待实现');
  },
  
  showLiabilityForm() {
    alert('F014 负债新增 - 待实现');
  }
};
EOF

echo "✅ PWA Shell 创建完成！"
echo ""
echo "📋 下一个 Feature: F001 (PWA 基础架构) - 已完成"
echo "📋 下一个 Feature: F002 (数据层基础架构) - 已完成"
echo "📋 下一个 Feature: F003 (SPA 路由系统) - 已完成"
echo "📋 下一个 Feature: F004 (移动端基础 UI 框架) - 已完成"
echo ""
echo "🚀 请运行: cd $PROJECT_DIR && npx serve ."
