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
  
  // ========== F005/F009: 资产分组显示 + 年度追踪 ==========

  getGroupedAssets() {
    const currentYear = this.data.settings.currentYear;
    
    const categoryNames = {
      // 自用
      selfUseRealEstate: '自用房产',
      selfUseVehicle: '自用车辆',
      selfUseOther: '自用其他',
      // 投资
      investmentRealEstate: '投资房产',
      investmentStock: '投资股票',
      investmentFund: '投资基金',
      // 金融
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
      // F009: 按年份过滤 - 只显示 buyYear <= currentYear 的资产
      if (asset.buyYear > currentYear) return;
      
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
          ${group.assets.map(asset => {
            const ret = this.calculateAssetReturn(asset);
            const returnDisplay = ret ? 
              `<div class="asset-return ${ret.totalReturn >= 0 ? 'positive' : 'negative'}">${ret.totalReturn >= 0 ? '+' : ''}${this.formatMoney(ret.totalReturn)} 万</div>` :
              '';
            return `
            <li class="asset-item" onclick="App.showAssetForm('${asset.id}')">
              <div class="asset-info">
                <div class="asset-name">${asset.name}${asset.initialized ? ' 📊' : ''}</div>
                <div class="asset-meta">${asset.city || ''} ${asset.area ? '· ' + asset.area + '㎡' : ''}</div>
                ${returnDisplay}
              </div>
              <div class="asset-value">
                <div>¥ ${this.formatMoney(asset.buyTotalPrice)} 万</div>
                <div class="asset-meta">买入价</div>
              </div>
            </li>
          `}).join('')}
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

  renderLiabilities() {
    const main = document.getElementById('main-content');
    const groups = this.getGroupedLiabilities();
    const grandTotal = this.getTotalLiabilities();
    
    const typeEmojis = {
      bank: '🏦',
      nonBank: '🏛️',
      private: '👤'
    };

    const renderGroup = (group) => `
      <div class="card liability-type-section">
        <div class="type-header">
          <span class="type-title">${typeEmojis[group.type] || '📋'} ${group.typeName}</span>
          <span class="type-total negative">¥ ${this.formatMoney(group.total)} 万</span>
        </div>
        <ul class="liability-list">
          ${group.liabilities.map(liability => `
            <li class="liability-item" onclick="App.showLiabilityForm('${liability.id}')">
              <div class="liability-info">
                <div class="liability-name">${liability.creditor}</div>
                <div class="liability-meta">
                  利率 ${(liability.interestRate * 100).toFixed(1)}% 
                  ${liability.remainingMonths ? '· 剩余 ' + liability.remainingMonths + ' 月' : ''}
                </div>
              </div>
              <div class="liability-value negative">
                <div>¥ ${this.formatMoney(liability.borrowAmount)} 万</div>
                <div class="liability-meta">借入</div>
              </div>
            </li>
          `).join('')}
          ${group.liabilities.length === 0 ? '<li class="empty-hint">暂无记录</li>' : ''}
        </ul>
      </div>
    `;

    main.innerHTML = `
      ${groups.map(g => renderGroup(g)).join('')}
      
      <div class="card grand-total-card">
        <div class="grand-total">
          <span class="grand-total-label">📊 负债总计</span>
          <span class="grand-total-value negative">¥ ${this.formatMoney(grandTotal)} 万</span>
        </div>
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
  
  // ========== F009: 计算方法（带年份过滤） ==========
  
  getTotalAssets(category) {
    const year = this.data.settings.currentYear;
    return this.data.assets.reduce((sum, asset) => {
      // F009: 按年份过滤
      if (asset.buyYear > year) return sum;
      
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

  // F012: 资产累计收益计算
  calculateAssetReturn(asset) {
    if (!asset || !asset.initialized || !asset.initData) {
      return null;
    }
    
    const initData = asset.initData;
    // 当前估值 = 买入价（简化处理）
    const currentValue = asset.buyTotalPrice || 0;
    // 持有收益 = 当前价值 - 初始化总价 + 累计持有收益
    const holdReturn = currentValue - (initData.initTotalPrice || 0) + (initData.cumulativeHoldReturn || 0);
    // 处置收益
    const disposeReturn = initData.cumulativeDisposeReturn || 0;
    // 总收益
    const totalReturn = holdReturn + disposeReturn;
    
    return {
      currentValue,
      holdReturn,
      disposeReturn,
      totalReturn,
      initialized: asset.initialized
    };
  },

  // ========== F013: 负债分组显示 ==========

  getGroupedLiabilities() {
    const typeNames = {
      bank: '银行负债',
      nonBank: '非银行负债',
      private: '私人负债'
    };

    const groups = {};
    this.data.liabilities.forEach(liability => {
      const type = liability.type || 'bank';
      if (!groups[type]) {
        groups[type] = {
          type,
          typeName: typeNames[type] || type,
          liabilities: [],
          total: 0
        };
      }
      groups[type].liabilities.push(liability);
      groups[type].total += liability.borrowAmount || 0;
    });

    return Object.values(groups);
  },

  getTotalLiabilitiesByType(type) {
    return this.data.liabilities
      .filter(l => l.type === type)
      .reduce((sum, l) => sum + (l.borrowAmount || 0), 0);
  },
  
  // ========== F006/F007: 资产表单（新增+编辑） ==========

  showAssetForm(assetId) {
    const isEditMode = !!assetId;
    const asset = isEditMode ? this.data.assets.find(a => a.id === assetId) : null;
    
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="form-header">
        <button class="btn-back" onclick="App.renderAssets()">← 返回</button>
        <h2>${isEditMode ? '编辑资产' : '新增资产'}</h2>
      </div>
      
      <div class="card form-card">
        <form id="assetForm" onsubmit="App.saveAsset(event, '${assetId || ''}')">
          <input type="hidden" id="editAssetId" value="${assetId || ''}">
          
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
                   min="1990" max="2030" value="${asset ? asset.buyYear : new Date().getFullYear()}">
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
          
          ${isEditMode ? `
          <div class="form-section-title">📋 初始化数据（历史成本基准）</div>
          <div class="init-section">
            <div class="form-group">
              <label class="form-label">初始化总价（万元）</label>
              <input type="number" class="form-input" id="initTotalPrice" 
                     placeholder="历史成本基准" min="0" step="0.1">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">累计持有收益（万元）</label>
                <input type="number" class="form-input" id="cumulativeHoldReturn" 
                       placeholder="正值=盈利，负值=亏损" step="0.1">
              </div>
              <div class="form-group">
                <label class="form-label">累计处置收益（万元）</label>
                <input type="number" class="form-input" id="cumulativeDisposeReturn" 
                       placeholder="处置时产生" step="0.1">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">累计使用率</label>
              <input type="number" class="form-input" id="cumulativeUtilizationRate" 
                     placeholder="0-1，如：0.5表示50%自用" min="0" max="1" step="0.1">
            </div>
            <div class="init-status">
              <span id="initStatusText">${asset && asset.initialized ? '✅ 已初始化' : '❌ 未初始化'}</span>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-danger" onclick="App.deleteAsset('${assetId}')">删除</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
          ` : `
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.renderAssets()">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
          `}
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
    
    // If edit mode, load existing data
    if (isEditMode && asset) {
      this.loadAssetForEdit(asset);
    }
  },

  loadAssetForEdit(asset) {
    document.getElementById('assetType').value = asset.type || '';
    document.getElementById('assetCity').value = asset.city || '';
    document.getElementById('assetName').value = asset.name || '';
    document.getElementById('assetBuyYear').value = asset.buyYear || new Date().getFullYear();
    document.getElementById('assetPricePerSqm').value = asset.buyPricePerSqm || '';
    document.getElementById('assetArea').value = asset.area || '';
    document.getElementById('assetTotalPrice').value = asset.buyTotalPrice || '';
    
    // F011: Load initialization data
    if (asset.initData) {
      document.getElementById('initTotalPrice').value = asset.initData.initTotalPrice || '';
      document.getElementById('cumulativeHoldReturn').value = asset.initData.cumulativeHoldReturn || '';
      document.getElementById('cumulativeDisposeReturn').value = asset.initData.cumulativeDisposeReturn || '';
      document.getElementById('cumulativeUtilizationRate').value = asset.initData.cumulativeUtilizationRate || '';
    }
    
    // Trigger type change to populate categories
    if (asset.type) {
      this.onTypeChange();
      setTimeout(() => {
        document.getElementById('assetCategory').value = asset.category || '';
      }, 50);
    }
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

  saveAsset(event, editAssetId) {
    event.preventDefault();
    
    const editId = editAssetId || document.getElementById('editAssetId').value;
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
    
    // F011: Get initialization data
    const initTotalPrice = parseFloat(document.getElementById('initTotalPrice')?.value) || 0;
    const cumulativeHoldReturn = parseFloat(document.getElementById('cumulativeHoldReturn')?.value) || 0;
    const cumulativeDisposeReturn = parseFloat(document.getElementById('cumulativeDisposeReturn')?.value) || 0;
    const cumulativeUtilizationRate = parseFloat(document.getElementById('cumulativeUtilizationRate')?.value) || 0;
    
    const hasInitData = initTotalPrice || cumulativeHoldReturn || cumulativeDisposeReturn || cumulativeUtilizationRate;
    
    if (editId) {
      // Update existing asset
      const index = this.data.assets.findIndex(a => a.id === editId);
      if (index !== -1) {
        const existingAsset = this.data.assets[index];
        this.data.assets[index] = {
          ...existingAsset,
          type,
          category: category || 'other',
          city,
          name,
          buyYear,
          buyPricePerSqm: pricePerSqm,
          area,
          buyTotalPrice: totalPrice,
          // F011: Save initialization data
          initialized: hasInitData,
          initData: hasInitData ? {
            initTotalPrice,
            cumulativeHoldReturn,
            cumulativeDisposeReturn,
            cumulativeUtilizationRate
          } : existingAsset.initData
        };
      }
    } else {
      // Create new asset
      const id = 'A' + String(this.data.assets.length + 1).padStart(3, '0');
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
      this.data.assets.push(asset);
    }
    
    DataLayer.save(this.data);
    this.renderAssets();
  },

  deleteAsset(assetId) {
    if (!confirm('确定要删除这个资产吗？')) return;
    
    const index = this.data.assets.findIndex(a => a.id === assetId);
    if (index !== -1) {
      this.data.assets.splice(index, 1);
      DataLayer.save(this.data);
    }
    this.renderAssets();
  },
  
  // ========== F014/F015: 负债表单（新增+编辑） ==========

  showLiabilityForm(liabilityId) {
    const isEditMode = !!liabilityId;
    const liability = isEditMode ? this.data.liabilities.find(l => l.id === liabilityId) : null;
    
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="form-header">
        <button class="btn-back" onclick="App.renderLiabilities()">← 返回</button>
        <h2>${isEditMode ? '编辑负债' : '新增负债'}</h2>
      </div>
      
      <div class="card form-card">
        <form id="liabilityForm" onsubmit="App.saveLiability(event, '${liabilityId || ''}')">
          <input type="hidden" id="editLiabilityId" value="${liabilityId || ''}">
          
          <div class="form-group">
            <label class="form-label">负债类型 *</label>
            <select class="form-input" id="liabilityType" required>
              <option value="">请选择</option>
              <option value="bank" ${liability && liability.type === 'bank' ? 'selected' : ''}>银行负债</option>
              <option value="nonBank" ${liability && liability.type === 'nonBank' ? 'selected' : ''}>非银行负债</option>
              <option value="private" ${liability && liability.type === 'private' ? 'selected' : ''}>私人负债</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">债权人名称 *</label>
            <input type="text" class="form-input" id="liabilityCreditor" required 
                   placeholder="如：建设银行" value="${liability ? liability.creditor || '' : ''}">
          </div>
          
          <div class="form-group">
            <label class="form-label">借入年份 *</label>
            <input type="number" class="form-input" id="liabilityBuyYear" required 
                   min="1990" max="2030" value="${liability ? liability.buyYear || new Date().getFullYear() : new Date().getFullYear()}">
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">年利率</label>
              <input type="number" class="form-input" id="liabilityInterestRate" 
                     placeholder="如：5 表示 5%" min="0" max="100" step="0.1"
                     value="${liability ? (liability.interestRate * 100) || '' : ''}">
            </div>
            <div class="form-group">
              <label class="form-label">剩余期限（月）</label>
              <input type="number" class="form-input" id="liabilityRemainingMonths" 
                     placeholder="如：240" min="0">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">借入金额（万元） *</label>
            <input type="number" class="form-input" id="liabilityBorrowAmount" required 
                   placeholder="如：5000" min="0" step="0.1"
                   value="${liability ? liability.borrowAmount || '' : ''}">
          </div>
          
          ${isEditMode ? `
          <div class="form-section-title">📋 初始化数据</div>
          <div class="init-section">
            <div class="form-group">
              <label class="form-label">初始借入金额（万元）</label>
              <input type="number" class="form-input" id="initBorrowAmount" 
                     placeholder="历史借入本金" min="0" step="0.1">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">累计未付利息（万元）</label>
                <input type="number" class="form-input" id="cumulativeUnpaidInterest" 
                       placeholder="正值=未付" step="0.1">
              </div>
              <div class="form-group">
                <label class="form-label">累计已付利息（万元）</label>
                <input type="number" class="form-input" id="cumulativePaidInterest" 
                       placeholder="负值=已付" step="0.1">
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-danger" onclick="App.deleteLiability('${liabilityId}')">删除</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
          ` : `
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.renderLiabilities()">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
          `}
        </form>
      </div>
    `;
    
    // F015: Load init data if editing
    if (isEditMode && liability && liability.initData) {
      document.getElementById('initBorrowAmount').value = liability.initData.initBorrowAmount || '';
      document.getElementById('cumulativeUnpaidInterest').value = liability.initData.cumulativeUnpaidInterest || '';
      document.getElementById('cumulativePaidInterest').value = liability.initData.cumulativePaidInterest || '';
    }
  },

  saveLiability(event, editLiabilityId) {
    event.preventDefault();
    
    const editId = editLiabilityId || document.getElementById('editLiabilityId').value;
    const type = document.getElementById('liabilityType').value;
    const creditor = document.getElementById('liabilityCreditor').value.trim();
    const buyYear = parseInt(document.getElementById('liabilityBuyYear').value);
    const interestRate = parseFloat(document.getElementById('liabilityInterestRate').value) / 100 || 0;
    const remainingMonths = parseInt(document.getElementById('liabilityRemainingMonths').value) || 0;
    const borrowAmount = parseFloat(document.getElementById('liabilityBorrowAmount').value) || 0;
    
    // Validation
    if (!type) { alert('请选择负债类型'); return; }
    if (!creditor) { alert('请输入债权人名称'); return; }
    if (!borrowAmount) { alert('请输入借入金额'); return; }
    
    // F018: Get init data
    const initBorrowAmount = parseFloat(document.getElementById('initBorrowAmount')?.value) || 0;
    const cumulativeUnpaidInterest = parseFloat(document.getElementById('cumulativeUnpaidInterest')?.value) || 0;
    const cumulativePaidInterest = parseFloat(document.getElementById('cumulativePaidInterest')?.value) || 0;
    
    const hasInitData = initBorrowAmount || cumulativeUnpaidInterest || cumulativePaidInterest;
    
    if (editId) {
      // Update existing liability
      const index = this.data.liabilities.findIndex(l => l.id === editId);
      if (index !== -1) {
        const existing = this.data.liabilities[index];
        this.data.liabilities[index] = {
          ...existing,
          type,
          creditor,
          buyYear,
          interestRate,
          remainingMonths,
          borrowAmount,
          initialized: hasInitData,
          initData: hasInitData ? {
            initBorrowAmount,
            cumulativeUnpaidInterest,
            cumulativePaidInterest
          } : existing.initData
        };
      }
    } else {
      // Create new liability
      const id = 'L' + String(this.data.liabilities.length + 1).padStart(3, '0');
      const liability = {
        id,
        type,
        creditor,
        buyYear,
        interestRate,
        remainingMonths,
        borrowAmount,
        initialized: false,
        initData: null
      };
      this.data.liabilities.push(liability);
    }
    
    DataLayer.save(this.data);
    this.renderLiabilities();
  },

  deleteLiability(liabilityId) {
    if (!confirm('确定要删除这个负债吗？')) return;
    
    const index = this.data.liabilities.findIndex(l => l.id === liabilityId);
    if (index !== -1) {
      this.data.liabilities.splice(index, 1);
      DataLayer.save(this.data);
    }
    this.renderLiabilities();
  }
};
