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
  
  // ========== F005: 资产分组显示 ==========

  getGroupedAssets() {
    const categoryNames = {
      selfUseRealEstate: '自用房产',
      investmentRealEstate: '投资房产',
      stock: '股票',
      fund: '基金',
      bond: '债券',
      cash: '现金',
      other: '其他'
    };

    const typeNames = {
      selfUse: '自用',
      investment: '投资',
      financial: '金融'
    };

    const groups = {};
    this.data.assets.forEach(asset => {
      const type = asset.type || 'financial';
      const category = asset.category || 'other';
      const key = `${type}-${category}`;
      if (!groups[key]) {
        groups[key] = {
          type,
          category,
          typeName: typeNames[type] || type,
          categoryName: categoryNames[category] || category,
          assets: [],
          total: 0
        };
      }
      groups[key].assets.push(asset);
      groups[key].total += asset.buyTotalPrice || 0;
    });

    return Object.values(groups).sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.category.localeCompare(b.category);
    });
  },

  getTypeTotal(type) {
    return this.data.assets
      .filter(a => a.type === type)
      .reduce((sum, a) => sum + (a.buyTotalPrice || 0), 0);
  },

  renderAssets() {
    const main = document.getElementById('main-content');
    const groups = this.getGroupedAssets();
    const grandTotal = this.getTotalAssets('all');

    // 按大类分组
    const typeOrder = ['selfUse', 'investment', 'financial'];
    const typeGroups = {};
    typeOrder.forEach(t => { typeGroups[t] = []; });
    groups.forEach(g => {
      if (typeGroups[g.type]) typeGroups[g.type].push(g);
    });

    const renderGroup = (group) => `
      <div class="asset-group" data-type="${group.type}" data-category="${group.category}">
        <div class="group-header" onclick="App.toggleGroup('${group.type}-${group.category}')">
          <span class="group-title">${group.categoryName}</span>
          <span class="group-total">¥ ${this.formatMoney(group.total)} 万</span>
          <span class="group-chevron">▼</span>
        </div>
        <ul class="asset-list group-items" id="group-${group.type}-${group.category}">
          ${group.assets.map(asset => `
            <li class="asset-item" onclick="App.showAssetDetail('${asset.id}')">
              <div class="asset-info">
                <div class="asset-name">${asset.name}</div>
                <div class="asset-meta">${asset.city || ''} ${asset.area ? '· ' + asset.area + '㎡' : ''}</div>
              </div>
              <div class="asset-value">
                <div>¥ ${this.formatMoney(asset.buyTotalPrice)} 万</div>
                <div class="asset-meta">买入价</div>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;

    const renderTypeSection = (type, label, emoji) => {
      const items = typeGroups[type] || [];
      if (items.length === 0) return '';
      const typeTotal = this.getTypeTotal(type);
      return `
        <div class="card asset-type-section">
          <div class="type-header">
            <span class="type-title">${emoji} ${label}</span>
            <span class="type-total">¥ ${this.formatMoney(typeTotal)} 万</span>
          </div>
          ${items.map(g => renderGroup(g)).join('')}
        </div>
      `;
    };

    main.innerHTML = `
      <div class="year-selector">
        ${[2023,2024,2025,2026,2027,2028].map(y => `
          <button class="year-btn ${y === this.data.settings.currentYear ? 'active' : ''}" 
                  data-year="${y}">${y}</button>
        `).join('')}
      </div>
      
      ${renderTypeSection('selfUse', '实物资产', '🏠')}
      ${renderTypeSection('investment', '投资资产', '🏢')}
      ${renderTypeSection('financial', '金融资产', '💎')}
      
      <div class="card grand-total-card">
        <div class="grand-total">
          <span class="grand-total-label">📊 资产总计</span>
          <span class="grand-total-value">¥ ${this.formatMoney(grandTotal)} 万</span>
        </div>
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

  toggleGroup(key) {
    const items = document.getElementById(`group-${key}`);
    const header = items.previousElementSibling;
    const chevron = header.querySelector('.group-chevron');
    if (items.classList.contains('collapsed')) {
      items.classList.remove('collapsed');
      chevron.textContent = '▼';
    } else {
      items.classList.add('collapsed');
      chevron.textContent = '▶';
    }
  },

  showAssetDetail(assetId) {
    const asset = this.data.assets.find(a => a.id === assetId);
    if (!asset) return;
    alert(`资产详情: ${asset.name}\n类型: ${asset.type}\n城市: ${asset.city}\n买入价: ¥${this.formatMoney(asset.buyTotalPrice)}万\n面积: ${asset.area}㎡\n买入年份: ${asset.buyYear}`);
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
