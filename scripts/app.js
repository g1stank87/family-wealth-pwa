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
  
  // ========== F006: 资产新增表单 ==========

  showAssetForm() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="form-header">
        <button class="btn-back" onclick="App.renderAssets()">← 返回</button>
        <h2>新增资产</h2>
      </div>
      
      <div class="card form-card">
        <form id="assetForm" onsubmit="App.saveAsset(event)">
          <div class="form-group">
            <label class="form-label">资产类型 *</label>
            <select class="form-input" id="assetType" required onchange="App.onTypeChange()">
              <option value="">请选择</option>
              <option value="selfUse">自用</option>
              <option value="investment">投资</option>
              <option value="financial">金融</option>
            </select>
          </div>
          
          <div class="form-group" id="categoryGroup" style="display:none;">
            <label class="form-label">资产分类 *</label>
            <select class="form-input" id="assetCategory">
              <option value="">请选择</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">城市</label>
            <input type="text" class="form-input" id="assetCity" placeholder="如：深圳">
          </div>
          
          <div class="form-group">
            <label class="form-label">资产名称 *</label>
            <input type="text" class="form-input" id="assetName" required placeholder="如：蔚蓝海岸花园">
          </div>
          
          <div class="form-group">
            <label class="form-label">买入年份 *</label>
            <input type="number" class="form-input" id="assetBuyYear" required 
                   min="1990" max="2030" value="${new Date().getFullYear()}">
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">单价（万元）</label>
              <input type="number" class="form-input" id="assetPricePerSqm" 
                     placeholder="如：5" min="0" step="0.1">
            </div>
            <div class="form-group">
              <label class="form-label">面积/数量</label>
              <input type="number" class="form-input" id="assetArea" 
                     placeholder="如：300" min="0" step="0.1">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">买入总价（万元）</label>
            <input type="number" class="form-input" id="assetTotalPrice" 
                   placeholder="自动计算或手动输入" min="0" step="0.1">
            <small class="form-hint">单价×面积，或直接输入总价</small>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.renderAssets()">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    `;
    
    // Auto-calculate total price
    const priceInput = document.getElementById('assetPricePerSqm');
    const areaInput = document.getElementById('assetArea');
    const totalInput = document.getElementById('assetTotalPrice');
    
    const calcTotal = () => {
      const price = parseFloat(priceInput.value) || 0;
      const area = parseFloat(areaInput.value) || 0;
      if (price && area) {
        totalInput.value = (price * area).toFixed(1);
      }
    };
    
    priceInput.addEventListener('input', calcTotal);
    areaInput.addEventListener('input', calcTotal);
  },

  onTypeChange() {
    const type = document.getElementById('assetType').value;
    const categoryGroup = document.getElementById('categoryGroup');
    const categorySelect = document.getElementById('assetCategory');
    
    const categories = {
      selfUse: [
        { value: 'selfUseRealEstate', label: '自用房产' },
        { value: 'selfUseVehicle', label: '自用车辆' },
        { value: 'selfUseOther', label: '自用其他' }
      ],
      investment: [
        { value: 'investmentRealEstate', label: '投资房产' },
        { value: 'investmentStock', label: '投资股票' },
        { value: 'investmentFund', label: '投资基金' }
      ],
      financial: [
        { value: 'stock', label: '股票' },
        { value: 'fund', label: '基金' },
        { value: 'bond', label: '债券' },
        { value: 'cash', label: '现金/存款' },
        { value: 'other', label: '其他' }
      ]
    };
    
    if (type && categories[type]) {
      categoryGroup.style.display = 'block';
      categorySelect.innerHTML = '<option value="">请选择</option>' + 
        categories[type].map(c => `<option value="${c.value}">${c.label}</option>`).join('');
    } else {
      categoryGroup.style.display = 'none';
      categorySelect.innerHTML = '<option value="">请选择</option>';
    }
  },

  saveAsset(event) {
    event.preventDefault();
    
    const type = document.getElementById('assetType').value;
    const category = document.getElementById('assetCategory').value;
    const city = document.getElementById('assetCity').value.trim();
    const name = document.getElementById('assetName').value.trim();
    const buyYear = parseInt(document.getElementById('assetBuyYear').value);
    const pricePerSqm = parseFloat(document.getElementById('assetPricePerSqm').value) || 0;
    const area = parseFloat(document.getElementById('assetArea').value) || 0;
    let totalPrice = parseFloat(document.getElementById('assetTotalPrice').value) || 0;
    
    // Validation
    if (!type) { alert('请选择资产类型'); return; }
    if (!name) { alert('请输入资产名称'); return; }
    
    // Auto-calculate total if not provided
    if (!totalPrice && pricePerSqm && area) {
      totalPrice = pricePerSqm * area;
    }
    
    // Generate ID
    const id = 'A' + String(this.data.assets.length + 1).padStart(3, '0');
    
    // Create asset object
    const asset = {
      id,
      type,
      category: category || 'other',
      city,
      name,
      buyYear,
      buyPricePerSqm: pricePerSqm,
      area,
      buyTotalPrice: totalPrice,
      initialized: false,
      initData: null
    };
    
    // Save
    this.data.assets.push(asset);
    DataLayer.save(this.data);
    
    // Return to list
    this.renderAssets();
  },
  
  showLiabilityForm() {
    alert('F014 负债新增 - 待实现');
  }
};
