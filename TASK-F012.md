# 功能: DEV-F012 资产累计收益计算

## OBJECTIVE
根据资产的买入价和初始化数据，计算并展示累计收益。

## INPUTS
- `scripts/app.js` - F011 已实现初始化数据存储
- `scripts/data-layer.js` - 资产数据有 `initData` 字段

## CONSTRAINTS
- 不破坏现有功能
- 收益计算需要区分已初始化和未初始化资产
- 列表页可选择显示/隐藏收益

## DELIVERY
- [ ] 实现 `calculateAssetReturn(asset)` 计算收益
- [ ] 在资产列表中显示收益信息（已初始化资产）
- [ ] 收益 = 估值 - 成本 + 累计持有收益 + 累计处置收益
- [ ] 构建成功
- [ ] 浏览器验证通过

## 收益计算逻辑

**对于已初始化的资产 (initialized: true):**
```
当前价值 = buyTotalPrice (买入价)
估值 = 当前价值 (简化处理)
持有收益 = 估值 - initData.initTotalPrice + initData.cumulativeHoldReturn
处置收益 = initData.cumulativeDisposeReturn
总收益 = 持有收益 + 处置收益
```

**对于未初始化资产:**
```
无法计算，显示 "-"
```

## 实现步骤

1. 实现 `calculateAssetReturn(asset)` 方法
2. 在 `renderAssets()` 中为已初始化资产显示收益
3. 在资产详情中也显示收益信息

## ✅ DELIVERY 验证（浏览器测试）
- [x] `calculateAssetReturn()` 方法实现
- [x] 列表显示收益信息
- [x] 正负收益样式区分
- [x] 已初始化资产标记 📊

**验证时间**: 2026-04-07 23:06
**验证方式**: Playwright 浏览器自动化测试

## CRITIQUE
