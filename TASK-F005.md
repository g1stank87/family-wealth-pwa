# 功能: DEV-F005 资产台账列表页（分组+汇总）

## OBJECTIVE
增强资产台账列表页，按资产类型分组显示，每组显示小计，底部显示总计。

## INPUTS
- `scripts/app.js` - 主应用文件，现有 `renderAssets()` 函数
- `scripts/data-layer.js` - 数据层，资产数据结构
- `styles/main.css` - 样式文件

## CONSTRAINTS
- 保持现有年份选择器功能
- 保持 FAB 按钮（新增资产）
- 不破坏现有导航和其他页面
- 手机端友好的触摸目标尺寸

## DELIVERY
- [ ] 修改 `renderAssets()` 函数，实现分组显示
- [ ] 每组资产显示：组名 + 小计金额
- [ ] 页面底部显示资产总计
- [ ] 支持按类型（自用/投资/金融）分组
- [ ] 折叠/展开组功能（可选）
- [ ] 构建成功（无语法错误）

## 分组逻辑

```
💰 实物资产
  ├─ 🏠 自用房产 (小计: ¥X 万)
  │    • 蔚蓝海岸
  │    • 天元
  ├─ 🏢 投资房产 (小计: ¥X 万)
  │    • ...
💎 金融资产
  ├─ 📈 股票基金 (小计: ¥X 万)
  │    • ...
────────────────────────────────
📊 资产总计: ¥X 万
```

## 数据结构参考

资产类型（type）：
- `selfUse` - 自用
- `investment` - 投资
- `financial` - 金融

资产分类（category）：
- `selfUseRealEstate` - 自用房产
- `investmentRealEstate` - 投资房产
- `stock` - 股票
- `fund` - 基金
- `bond` - 债券
- 其他...

## 实现步骤

1. 创建 `getGroupedAssets()` 方法，按 type + category 分组
2. 创建 `getGroupTotal()` 方法，计算组小计
3. 创建 `getGrandTotal()` 方法，计算总计
4. 修改 `renderAssets()` HTML 模板，使用分组数据
5. 添加分组折叠/展开交互
6. 更新样式

## CRITIQUE (完成后填写)
- 可能的问题：分组折叠状态没有持久化，刷新页面会重置
- 改进建议：可添加 localStorage 保存折叠状态
- 完成时间：2026-04-07
