# 功能: DEV-F010 资产类型扩展

## OBJECTIVE
扩展资产类型支持更多分类，包括自用车辆、投资股票/基金等。

## INPUTS
- `scripts/app.js` - F006/F007 表单已有 `onTypeChange()` 和分类下拉
- `styles/main.css` - 已有样式

## CONSTRAINTS
- 不破坏现有功能
- 分类体系完整覆盖需求
- 新增资产时分类下拉显示完整

## DELIVERY
- [ ] 确认现有分类体系完整
- [ ] 新增资产可选择所有分类
- [ ] 构建成功
- [ ] 浏览器验证通过

## 资产类型体系

### type (大类)
- `selfUse` - 自用
- `investment` - 投资
- `financial` - 金融

### category (细分)

**自用 (selfUse):**
- `selfUseRealEstate` - 自用房产
- `selfUseVehicle` - 自用车辆
- `selfUseOther` - 自用其他

**投资 (investment):**
- `investmentRealEstate` - 投资房产
- `investmentStock` - 投资股票
- `investmentFund` - 投资基金

**金融 (financial):**
- `stock` - 股票
- `fund` - 基金
- `bond` - 债券
- `cash` - 现金/存款
- `other` - 其他

## 实现状态
F006 的 `onTypeChange()` 已实现完整分类体系。

## ✅ DELIVERY 验证（浏览器测试）
- [x] 分类选项完整（投资类型有 3 个分类）
- [x] 资产新增成功（投资股票）
- [x] categoryNames 映射完整
- [x] 构建成功

**验证时间**: 2026-04-07 23:03
**验证方式**: Playwright 浏览器自动化测试

## CRITIQUE
