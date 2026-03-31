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
