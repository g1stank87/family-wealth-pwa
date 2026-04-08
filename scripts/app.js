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
      
      <div class="export-bar">
        <button class="btn btn-secondary" onclick="App.exportToExcel()">📥 导出 Excel</button>
        <button class="btn btn-secondary" onclick="App.showImportExcel()">📤 导入 Excel</button>
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
          ${group.liabilities.map(liability => {
            const interest = this.calculateLiabilityInterest(liability);
            return `
            <li class="liability-item" onclick="App.showLiabilityForm('${liability.id}')">
              <div class="liability-info">
                <div class="liability-name">${liability.creditor}${liability.initialized ? ' 📊' : ''}</div>
                <div class="liability-meta">
                  年利率 ${(interest.interestRate * 100).toFixed(1)}% 
                  ${liability.remainingMonths ? '· 剩余 ' + liability.remainingMonths + ' 月' : ''}
                </div>
                <div class="liability-interest">
                  年利息: <span class="negative">¥ ${this.formatMoney(interest.annualInterest)} 万</span>
                </div>
              </div>
              <div class="liability-value negative">
                <div>¥ ${this.formatMoney(liability.borrowAmount)} 万</div>
                <div class="liability-meta">借入</div>
              </div>
            </li>
          `}).join('')}
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
  
  // ========== F019: 财务报表-资产负债表 ==========

  getBalanceSheetData(year) {
    const typeNames = {
      selfUse: '自用资产',
      investment: '投资资产',
      financial: '金融资产'
    };

    const categoryNames = {
      selfUseRealEstate: '自用房产',
      selfUseVehicle: '自用车辆',
      selfUseOther: '自用其他',
      investmentRealEstate: '投资房产',
      investmentStock: '投资股票',
      investmentFund: '投资基金',
      stock: '股票',
      fund: '基金',
      bond: '债券',
      cash: '现金/存款',
      other: '其他'
    };

    const liabilityTypeNames = {
      bank: '银行负债',
      nonBank: '非银行负债',
      private: '私人负债'
    };

    // Group assets by type then category
    const assetGroups = {};
    this.data.assets.forEach(asset => {
      if (asset.buyYear > year) return;
      const type = asset.type || 'financial';
      const category = asset.category || 'other';
      if (!assetGroups[type]) assetGroups[type] = {};
      if (!assetGroups[type][category]) {
        assetGroups[type][category] = {
          name: categoryNames[category] || category,
          items: [],
          total: 0
        };
      }
      assetGroups[type][category].items.push(asset);
      assetGroups[type][category].total += asset.buyTotalPrice || 0;
    });

    // Group liabilities by type
    const liabilityGroups = {};
    this.data.liabilities.forEach(l => {
      if (l.buyYear > year) return;
      const type = l.type || 'bank';
      if (!liabilityGroups[type]) {
        liabilityGroups[type] = {
          name: liabilityTypeNames[type] || type,
          items: [],
          total: 0
        };
      }
      liabilityGroups[type].items.push(l);
      liabilityGroups[type].total += l.borrowAmount || 0;
    });

    // Calculate totals
    let totalAssets = 0;
    const assetTypeTotals = {};
    Object.keys(assetGroups).forEach(type => {
      assetTypeTotals[type] = 0;
      Object.keys(assetGroups[type]).forEach(cat => {
        assetTypeTotals[type] += assetGroups[type][cat].total;
      });
      totalAssets += assetTypeTotals[type];
    });

    let totalLiabilities = 0;
    const liabilityTypeTotals = {};
    Object.keys(liabilityGroups).forEach(type => {
      liabilityTypeTotals[type] = liabilityGroups[type].total;
      totalLiabilities += liabilityTypeTotals[type];
    });

    const netAssets = totalAssets - totalLiabilities;

    return {
      assetGroups,
      assetTypeTotals,
      totalAssets,
      liabilityGroups,
      liabilityTypeTotals,
      totalLiabilities,
      netAssets,
      typeNames,
      year
    };
  },

  // ========== F020: 财务报表-收益表 ==========

  getIncomeStatementData(year) {
    // 持有收益：已初始化资产的累计持有收益（简化处理：取全量，未来可按年度分解）
    let totalHoldReturn = 0;
    let totalDisposeReturn = 0;

    this.data.assets.forEach(asset => {
      if (asset.buyYear > year) return;
      if (asset.initialized && asset.initData) {
        totalHoldReturn += asset.initData.cumulativeHoldReturn || 0;
        totalDisposeReturn += asset.initData.cumulativeDisposeReturn || 0;
      }
    });

    // 利息支出：已初始化负债的累计已付利息（负数）
    let totalInterestExpense = 0;
    this.data.liabilities.forEach(l => {
      if (l.buyYear > year) return;
      if (l.initialized && l.initData) {
        totalInterestExpense += l.initData.cumulativePaidInterest || 0;
      }
    });

    // 净收益 = 持有收益 + 处置收益 - 利息支出（利息支出是负数，所以减）
    const netIncome = totalHoldReturn + totalDisposeReturn + totalInterestExpense;

    return {
      totalHoldReturn,
      totalDisposeReturn,
      totalInterestExpense: Math.abs(totalInterestExpense),
      netIncome,
      year
    };
  },

  renderReports() {
    const main = document.getElementById('main-content');
    const year = this.data.settings.currentYear;
    const reportType = this.data.settings.reportType || 'balance';

    // Tab switch header
    const html = `
      <div class="report-header">
        <div class="page-title">📊 ${year} 年财务报表</div>
        <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px;" onclick="App.exportToPDF()">📄 PDF导出</button>
      </div>

      <div class="year-selector">
        ${[2023,2024,2025,2026,2027,2028,2029,2030].map(y => `
          <button class="year-btn ${y === year ? 'active' : ''}"
                  data-year="${y}">${y}</button>
        `).join('')}
      </div>

      <div class="report-tabs">
        <button class="report-tab ${reportType === 'balance' ? 'active' : ''}"
                onclick="App.switchReport('balance')">
          🏛️ 资产负债表
        </button>
        <button class="report-tab ${reportType === 'income' ? 'active' : ''}"
                onclick="App.switchReport('income')">
          📈 收益表
        </button>
        <button class="report-tab ${reportType === 'compare' ? 'active' : ''}"
                onclick="App.switchReport('compare')">
          📊 对比
        </button>
      </div>

      <div id="report-content">
        ${reportType === 'balance' ? this.renderBalanceSheetHTML(year) : reportType === 'income' ? this.renderIncomeStatementHTML(year) : this.renderComparisonHTML()}
      </div>
    `;

    main.innerHTML = html;

    // Year selector events
    main.querySelectorAll('.year-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.data.settings.currentYear = parseInt(e.target.dataset.year);
        DataLayer.save(this.data);
        this.renderReports();
      });
    });
  },

  switchReport(type) {
    this.data.settings.reportType = type;
    DataLayer.save(this.data);
    this.renderReports();
  },

  renderBalanceSheetHTML(year) {
    const bs = this.getBalanceSheetData(year);
    const typeOrder = ['selfUse', 'investment', 'financial'];
    const liabilityTypeOrder = ['bank', 'nonBank', 'private'];

    const renderAssetSection = () => {
      return typeOrder.map(type => {
        const categories = bs.assetGroups[type];
        if (!categories) return '';
        const typeTotal = bs.assetTypeTotals[type] || 0;
        const typeName = bs.typeNames[type] || type;
        const typeEmoji = type === 'selfUse' ? '🏠' : type === 'investment' ? '🏢' : '💎';

        const catRows = Object.keys(categories).map(catKey => {
          const cat = categories[catKey];
          return `<div class="bs-row bs-sub-row"><span class="bs-name">${cat.name}</span><span class="bs-value">¥ ${this.formatMoney(cat.total)} 万</span></div>`;
        }).join('');

        return `<div class="bs-section" data-type="${type}"><div class="bs-section-header" onclick="App.toggleBsSection('asset-${type}')"><span class="bs-section-title">${typeEmoji} ${typeName}</span><span class="bs-section-total">¥ ${this.formatMoney(typeTotal)} 万</span><span class="bs-chevron">▼</span></div><div class="bs-section-body" id="bs-asset-${type}">${catRows}</div></div>`;
      }).join('');
    };

    const renderLiabilitySection = () => {
      return liabilityTypeOrder.map(type => {
        const group = bs.liabilityGroups[type];
        if (!group) return '';
        const typeTotal = bs.liabilityTypeTotals[type] || 0;
        const typeName = group.name;
        const typeEmoji = type === 'bank' ? '🏦' : type === 'nonBank' ? '🏛️' : '👤';

        const itemRows = group.items.map(l => `<div class="bs-row bs-sub-row"><span class="bs-name">${l.creditor}</span><span class="bs-value negative">¥ ${this.formatMoney(l.borrowAmount)} 万</span></div>`).join('');

        return `<div class="bs-section" data-type="${type}"><div class="bs-section-header" onclick="App.toggleBsSection('liability-${type}')"><span class="bs-section-title">${typeEmoji} ${typeName}</span><span class="bs-section-total negative">¥ ${this.formatMoney(typeTotal)} 万</span><span class="bs-chevron">▼</span></div><div class="bs-section-body" id="bs-liability-${type}">${itemRows}</div></div>`;
      }).join('');
    };

    return `
      <div class="card bs-card">
        <div class="bs-card-header"><span class="bs-card-title">💰 资产</span></div>
        ${renderAssetSection()}
        <div class="bs-total-row">
          <span class="bs-total-label">资产合计</span>
          <span class="bs-total-value positive">¥ ${this.formatMoney(bs.totalAssets)} 万</span>
        </div>
      </div>

      <div class="card bs-card">
        <div class="bs-card-header"><span class="bs-card-title">📋 负债</span></div>
        ${renderLiabilitySection()}
        <div class="bs-total-row">
          <span class="bs-total-label">负债合计</span>
          <span class="bs-total-value negative">¥ ${this.formatMoney(bs.totalLiabilities)} 万</span>
        </div>
      </div>

      <div class="card bs-card bs-net-card">
        <div class="bs-total-row net">
          <span class="bs-total-label">📐 净资产</span>
          <span class="bs-total-value ${bs.netAssets >= 0 ? 'positive' : 'negative'}">¥ ${this.formatMoney(bs.netAssets)} 万</span>
        </div>
        <div class="bs-formula">净资产 = 资产合计（¥ ${this.formatMoney(bs.totalAssets)} 万） - 负债合计（¥ ${this.formatMoney(bs.totalLiabilities)} 万）</div>
      </div>

      <div class="data-source-note">💡 数据自动汇总自资产台账、负债台账</div>
    `;
  },

  renderIncomeStatementHTML(year) {
    const is = this.getIncomeStatementData(year);

    const itemCard = (emoji, title, value, note, isPositive) => `
      <div class="income-item">
        <div class="income-item-header">
          <span class="income-emoji">${emoji}</span>
          <span class="income-title">${title}</span>
        </div>
        <div class="income-value ${isPositive ? 'positive' : 'negative'}">¥ ${this.formatMoney(value)} 万</div>
        ${note ? `<div class="income-note">${note}</div>` : ''}
      </div>
    `;

    return `
      <div class="card income-card">
        <div class="card-title">📈 ${year} 年收益表</div>

        ${itemCard('🏠', '持有收益', is.totalHoldReturn, '资产持有期间的价值增长/缩水 + 现金收益', true)}
        ${itemCard('🏦', '处置收益', is.totalDisposeReturn, '历史处置资产的已实现盈亏', true)}
        ${itemCard('📉', '利息支出', is.totalInterestExpense, '负债历年已付利息（累计值）', false)}

        <div class="income-divider"></div>

        <div class="income-net">
          <div class="income-net-label">📊 净收益</div>
          <div class="income-net-value ${is.netIncome >= 0 ? 'positive' : 'negative'}">
            ¥ ${this.formatMoney(is.netIncome)} 万
          </div>
          <div class="income-formula">
            净收益 = 持有收益（¥${this.formatMoney(is.totalHoldReturn)} 万）
                   + 处置收益（¥${this.formatMoney(is.totalDisposeReturn)} 万）
                   - 利息支出（¥${this.formatMoney(is.totalInterestExpense)} 万）
          </div>
        </div>
      </div>

      <div class="card income-breakdown">
        <div class="card-title">💡 收益构成说明</div>
        <div class="income-explain">
          <div class="explain-item"><span class="explain-badge positive">+</span> 持有收益：房产增值、租金、股票分红等</div>
          <div class="explain-item"><span class="explain-badge positive">+</span> 处置收益：卖掉资产时的已实现盈亏</div>
          <div class="explain-item"><span class="explain-badge negative">−</span> 利息支出：房贷等负债的已付利息总和</div>
        </div>
      </div>

      <div class="data-source-note">💡 数据来自已初始化的资产/负债记录</div>
    `;
  },

  renderComparisonHTML() {
    const years = [2023, 2024, 2025, 2026];
    const compData = years.map(y => ({
      year: y,
      bs: this.getBalanceSheetData(y),
      is: this.getIncomeStatementData(y)
    }));

    const metrics = [
      { key: 'totalAssets', label: '资产合计', bs: true, is: false, pos: 'positive' },
      { key: 'totalLiabilities', label: '负债合计', bs: true, is: false, pos: 'negative' },
      { key: 'netAssets', label: '净资产', bs: true, is: false, pos: 'neutral' },
      { key: 'netIncome', label: '净收益', bs: false, is: true, pos: 'neutral' },
      { key: 'totalHoldReturn', label: '持有收益', bs: false, is: true, pos: 'positive' },
      { key: 'totalInterestExpense', label: '利息支出', bs: false, is: true, pos: 'negative' }
    ];

    const trendArrow = (current, prev) => {
      if (current > prev) return '<span class="trend-up">↑</span>';
      if (current < prev) return '<span class="trend-down">↓</span>';
      return '<span class="trend-flat">−</span>';
    };

    const valueClass = (val, pos) => {
      if (pos === 'neutral') return '';
      if (pos === 'positive') return val >= 0 ? ' positive' : ' negative';
      if (pos === 'negative') return val >= 0 ? ' positive' : ' negative';
      return '';
    };

    const metricRow = (metric) => {
      const cells = compData.map((d, i) => {
        let val;
        if (metric.bs) {
          val = metric.key === 'totalAssets' ? d.bs.totalAssets :
                metric.key === 'totalLiabilities' ? d.bs.totalLiabilities :
                d.bs.netAssets;
        } else {
          val = metric.key === 'netIncome' ? d.is.netIncome :
                metric.key === 'totalHoldReturn' ? d.is.totalHoldReturn :
                d.is.totalInterestExpense;
        }
        const prevVal = i > 0 ? (metric.bs ?
          (metric.key === 'totalAssets' ? compData[i-1].bs.totalAssets :
           metric.key === 'totalLiabilities' ? compData[i-1].bs.totalLiabilities :
           compData[i-1].bs.netAssets) :
          (metric.key === 'netIncome' ? compData[i-1].is.netIncome :
           metric.key === 'totalHoldReturn' ? compData[i-1].is.totalHoldReturn :
           compData[i-1].is.totalInterestExpense)) : null;
        const trend = prevVal !== null ? trendArrow(val, prevVal) : '';
        const cls = valueClass(val, metric.pos);
        return `<td class="comp-cell${cls}">¥ ${this.formatMoney(val)} 万 ${trend}</td>`;
      }).join('');

      return `<tr class="comp-row"><td class="comp-label">${metric.label}</td>${cells}</tr>`;
    };

    const yearHeaders = compData.map(d => `<th class="comp-year-header">${d.year}</th>`).join('');

    return `
      <div class="card comp-card">
        <div class="card-title">📊 多年度对比（2023-2026）</div>
        <div class="comp-table-wrapper">
          <table class="comp-table">
            <thead>
              <tr>
                <th class="comp-label-col"></th>
                ${yearHeaders}
              </tr>
            </thead>
            <tbody>
              ${metrics.map(m => metricRow(m)).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card trend-summary">
        <div class="card-title">📈 趋势分析</div>
        ${years.map((y, i) => {
          if (i === 0) return '';
          const prev = compData[i-1];
          const curr = compData[i];
          const netAssetChange = curr.bs.netAssets - prev.bs.netAssets;
          const netIncome = curr.is.netIncome;
          const dir = netAssetChange >= 0 ? '↑' : '↓';
          return `
            <div class="trend-row">
              <span class="trend-year">${prev.year} → ${y}</span>
              <span class="trend-text">净资产 ${dir} ¥ ${this.formatMoney(Math.abs(netAssetChange))} 万</span>
              <span class="trend-income ${netIncome >= 0 ? 'positive' : 'negative'}">净收益 ¥ ${this.formatMoney(netIncome)} 万</span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="card growth-rate">
        <div class="card-title">🏆 ${years[years.length-1]} 年增长率</div>
        ${(() => {
          const last = compData[compData.length-1];
          const prev = compData[compData.length-2];
          const assetGrowth = prev.bs.totalAssets > 0
            ? ((last.bs.totalAssets - prev.bs.totalAssets) / prev.bs.totalAssets * 100).toFixed(1)
            : '0.0';
          const netAssetGrowth = prev.bs.netAssets > 0
            ? ((last.bs.netAssets - prev.bs.netAssets) / prev.bs.netAssets * 100).toFixed(1)
            : '0.0';
          return `
            <div class="growth-row">
              <div class="growth-item">
                <div class="growth-label">资产增长率</div>
                <div class="growth-value">${assetGrowth}%</div>
              </div>
              <div class="growth-item">
                <div class="growth-label">净资产增长率</div>
                <div class="growth-value ${parseFloat(netAssetGrowth) >= 0 ? 'positive' : 'negative'}">${netAssetGrowth}%</div>
              </div>
            </div>
          `;
        })()}
      </div>
    `;
  },

  toggleBsSection(id) {
    const body = document.getElementById(`bs-${id}`);
    const header = body.previousElementSibling;
    const chevron = header.querySelector('.bs-chevron');
    if (!body || !chevron) return;
    if (body.classList.contains('collapsed')) {
      body.classList.remove('collapsed');
      chevron.textContent = '▼';
    } else {
      body.classList.add('collapsed');
      chevron.textContent = '▶';
    }
  },
  
  renderAllocation() {
    const main = document.getElementById('main-content');
    const totalAssets = this.getTotalAssets('all');
    const selfUseAssets = this.getTotalAssets('selfUse');
    const investmentAssets = this.getTotalAssets('investment');
    const realAssets = this.getTotalAssets('real');
    const financialAssets = this.getTotalAssets('financial');

    const selfUsePct = totalAssets > 0 ? (selfUseAssets / totalAssets * 100) : 0;
    const investPct = totalAssets > 0 ? (investmentAssets / totalAssets * 100) : 0;
    const realPct = totalAssets > 0 ? (realAssets / totalAssets * 100) : 0;
    const finPct = totalAssets > 0 ? (financialAssets / totalAssets * 100) : 0;

    // Target allocation
    const targets = this.data.settings.targetAllocation || {
      selfUse: 0.1, investment: 0.9, realAsset: 0.225, financial: 0.775
    };
    const targetSelfUse = targets.selfUse * 100;
    const targetInvest = targets.investment * 100;
    const targetReal = targets.realAsset * 100;
    const targetFin = targets.financial * 100;

    // Check deviations
    const selfUseDev = Math.abs(selfUsePct - targetSelfUse);
    const investDev = Math.abs(investPct - targetInvest);
    const realDev = Math.abs(realPct - targetReal);
    const finDev = Math.abs(finPct - targetFin);
    const maxDev = Math.max(selfUseDev, investDev, realDev, finDev);

    // Deviation warning levels
    const WARN_THRESHOLD = 15;
    const CAUTION_THRESHOLD = 7.5;
    let warningLevel = null;
    let warningItems = [];
    if (selfUseDev > WARN_THRESHOLD) { warningLevel = 'danger'; warningItems.push(`自用资产偏离 +${selfUseDev.toFixed(1)}%`); }
    else if (selfUseDev > CAUTION_THRESHOLD) { warningLevel = warningLevel || 'caution'; warningItems.push(`自用资产偏离 +${selfUseDev.toFixed(1)}%`); }
    if (investDev > WARN_THRESHOLD) { warningLevel = 'danger'; warningItems.push(`投资资产偏离 +${investDev.toFixed(1)}%`); }
    else if (investDev > CAUTION_THRESHOLD) { warningLevel = warningLevel || 'caution'; warningItems.push(`投资资产偏离 +${investDev.toFixed(1)}%`); }
    if (realDev > WARN_THRESHOLD) { warningLevel = 'danger'; warningItems.push(`实物资产偏离 +${realDev.toFixed(1)}%`); }
    else if (realDev > CAUTION_THRESHOLD) { warningLevel = warningLevel || 'caution'; warningItems.push(`实物资产偏离 +${realDev.toFixed(1)}%`); }
    if (finDev > WARN_THRESHOLD) { warningLevel = 'danger'; warningItems.push(`金融资产偏离 +${finDev.toFixed(1)}%`); }
    else if (finDev > CAUTION_THRESHOLD) { warningLevel = warningLevel || 'caution'; warningItems.push(`金融资产偏离 +${finDev.toFixed(1)}%`); }

    const warningBanner = warningLevel ? `
      <div class="alloc-warning alloc-warning-${warningLevel}" id="allocWarning">
        <div class="alloc-warning-content">
          <div class="alloc-warning-icon">${warningLevel === 'danger' ? '🚨' : '⚠️'}</div>
          <div class="alloc-warning-text">
            <div class="alloc-warning-title">${warningLevel === 'danger' ? '配置严重偏离' : '配置轻微偏离'}</div>
            <div class="alloc-warning-detail">${warningItems.join('、')}</div>
          </div>
        </div>
        <button class="alloc-warning-close" onclick="App.dismissWarning()">×</button>
      </div>
    ` : '';

    // SVG donut chart helper
    const makeDonut = (pct1, color1, color2, label1, label2, val1, val2) => {
      const r = 60, circ = 2 * Math.PI * r;
      const dash1 = (pct1 / 100) * circ;
      const dash2 = ((100 - pct1) / 100) * circ;
      return `
        <div class="donut-wrapper">
          <svg class="donut" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="${r}" fill="none" stroke="${color2}" stroke-width="24"/>
            <circle cx="80" cy="80" r="${r}" fill="none" stroke="${color1}" stroke-width="24"
              stroke-dasharray="${dash1} ${dash2}" stroke-dashoffset="${circ * 0.25}"
              style="transition: stroke-dasharray 0.5s ease"/>
          </svg>
          <div class="donut-center">
            <div class="donut-pct">${pct1.toFixed(1)}%</div>
            <div class="donut-label">${label1}</div>
          </div>
        </div>
        <div class="donut-legend">
          <div class="donut-legend-item">
            <span class="donut-dot" style="background:${color1}"></span>
            <span class="donut-legend-label">${label1}</span>
            <span class="donut-legend-val">¥ ${this.formatMoney(val1)} 万</span>
          </div>
          <div class="donut-legend-item">
            <span class="donut-dot" style="background:${color2}"></span>
            <span class="donut-legend-label">${label2}</span>
            <span class="donut-legend-val">¥ ${this.formatMoney(val2)} 万</span>
          </div>
        </div>
      `;
    };

    const deviationBadge = (dev) => {
      if (dev > WARN_THRESHOLD) return '<span class="dev-warn">⚠️ 偏离</span>';
      if (dev > CAUTION_THRESHOLD) return '<span class="dev-note">🟡 轻微偏离</span>';
      return '<span class="dev-ok">✅ 达标</span>';
    };

    // F025: Trend chart data
    const trendYears = [2023, 2024, 2025, 2026];
    const trendData = trendYears.map(y => this.getBalanceSheetData(y));
    const assetLine = trendData.map(d => d.totalAssets);
    const liabLine = trendData.map(d => d.totalLiabilities);
    const netLine = trendData.map(d => d.netAssets);

    const chartW = 320, chartH = 160, padL = 10, padR = 10, padT = 10, padB = 30;
    const plotW = chartW - padL - padR;
    const plotH = chartH - padT - padB;
    const allVals = [...assetLine, ...liabLine, ...netLine];
    const maxVal = Math.max(...allVals.filter(v => v > 0), 1);
    const minVal = Math.min(...allVals.filter(v => v < 0), 0);
    const range = maxVal - minVal || 1;

    const xPos = (i) => padL + (i / (trendYears.length - 1)) * plotW;
    const yPos = (v) => padT + (1 - (v - minVal) / range) * plotH;

    const buildPath = (vals) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(v).toFixed(1)}`).join(' ');
    const buildDots = (vals) => vals.map((v, i) => `<circle cx="${xPos(i).toFixed(1)}" cy="${yPos(v).toFixed(1)}" r="3" fill="currentColor"/>`).join('');

    // F026: Income contribution data
    const is = this.getIncomeStatementData(this.data.settings.currentYear);
    const contribMax = Math.max(Math.abs(is.totalHoldReturn), Math.abs(is.totalDisposeReturn), Math.abs(is.totalInterestExpense), Math.abs(is.netIncome)) || 1;

    const contribBar = (label, value, color, note) => {
      const pct = Math.abs(value) / contribMax * 100;
      const isNeg = value < 0;
      return `<div class="contrib-row"><div class="contrib-label">${label}</div><div class="contrib-bar-wrapper"><div class="contrib-bar-bg"><div class="contrib-bar-fill ${isNeg ? 'fill-neg' : 'fill-pos'}" style="width:${pct.toFixed(1)}%; background:${color}; ${isNeg ? 'margin-left:auto' : ''}"></div></div><div class="contrib-val ${value >= 0 ? 'positive' : 'negative'}">¥ ${this.formatMoney(value)} 万 <span class="contrib-note">${note}</span></div></div></div>`;
    };

    main.innerHTML = `
      <div class="page-title">📈 资产配置看板</div>
      ${warningBanner}
      <div class="card donut-card">
        <div class="card-title">🏠 自用性 vs 投资性</div>
        <div class="donut-row">
          ${makeDonut(selfUsePct, '#1a365d', '#d69e2e', '自用', '投资', selfUseAssets, investmentAssets)}
        </div>
        <div class="dev-row">
          <div class="dev-label">当前</div>
          <div class="dev-target">
            <span>${selfUsePct.toFixed(1)}% / ${investPct.toFixed(1)}%</span>
            ${deviationBadge(Math.max(selfUseDev, investDev))}
          </div>
          <div class="dev-label">目标</div>
          <div class="dev-target">${targetSelfUse.toFixed(1)}% / ${targetInvest.toFixed(1)}%</div>
        </div>
      </div>

      <div class="card donut-card">
        <div class="card-title">🏗️ 实物 vs 金融资产</div>
        <div class="donut-row">
          ${makeDonut(realPct, '#2c5282', '#38a169', '实物', '金融', realAssets, financialAssets)}
        </div>
        <div class="dev-row">
          <div class="dev-label">当前</div>
          <div class="dev-target">
            <span>${realPct.toFixed(1)}% / ${finPct.toFixed(1)}%</span>
            ${deviationBadge(Math.max(realDev, finDev))}
          </div>
          <div class="dev-label">目标</div>
          <div class="dev-target">${targetReal.toFixed(1)}% / ${targetFin.toFixed(1)}%</div>
        </div>
      </div>

      <div class="card summary-card">
        <div class="card-title">📊 配置总览</div>
        <div class="alloc-summary-row">
          <span class="alloc-label">总资产</span>
          <span class="alloc-value">¥ ${this.formatMoney(totalAssets)} 万</span>
        </div>
        <div class="alloc-summary-row">
          <span class="alloc-label">自用资产</span>
          <span class="alloc-value">¥ ${this.formatMoney(selfUseAssets)} 万 (${selfUsePct.toFixed(1)}%)</span>
        </div>
        <div class="alloc-summary-row">
          <span class="alloc-label">投资资产</span>
          <span class="alloc-value">¥ ${this.formatMoney(investmentAssets)} 万 (${investPct.toFixed(1)}%)</span>
        </div>
        <div class="alloc-summary-row">
          <span class="alloc-label">实物资产</span>
          <span class="alloc-value">¥ ${this.formatMoney(realAssets)} 万 (${realPct.toFixed(1)}%)</span>
        </div>
        <div class="alloc-summary-row">
          <span class="alloc-label">金融资产</span>
          <span class="alloc-value">¥ ${this.formatMoney(financialAssets)} 万 (${finPct.toFixed(1)}%)</span>
        </div>
      </div>

      <!-- F025: 趋势图 -->
      <div class="card trend-chart-card">
        <div class="card-title">📈 净资产趋势（2023-2026）</div>
        <div class="trend-chart-wrapper">
          <svg class="trend-chart" viewBox="0 0 ${chartW} ${chartH}" preserveAspectRatio="xMidYMid meet">
            ${[0, 0.25, 0.5, 0.75, 1].map(p => {
              const y = padT + p * plotH;
              const val = maxVal - p * range;
              return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${chartW - padR}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="3,3"/><text x="${padL - 2}" y="${(y + 3).toFixed(1)}" font-size="9" fill="var(--text-light)" text-anchor="end">${this.formatMoney(val)}</text>`;
            }).join('')}
            <path d="${buildPath(assetLine)}" fill="none" stroke="#1a365d" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="${buildPath(liabLine)}" fill="none" stroke="#e53e3e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="${buildPath(netLine)}" fill="none" stroke="#38a169" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
            <g style="color: #1a365d">${buildDots(assetLine)}</g>
            <g style="color: #e53e3e">${buildDots(liabLine)}</g>
            <g style="color: #38a169">${buildDots(netLine)}</g>
            ${trendYears.map((y, i) => `<text x="${xPos(i).toFixed(1)}" y="${chartH - 6}" font-size="10" fill="var(--text-light)" text-anchor="middle">${y}</text>`).join('')}
          </svg>
        </div>
        <div class="trend-legend">
          <div class="trend-legend-item"><span class="trend-line-dot" style="background:#1a365d"></span>资产</div>
          <div class="trend-legend-item"><span class="trend-line-dot" style="background:#e53e3e"></span>负债</div>
          <div class="trend-legend-item"><span class="trend-line-dot" style="background:#38a169"></span>净资产</div>
        </div>
      </div>

      <!-- F026: 收益贡献分解 -->
      <div class="card contrib-card">
        <div class="card-title">💡 ${this.data.settings.currentYear} 年收益贡献分解</div>
        ${contribBar('🏠 持有收益', is.totalHoldReturn, '#2c5282', '资产持有期间价值增长')}
        ${contribBar('🏦 处置收益', is.totalDisposeReturn, '#38a169', '历史处置已实现盈亏')}
        ${contribBar('📉 利息支出', is.totalInterestExpense, '#e53e3e', '负债历年已付利息')}
        <div class="contrib-divider"></div>
        <div class="contrib-net ${is.netIncome >= 0 ? 'net-pos' : 'net-neg'}">
          <span class="contrib-net-label">📊 净收益</span>
          <span class="contrib-net-val">¥ ${this.formatMoney(is.netIncome)} 万</span>
        </div>
      </div>

      <div class="alloc-settings-btn">
        <button class="btn btn-primary" onclick="App.showAllocationSettings()">⚙️ 设置目标</button>
      </div>
    `;
  },

  dismissWarning() {
    const warn = document.getElementById('allocWarning');
    if (warn) {
      warn.style.display = 'none';
    }
  },

  showAllocationSettings() {
    const main = document.getElementById('main-content');
    const targets = this.data.settings.targetAllocation || {
      selfUse: 0.1, investment: 0.9, realAsset: 0.225, financial: 0.775
    };

    main.innerHTML = `
      <div class="form-header">
        <button class="btn-back" onclick="App.renderAllocation()">← 返回</button>
        <h2>⚙️ 配置目标设置</h2>
      </div>

      <div class="card form-card">
        <div class="form-hint-banner">调整目标比例后，看板中的偏离预警会自动更新</div>

        <form onsubmit="App.saveAllocationSettings(event)">
          <div class="form-section-title">🏠 自用性 vs 投资性</div>

          <div class="form-group">
            <label class="form-label">自用资产目标比例（%）</label>
            <div class="slider-row">
              <input type="range" class="slider" id="targetSelfUse" 
                     min="0" max="100" step="1"
                     value="${(targets.selfUse * 100).toFixed(0)}"
                     oninput="App.onSliderChange('targetSelfUse', 'selfUseVal')">
              <span class="slider-val" id="selfUseVal">${(targets.selfUse * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">投资资产目标比例（%）</label>
            <div class="slider-row">
              <input type="range" class="slider" id="targetInvestment" 
                     min="0" max="100" step="1"
                     value="${(targets.investment * 100).toFixed(0)}"
                     oninput="App.onSliderChange('targetInvestment', 'investVal')">
              <span class="slider-val" id="investVal">${(targets.investment * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div class="form-hint" id="investHint" style="color: ${(targets.investment + targets.selfUse) !== 1 ? 'var(--danger)' : 'var(--text-light)'}">
            自用 + 投资 = ${((targets.selfUse + targets.investment) * 100).toFixed(0)}% ${(targets.selfUse + targets.investment) !== 1 ? '(应等于100%)' : '✅'}
          </div>

          <div class="form-section-title">🏗️ 实物 vs 金融资产</div>

          <div class="form-group">
            <label class="form-label">实物资产目标比例（%）</label>
            <div class="slider-row">
              <input type="range" class="slider" id="targetReal" 
                     min="0" max="100" step="1"
                     value="${(targets.realAsset * 100).toFixed(0)}"
                     oninput="App.onSliderChange('targetReal', 'realVal')">
              <span class="slider-val" id="realVal">${(targets.realAsset * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">金融资产目标比例（%）</label>
            <div class="slider-row">
              <input type="range" class="slider" id="targetFinancial" 
                     min="0" max="100" step="1"
                     value="${(targets.financial * 100).toFixed(0)}"
                     oninput="App.onSliderChange('targetFinancial', 'finVal')">
              <span class="slider-val" id="finVal">${(targets.financial * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div class="form-hint" id="finHint" style="color: ${(targets.realAsset + targets.financial) !== 1 ? 'var(--danger)' : 'var(--text-light)'}">
            实物 + 金融 = ${((targets.realAsset + targets.financial) * 100).toFixed(0)}% ${(targets.realAsset + targets.financial) !== 1 ? '(应等于100%)' : '✅'}
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.renderAllocation()">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>

        <div class="backup-section">
          <div class="form-section-title">💾 数据备份与恢复</div>
          <div class="backup-buttons">
            <button class="btn btn-secondary" onclick="App.exportBackup()">📤 备份 JSON</button>
            <button class="btn btn-secondary" onclick="App.showImportBackup()">📥 恢复 JSON</button>
          </div>
          <div id="backupPreview"></div>
        </div>
      </div>
    `;
  },

  onSliderChange(sliderId, valId) {
    const slider = document.getElementById(sliderId);
    const valSpan = document.getElementById(valId);
    valSpan.textContent = slider.value + '%';

    // Update hint
    const selfUse = parseFloat(document.getElementById('targetSelfUse').value);
    const investment = parseFloat(document.getElementById('targetInvestment').value);
    const real = parseFloat(document.getElementById('targetReal').value);
    const fin = parseFloat(document.getElementById('targetFinancial').value);

    const investHint = document.getElementById('investHint');
    const finHint = document.getElementById('finHint');

    const investSum = selfUse + investment;
    const finSum = real + fin;

    if (investSum !== 100) {
      investHint.textContent = `自用 + 投资 = ${investSum}% (应等于100%)`;
      investHint.style.color = 'var(--danger)';
    } else {
      investHint.textContent = `自用 + 投资 = ${investSum}% ✅`;
      investHint.style.color = 'var(--success)';
    }

    if (finSum !== 100) {
      finHint.textContent = `实物 + 金融 = ${finSum}% (应等于100%)`;
      finHint.style.color = 'var(--danger)';
    } else {
      finHint.textContent = `实物 + 金融 = ${finSum}% ✅`;
      finHint.style.color = 'var(--success)';
    }
  },

  saveAllocationSettings(event) {
    event.preventDefault();

    const selfUse = parseFloat(document.getElementById('targetSelfUse').value) / 100;
    const investment = parseFloat(document.getElementById('targetInvestment').value) / 100;
    const realAsset = parseFloat(document.getElementById('targetReal').value) / 100;
    const financial = parseFloat(document.getElementById('targetFinancial').value) / 100;

    // Validate
    if (Math.abs(selfUse + investment - 1) > 0.001) {
      alert('自用 + 投资必须等于100%');
      return;
    }
    if (Math.abs(realAsset + financial - 1) > 0.001) {
      alert('实物 + 金融必须等于100%');
      return;
    }

    this.data.settings.targetAllocation = {
      selfUse, investment, realAsset, financial
    };
    DataLayer.save(this.data);
    this.renderAllocation();
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

  // F017: 负债年度利息计算
  calculateLiabilityInterest(liability) {
    if (!liability) return null;
    const borrowAmount = liability.borrowAmount || 0;
    const interestRate = liability.interestRate || 0;
    const annualInterest = borrowAmount * interestRate;
    return {
      borrowAmount,
      interestRate,
      annualInterest
    };
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
  },

  // ========== F027: Excel Export ==========
  exportToExcel() {
    const data = this.data;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Sheet 1: 资产台账
    const assetHeaders = ['编号', '大类', '分类', '城市', '名称', '买入年份', '买入单价(万)', '面积/数量', '买入总价(万)', '已初始化', '历史成本(万)', '累计持有收益(万)', '累计处置收益(万)', '累计使用率'];
    const assetRows = data.assets.map(a => [
      a.id, a.type, a.category, a.city || '', a.name,
      a.buyYear, a.buyPricePerSqm || '', a.area || '', a.buyTotalPrice || 0,
      a.initialized ? '是' : '否',
      a.initData ? (a.initData.initTotalPrice || '') : '',
      a.initData ? (a.initData.cumulativeHoldReturn || '') : '',
      a.initData ? (a.initData.cumulativeDisposeReturn || '') : '',
      a.initData ? (a.initData.cumulativeUtilizationRate || '') : ''
    ]);

    // Sheet 2: 负债台账
    const liabHeaders = ['编号', '大类', '债权人', '借入年份', '年利率(%)', '借入金额(万)', '剩余期限(月)', '已初始化', '初始本金(万)', '累计未付利息(万)', '累计已付利息(万)'];
    const liabRows = data.liabilities.map(l => [
      l.id, l.type, l.creditor, l.buyYear,
      l.interestRate ? (l.interestRate * 100).toFixed(2) : '',
      l.borrowAmount || 0, l.remainingMonths || '',
      l.initialized ? '是' : '否',
      l.initData ? (l.initData.initBorrowAmount || '') : '',
      l.initData ? (l.initData.cumulativeUnpaidInterest || '') : '',
      l.initData ? (l.initData.cumulativePaidInterest || '') : ''
    ]);

    // Sheet 3: 配置参数
    const settingsRows = [
      ['参数名', '参数值'],
      ['基准年份', data.settings.baseYear],
      ['当前选中年份', data.settings.currentYear],
      ['自用资产目标比例', data.settings.targetAllocation ? (data.settings.targetAllocation.selfUse * 100).toFixed(1) + '%' : ''],
      ['投资资产目标比例', data.settings.targetAllocation ? (data.settings.targetAllocation.investment * 100).toFixed(1) + '%' : ''],
      ['实物资产目标比例', data.settings.targetAllocation ? (data.settings.targetAllocation.realAsset * 100).toFixed(1) + '%' : ''],
      ['金融资产目标比例', data.settings.targetAllocation ? (data.settings.targetAllocation.financial * 100).toFixed(1) + '%' : '']
    ];

    const ws1 = XLSX.utils.aoa_to_sheet([assetHeaders, ...assetRows]);
    const ws2 = XLSX.utils.aoa_to_sheet([liabHeaders, ...liabRows]);
    const ws3 = XLSX.utils.aoa_to_sheet(settingsRows);

    // Set column widths
    ws1['!cols'] = [{wch:8},{wch:10},{wch:15},{wch:8},{wch:15},{wch:8},{wch:10},{wch:8},{wch:12},{wch:8},{wch:12},{wch:12},{wch:12},{wch:10}];
    ws2['!cols'] = [{wch:8},{wch:10},{wch:15},{wch:8},{wch:10},{wch:12},{wch:10},{wch:8},{wch:12},{wch:12},{wch:12}];
    ws3['!cols'] = [{wch:20},{wch:15}];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, '资产台账');
    XLSX.utils.book_append_sheet(wb, ws2, '负债台账');
    XLSX.utils.book_append_sheet(wb, ws3, '配置参数');

    const filename = `家庭资产负债_${today}.xlsx`;
    XLSX.writeFile(wb, filename);
  },

  // ========== F028: PDF Export ==========
  exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const pageW = 210, margin = 15, contentW = pageW - margin * 2;

    const fmt = (num) => (num || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 });

    // ===== Page 1: 资产负债表 =====
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('家庭资产负债表', pageW / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`生成日期: ${today}`, pageW / 2, 27, { align: 'center' });

    // Asset table
    const bs = this.getBalanceSheetData(this.data.settings.currentYear);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`💰 资产（${this.data.settings.currentYear}年）`, margin, 38);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const typeNames = { selfUse: '自用资产', investment: '投资资产', financial: '金融资产' };
    const liabTypeNames = { bank: '银行负债', nonBank: '非银行负债', private: '私人负债' };

    const assetData = [];
    Object.keys(bs.assetGroups).forEach(type => {
      const cats = bs.assetGroups[type];
      Object.keys(cats).forEach(cat => {
        cats[cat].items.forEach(a => {
          assetData.push([typeNames[type] + ' - ' + cats[cat].name, a.name, '¥ ' + fmt(a.buyTotalPrice) + ' 万']);
        });
      });
      // subtotal row
      assetData.push([typeNames[type] + ' 小计', '', '¥ ' + fmt(bs.assetTypeTotals[type]) + ' 万']);
    });
    assetData.push(['资产合计', '', '¥ ' + fmt(bs.totalAssets) + ' 万']);

    doc.autoTable({
      startY: 40,
      head: [['类别', '名称', '金额']],
      body: assetData,
      theme: 'striped',
      headStyles: { fillColor: [26, 54, 93], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 }, 2: { cellWidth: 40, halign: 'right' } },
      margin: { left: margin, right: margin },
    });

    // Liability table
    const nextY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 负债', margin, nextY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const liabData = [];
    Object.keys(bs.liabilityGroups).forEach(type => {
      const group = bs.liabilityGroups[type];
      group.items.forEach(l => {
        liabData.push([liabTypeNames[type] || type, l.creditor, '¥ ' + fmt(l.borrowAmount) + ' 万']);
      });
      liabData.push([liabTypeNames[type] + ' 小计', '', '¥ ' + fmt(bs.liabilityTypeTotals[type]) + ' 万']);
    });
    liabData.push(['负债合计', '', '¥ ' + fmt(bs.totalLiabilities) + ' 万']);

    doc.autoTable({
      startY: nextY + 3,
      head: [['类别', '债权人', '金额']],
      body: liabData,
      theme: 'striped',
      headStyles: { fillColor: [229, 62, 62], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 }, 2: { cellWidth: 40, halign: 'right' } },
      margin: { left: margin, right: margin },
    });

    // Net assets
    const netY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(26, 54, 93);
    doc.rect(margin, netY - 4, contentW, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`📐 净资产  ¥ ${fmt(bs.netAssets)} 万`, margin + 5, netY + 2);
    doc.setTextColor(0, 0, 0);

    // ===== Page 2: 收益表 =====
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('家庭收益表', pageW / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`年度: ${this.data.settings.currentYear}年`, pageW / 2, 27, { align: 'center' });

    const is = this.getIncomeStatementData(this.data.settings.currentYear);

    const incomeData = [
      ['🏠 持有收益', `¥ ${fmt(is.totalHoldReturn)} 万`, '资产持有期间的价值增长+现金收益'],
      ['🏦 处置收益', `¥ ${fmt(is.totalDisposeReturn)} 万`, '历史处置资产的已实现盈亏'],
      ['📉 利息支出', `¥ ${fmt(is.totalInterestExpense)} 万`, '负债历年已付利息（累计值）'],
    ];

    doc.autoTable({
      startY: 33,
      head: [['指标', '金额', '说明']],
      body: incomeData,
      theme: 'striped',
      headStyles: { fillColor: [44, 82, 130], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 45, halign: 'right' }, 2: { cellWidth: 90 } },
      margin: { left: margin, right: margin },
    });

    const incY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(26, 54, 93);
    doc.rect(margin, incY - 4, contentW, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`📊 净收益  ¥ ${fmt(is.netIncome)} 万`, margin + 5, incY + 3);
    doc.text(`= 持有收益 + 处置收益 - 利息支出`, margin + 5, incY + 8);
    doc.setTextColor(0, 0, 0);

    // ===== Page 3: 配置看板 =====
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('资产配置看板', pageW / 2, 20, { align: 'center' });

    const totalAssets = this.getTotalAssets('all');
    const selfUseAssets = this.getTotalAssets('selfUse');
    const investmentAssets = this.getTotalAssets('investment');
    const realAssets = this.getTotalAssets('real');
    const financialAssets = this.getTotalAssets('financial');

    const selfUsePct = totalAssets > 0 ? (selfUseAssets / totalAssets * 100) : 0;
    const investPct = totalAssets > 0 ? (investmentAssets / totalAssets * 100) : 0;
    const realPct = totalAssets > 0 ? (realAssets / totalAssets * 100) : 0;
    const finPct = totalAssets > 0 ? (financialAssets / totalAssets * 100) : 0;

    const targets = this.data.settings.targetAllocation || { selfUse: 0.1, investment: 0.9, realAsset: 0.225, financial: 0.775 };

    const allocData = [
      ['自用资产', `¥ ${fmt(selfUseAssets)} 万`, `${selfUsePct.toFixed(1)}%`, `${(targets.selfUse * 100).toFixed(1)}%`, selfUsePct > targets.selfUse * 100 * 1.15 || selfUsePct < targets.selfUse * 100 * 0.85 ? '⚠️' : '✅'],
      ['投资资产', `¥ ${fmt(investmentAssets)} 万`, `${investPct.toFixed(1)}%`, `${(targets.investment * 100).toFixed(1)}%`, investPct > targets.investment * 100 * 1.15 || investPct < targets.investment * 100 * 0.85 ? '⚠️' : '✅'],
      ['实物资产', `¥ ${fmt(realAssets)} 万`, `${realPct.toFixed(1)}%`, `${(targets.realAsset * 100).toFixed(1)}%`, realPct > targets.realAsset * 100 * 1.15 || realPct < targets.realAsset * 100 * 0.85 ? '⚠️' : '✅'],
      ['金融资产', `¥ ${fmt(financialAssets)} 万`, `${finPct.toFixed(1)}%`, `${(targets.financial * 100).toFixed(1)}%`, finPct > targets.financial * 100 * 1.15 || finPct < targets.financial * 100 * 0.85 ? '⚠️' : '✅'],
      ['资产合计', `¥ ${fmt(totalAssets)} 万`, '', '', ''],
    ];

    doc.autoTable({
      startY: 28,
      head: [['资产类别', '当前金额', '当前比例', '目标比例', '状态']],
      body: allocData,
      theme: 'striped',
      headStyles: { fillColor: [44, 82, 130], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 45, halign: 'right' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' }, 4: { cellWidth: 20, halign: 'center' } },
      margin: { left: margin, right: margin },
    });

    const filename = `家庭资产负债报告_${today}.pdf`;
    doc.save(filename);
  },

  // ========== F031: Excel Import ==========
  showImportExcel() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="form-header">
        <button class="btn-back" onclick="App.renderAssets()">← 返回</button>
        <h2>📤 导入 Excel 数据</h2>
      </div>

      <div class="card form-card">
        <div class="form-hint-banner">
          请选择之前导出的 Excel 文件（.xlsx格式）。导入将追加或覆盖现有数据。
        </div>

        <form onsubmit="App.importFromExcel(event)">
          <div class="form-group">
            <label class="form-label">选择 Excel 文件</label>
            <input type="file" id="importFile" accept=".xlsx,.xls" class="form-input" required>
          </div>

          <div class="import-options">
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" id="importModeMerge" checked>
                合并模式（追加新记录，保留现有数据）
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" id="importModeReplace">
                替换模式（清空现有数据，用导入数据替代）
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.renderAssets()">取消</button>
            <button type="submit" class="btn btn-primary">导入</button>
          </div>
        </form>

        <div class="import-preview" id="importPreview"></div>
      </div>
    `;

    // Preview on file select
    document.getElementById('importFile').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const preview = document.getElementById('importPreview');
      preview.innerHTML = '<div class="loading">正在读取文件...</div>';

      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {type: 'array'});

        let html = '<div class="import-sheet-list">';
        workbook.SheetNames.forEach(name => {
          const sheet = workbook.Sheets[name];
          const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
          const rowCount = range.e.r + 1;
          html += `<div class="import-sheet-item"><strong>${name}</strong>：${rowCount} 行数据</div>`;
        });
        html += '</div>';
        preview.innerHTML = html;
      } catch(err) {
        preview.innerHTML = `<div class="import-error">读取失败：${err.message}</div>`;
      }
    });

    // Mutually exclusive checkboxes
    const mergeChk = document.getElementById('importModeMerge');
    const replaceChk = document.getElementById('importModeReplace');
    mergeChk.addEventListener('change', () => { if(mergeChk.checked) replaceChk.checked = false; });
    replaceChk.addEventListener('change', () => { if(replaceChk.checked) mergeChk.checked = false; });
  },


  importFromExcel(event) {
    event.preventDefault();
    const file = document.getElementById('importFile').files[0];
    if (!file) { alert('请选择文件'); return; }

    const replaceMode = document.getElementById('importModeReplace').checked;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});

        const assetSheetName = workbook.SheetNames.find(n => n.includes('资产')) || '资产台账';
        const liabSheetName = workbook.SheetNames.find(n => n.includes('负债')) || '负债台账';

        const readSheet = (sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) return [];
          const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
          const rows = [];
          for (let r = 0; r <= range.e.r; r++) {
            const row = [];
            for (let c = 0; c <= range.e.c; c++) {
              const cell = sheet[XLSX.utils.encode_cell({r, c})];
              row.push(cell ? (cell.v || '') : '');
            }
            rows.push(row);
          }
          return rows;
        };

        const assetRows = readSheet(assetSheetName);
        
        // DIAGNOSTIC: log first 20 rows to see what XLSX reads
        console.log('DEBUG raw rows 0-19:');
        assetRows.slice(0, 20).forEach((row, r) => {
          console.log('r='+r, 'A='+JSON.stringify(row[0]), 'C='+JSON.stringify(row[2]), 'G='+row[6]);
        });

        // Section types:
        // Type1 (自用房产/投资性x房): E=万元/㎡, F=㎡, G=E*F
        // Type2 (自用车辆/自用其他): E=买入总价(万元), F=0
        // Type3+ (收藏品/股票/REITs/债券/基金): E=元, F=数量, G=E*F/10000

        const newAssets = [];
        let assetCounter = this.data.assets.length;
        let currentMainSection = '';
        let currentSubsection = '';

        for (let r = 3; r < assetRows.length; r++) {
          const row = assetRows[r];
          const aVal = String(row[0] || '').trim();
          const cVal = String(row[2] || '').trim();
          const gVal = parseFloat(row[6]) || 0;

          if (!aVal || aVal === 'nan' || aVal.includes('小计') || aVal.includes('合计') || !cVal || cVal === 'nan' || cVal === 'XXXXXX' || gVal <= 0) continue;

          if (aVal === '实物资产' || aVal === '金融资产') {
            currentMainSection = aVal;
            currentSubsection = String(row[2] || '').trim();
            continue;
          }

          let hasSeparatePriceArea = true;
          if (currentSubsection.includes('自用车辆') || currentSubsection.includes('自用其他')) {
            hasSeparatePriceArea = false;
          }

          let assetType = 'financial', assetCat = 'other';
          if (currentMainSection === '实物资产') {
            if (currentSubsection.includes('自用房产')) { assetType = 'selfUse'; assetCat = 'selfUseRealEstate'; }
            else if (currentSubsection.includes('自用车辆')) { assetType = 'selfUse'; assetCat = 'selfUseVehicle'; }
            else if (currentSubsection.includes('自用其他')) { assetType = 'selfUse'; assetCat = 'selfUseOther'; }
            else { assetType = 'investment'; assetCat = 'investmentRealEstate'; }
          } else if (currentMainSection === '金融资产') {
            if (currentSubsection.includes('股票资产')) { assetType = 'financial'; assetCat = 'stock'; }
            else if (currentSubsection.includes('基金资产')) { assetType = 'financial'; assetCat = 'fund'; }
            else if (currentSubsection.includes('股权资产')) { assetType = 'financial'; assetCat = 'equity'; }
            else if (currentSubsection.includes('衍生金融资产')) { assetType = 'financial'; assetCat = 'other'; }
            else if (currentSubsection.includes('债券资产')) { assetType = 'financial'; assetCat = 'bond'; }
            else if (currentSubsection.includes('现金')) { assetType = 'financial'; assetCat = 'cash'; }
            else { assetType = 'financial'; assetCat = 'other'; }
          }

          assetCounter++;
          const id = 'A' + String(assetCounter).padStart(3, '0');
          const bVal = String(row[1] || '').trim();
          const dVal = parseInt(row[3]) || new Date().getFullYear();
          let eVal = 0, fVal = 0;

          if (hasSeparatePriceArea) {
            eVal = parseFloat(row[4]) || 0;
            fVal = parseFloat(row[5]) || 0;
          }

          const totalPrice = parseFloat(row[6]) || 0;
          const hVal = parseFloat(row[7]) || 0;
          const iVal = parseFloat(row[8]) || 0;
          const jVal = parseFloat(row[9]) || 0;

          let cumulativeHoldReturn = hVal;
          let initTotalPrice = iVal;
          let cumulativeDisposeReturn = jVal;

          // 收藏品: H=持有数量, I=成本单价(元), J=2023末单价(元)
          if (currentSubsection.includes('收藏品')) {
            const qty = parseFloat(row[7]) || 0;
            const costUnit = parseFloat(row[8]) || 0;
            const endUnit = parseFloat(row[9]) || 0;
            cumulativeHoldReturn = (endUnit - costUnit) * qty / 10000;
            initTotalPrice = parseFloat(row[10]) || 0;
          } else if (currentSubsection.includes('自用车辆') || currentSubsection.includes('自用其他')) {
            cumulativeHoldReturn = 0;
            initTotalPrice = 0;
            cumulativeDisposeReturn = 0;
          }

          newAssets.push({
            id,
            type: assetType,
            category: assetCat,
            city: assetType === 'financial' ? bVal : '',
            name: cVal,
            buyYear: dVal,
            buyPricePerSqm: eVal,
            area: fVal,
            buyTotalPrice: totalPrice,
            initialized: cumulativeHoldReturn !== 0 || initTotalPrice !== 0 || cumulativeDisposeReturn !== 0,
            initData: (cumulativeHoldReturn !== 0 || initTotalPrice !== 0 || cumulativeDisposeReturn !== 0) ? {
              cumulativeHoldReturn,
              initTotalPrice,
              cumulativeDisposeReturn
            } : null
          });
        }


        // Liabilities
        const liabRows = readSheet(liabSheetName);
        const newLiabs = [];
        let liabCounter = this.data.liabilities.length;
        for (let r = 3; r < liabRows.length; r++) {
          const row = liabRows[r];
          const aVal = String(row[0] || '').trim();
          const cVal = String(row[2] || '').trim();
          const fVal = parseFloat(row[5]) || 0;
          if (!aVal || aVal === 'nan' || aVal.includes('小计') || aVal.includes('合计') || !cVal || cVal === 'nan' || cVal === 'XXXXXX' || fVal <= 0) continue;
          liabCounter++;
          const id = 'L' + String(liabCounter).padStart(3, '0');
          const bVal = String(row[1] || '').trim();
          const dVal = parseInt(row[3]) || new Date().getFullYear();
          const eVal = parseFloat(row[4]) || 0;
          const hVal = parseFloat(row[7]) || 0;
          const iVal = parseFloat(row[8]) || 0;
          const jVal = parseFloat(row[9]) || 0;
          newLiabs.push({
            id,
            type: bVal || 'bank',
            creditor: cVal,
            buyYear: dVal,
            interestRate: eVal,
            borrowAmount: fVal,
            remainingMonths: 0,
            initialized: hVal !== 0 || iVal !== 0 || jVal !== 0,
            initData: (hVal !== 0 || iVal !== 0 || jVal !== 0) ? {
              initBorrowAmount: hVal,
              cumulativeUnpaidInterest: iVal,
              cumulativePaidInterest: jVal
            } : null
          });
        }

        if (replaceMode) {
          this.data.assets = newAssets;
          this.data.liabilities = newLiabs;
        } else {
          const existingAssetIds = new Set(this.data.assets.map(a => a.id));
          const existingLiabIds = new Set(this.data.liabilities.map(l => l.id));
          newAssets.forEach(a => { if (!existingAssetIds.has(a.id)) this.data.assets.push(a); });
          newLiabs.forEach(l => { if (!existingLiabIds.has(l.id)) this.data.liabilities.push(l); });
        }

        DataLayer.save(this.data);
        alert('导入成功！\n资产：' + newAssets.length + ' 条\n负债：' + newLiabs.length + ' 条');
        this.renderAssets();
      } catch(err) {
        alert('导入失败：' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  },// ========== F032: JSON Backup/Restore ==========
  exportBackup() {
    const data = this.data;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const backup = {
      version: 1,
      exportDate: today,
      data: data
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `家庭资产负债备份_${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  showImportBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const backup = JSON.parse(ev.target.result);
          if (!backup.data) throw new Error('无效的备份文件');
          const confirmed = confirm(`确定要恢复备份吗？\n备份日期：${backup.exportDate}\n这将覆盖所有现有数据。`);
          if (!confirmed) return;
          this.data = backup.data;
          DataLayer.save(this.data);
          alert('恢复成功！');
          this.renderAllocation();
        } catch(err) {
          alert('恢复失败：' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
};
