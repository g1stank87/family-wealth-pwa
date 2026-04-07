# 功能: DEV-F011 资产初始化功能

## OBJECTIVE
为已存在的资产设置历史成本、初始化累计收益，作为后续年度计算基准。

## INPUTS
- `scripts/app.js` - F007 编辑表单已实现
- `scripts/data-layer.js` - 资产数据结构有 `initData` 字段
- `feature_list.json` - F011 描述

## CONSTRAINTS
- 不破坏现有功能
- 初始化数据影响年度追踪计算
- 初始化后资产需标记 `initialized: true`

## DELIVERY
- [ ] 编辑表单增加「初始化设置」区块
- [ ] 可设置：历史买入价、累计持有收益、累计处置收益
- [ ] 保存后设置 `initialized: true`
- [ ] 构建成功
- [ ] 浏览器验证通过

## 数据结构

```javascript
{
  id: 'A001',
  type: 'selfUse',
  category: 'selfUseRealEstate',
  // ... 基础字段
  initialized: true,    // 初始化标志
  initData: {
    initTotalPrice: 3100,              // 初始化总价比买入价（万）
    cumulativeHoldReturn: -10,         // 累计持有收益（万）
    cumulativeDisposeReturn: 1600,      // 累计处置收益（万）
    cumulativeUtilizationRate: 1       // 累计使用率
  }
}
```

## 实现步骤

1. 修改 `loadAssetForEdit()` 加载初始化数据
2. 修改 `showAssetForm()` 编辑模式下显示初始化区块
3. 修改 `saveAsset()` 保存初始化数据
4. 设置 `initialized: true`

## ✅ DELIVERY 验证（浏览器测试）
- [x] 初始化区块显示
- [x] 初始化字段存在（4个）
- [x] 初始化数据保存成功
- [x] 状态更新为"已初始化"

**验证时间**: 2026-04-07 23:05
**验证方式**: Playwright 浏览器自动化测试

## CRITIQUE
