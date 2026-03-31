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
