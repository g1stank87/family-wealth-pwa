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
[
      {
        id: 'A001',
        type: 'selfUse',
        category: 'selfUseRealEstate',
        city: '深圳',
        name: '蔚蓝海岸',
        buyYear: 2000,
        buyPricePerSqm: 5.0,
        area: 300.0,
        buyTotalPrice: 1500.0,
        initialized: true,
        initData: {
          cumulativeHoldReturn: -10.0,
          initTotalPrice: 3100.0,
          cumulativeDisposeReturn: 1600.0,
          cumulativeUtilizationRate: 1.0
        }
      },
      {
        id: 'A002',
        type: 'selfUse',
        category: 'selfUseRealEstate',
        city: '深圳',
        name: '天元',
        buyYear: 2019,
        buyPricePerSqm: 13.0,
        area: 1000.0,
        buyTotalPrice: 13000.0,
        initialized: false,
        initData: null
      },
      {
        id: 'A003',
        type: 'selfUse',
        category: 'selfUseRealEstate',
        city: '深圳',
        name: '前海壹号',
        buyYear: 2025,
        buyPricePerSqm: 7.0,
        area: 160.0,
        buyTotalPrice: 1120.0,
        initialized: false,
        initData: null
      },
      {
        id: 'A004',
        type: 'selfUse',
        category: 'selfUseRealEstate',
        city: '深圳',
        name: '浅水湾',
        buyYear: 2024,
        buyPricePerSqm: 6.0,
        area: 300.0,
        buyTotalPrice: 1800.0,
        initialized: false,
        initData: null
      },
      {
        id: 'A005',
        type: 'investment',
        category: 'investmentRealEstate',
        city: '深圳',
        name: '蔚蓝海岸',
        buyYear: 2000,
        buyPricePerSqm: 5.0,
        area: 300.0,
        buyTotalPrice: 1500.0,
        initialized: true,
        initData: {
          cumulativeHoldReturn: 108.0,
          initTotalPrice: 3100.0,
          cumulativeDisposeReturn: 1600.0,
          cumulativeUtilizationRate: 1.0
        }
      },
      {
        id: 'A006',
        type: 'investment',
        category: 'investmentRealEstate',
        city: '深圳',
        name: '天元',
        buyYear: 2021,
        buyPricePerSqm: 13.0,
        area: 350.0,
        buyTotalPrice: 4550.0,
        initialized: true,
        initData: {
          cumulativeHoldReturn: 126.0,
          initTotalPrice: 4000.0,
          cumulativeDisposeReturn: -550.0,
          cumulativeUtilizationRate: 0.5
        }
      },
      {
        id: 'A007',
        type: 'investment',
        category: 'investmentRealEstate',
        city: '深圳',
        name: '蔚蓝海岸',
        buyYear: 2000,
        buyPricePerSqm: 5.0,
        area: 150.0,
        buyTotalPrice: 750.0,
        initialized: true,
        initData: {
          cumulativeHoldReturn: 108.0,
          initTotalPrice: 1200.0,
          cumulativeDisposeReturn: 450.0,
          cumulativeUtilizationRate: 1.0
        }
      },
      {
        id: 'A008',
        type: 'investment',
        category: 'investmentRealEstate',
        city: '深圳',
        name: '皇岗村',
        buyYear: 2000,
        buyPricePerSqm: 6.0,
        area: 1000.0,
        buyTotalPrice: 6000.0,
        initialized: true,
        initData: {
          cumulativeHoldReturn: 0,
          initTotalPrice: 8000.0,
          cumulativeDisposeReturn: 2000.0,
          cumulativeUtilizationRate: 0
        }
      },
      {
        id: 'A009',
        type: 'investment',
        category: 'investmentRealEstate',
        city: '深圳',
        name: '实物黄金',
        buyYear: 2008,
        buyPricePerSqm: 200.0,
        area: 2500.0,
        buyTotalPrice: 50.0,
        initialized: true,
        initData: {
          cumulativeHoldReturn: 5000.0,
          initTotalPrice: 380.0,
          cumulativeDisposeReturn: 500.0,
          cumulativeUtilizationRate: 250.0
        }
      },
      {
        id: 'A010',
        type: 'financial',
        category: 'stock',
        city: '06989.HK',
        name: '卓越商企服务',
        buyYear: 2025,
        buyPricePerSqm: 1.37,
        area: 2000000.0,
        buyTotalPrice: 274.0,
        initialized: false,
        initData: null
      },
      {
        id: 'A011',
        type: 'financial',
        category: 'stock',
        city: '科技',
        name: 'DeepSeek',
        buyYear: 2025,
        buyPricePerSqm: 1000000.0,
        area: 0.005,
        buyTotalPrice: 5000.0,
        initialized: false,
        initData: null
      },
      {
        id: 'A012',
        type: 'financial',
        category: 'stock',
        city: '金融',
        name: '平安证券',
        buyYear: 2022,
        buyPricePerSqm: 500000.0,
        area: 0.003,
        buyTotalPrice: 1500.0,
        initialized: true,
        initData: {
          cumulativeHoldReturn: 0.003,
          initTotalPrice: 500000.0,
          cumulativeDisposeReturn: 480000.0,
          cumulativeUtilizationRate: 100.0
        }
      },
      {
        id: 'A013',
        type: 'financial',
        category: 'other',
        city: '期权',
        name: '卓越商企看涨期权',
        buyYear: 2025,
        buyPricePerSqm: 0.5,
        area: 2000000.0,
        buyTotalPrice: 100.0,
        initialized: false,
        initData: null
      },
      {
        id: 'A014',
        type: 'financial',
        category: 'other',
        city: 'SWAP',
        name: 'Deepseek看跌期权',
        buyYear: 2025,
        buyPricePerSqm: 0.5,
        area: 2000000.0,
        buyTotalPrice: 100.0,
        initialized: false,
        initData: null
      }
    ]
    ];

    const seedLiabilities = [
[
      {
        id: 'L001',
        type: 'bank',
        category: 'bankLiability',
        creditor: '建行',
        buyYear: 2000,
        interestRate: 0.08,
        borrowAmount: 20000.0,
        remainingMonths: 0,
        initialized: true,
        initData: {
          initBorrowAmount: 1000.0,
          cumulativeUnpaidInterest: -29000.0,
          cumulativePaidInterest: 19590.0,
          cumulativePaidPrincipal: 19000.0,
          remainingInterest: 590.0,
          remainingPrincipal: 0.04484848484848485
        }
      },
      {
        id: 'L002',
        type: 'nonBank',
        category: 'nonBankLiability',
        creditor: '平安证券',
        buyYear: 2013,
        interestRate: 0.08,
        borrowAmount: 2000.0,
        remainingMonths: 0,
        initialized: true,
        initData: {
          initBorrowAmount: 160.0,
          cumulativeUnpaidInterest: 1440.0,
          cumulativePaidInterest: 2160.0,
          cumulativePaidPrincipal: 2000.0,
          remainingInterest: 160.0,
          remainingPrincipal: 0.08
        }
      },
      {
        id: 'L003',
        type: 'private',
        category: 'privateLiability',
        creditor: '供应商A',
        buyYear: 2013,
        interestRate: 0.0,
        borrowAmount: 200.0,
        remainingMonths: 0,
        initialized: true,
        initData: {
          initBorrowAmount: 0.0,
          cumulativeUnpaidInterest: 0.0,
          cumulativePaidInterest: 200.0,
          cumulativePaidPrincipal: 200.0,
          remainingInterest: 0.0,
          remainingPrincipal: 0.0
        }
      },
      {
        id: 'L004',
        type: 'private',
        category: 'privateLiability',
        creditor: 'XXX',
        buyYear: 2013,
        interestRate: 0.12,
        borrowAmount: 100.0,
        remainingMonths: 0,
        initialized: false,
        initData: null
      },
      {
        id: 'L005',
        type: 'bank',
        category: 'bankLiability',
        creditor: '建行',
        buyYear: 2000,
        interestRate: 0.065,
        borrowAmount: 60000.0,
        remainingMonths: 0,
        initialized: true,
        initData: {
          initBorrowAmount: 10000.0,
          cumulativeUnpaidInterest: -70000.0,
          cumulativePaidInterest: 70000.0,
          cumulativePaidPrincipal: 60000.0,
          remainingInterest: 10000.0,
          remainingPrincipal: 0.045000000000000005
        }
      }
    ]
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
