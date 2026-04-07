# 功能: DEV-F014 负债条目新增

## OBJECTIVE
实现负债条目新增功能，用户可通过表单录入新负债。

## INPUTS
- `scripts/app.js` - 现有 `showLiabilityForm()` placeholder
- `scripts/data-layer.js` - 负债数据结构
- `styles/main.css` - 已有样式

## CONSTRAINTS
- 参考 F006 资产新增表单的实现模式
- 表单需适配移动端
- 必须验证必填字段
- 保存后自动刷新负债列表

## DELIVERY
- [ ] 实现 `showLiabilityForm()` 显示新增表单
- [ ] 实现 `saveLiability()` 保存负债到 LocalStorage
- [ ] 表单字段：类型、债权人名称、借入年份、利率、借入金额、剩余期限
- [ ] 表单验证：必填字段检查
- [ ] 保存成功后自动刷新列表
- [ ] 构建成功
- [ ] 浏览器验证通过

## 负债数据结构

```javascript
{
  id: 'L002',              // 自动生成
  type: 'bank',             // bank / nonBank / private
  category: 'bankLiability',
  creditor: '建行',
  buyYear: 2020,
  interestRate: 0.05,       // 利率 5%
  borrowAmount: 5000,       // 借入金额（万元）
  remainingMonths: 240,     // 剩余期限（月）
  initialized: false,
  initData: null
}
```

## 实现步骤

1. 实现 `showLiabilityForm()` - 显示表单
2. 实现 `saveLiability()` - 保存负债
3. 实现 `generateLiabilityId()` - 生成唯一 ID
4. 绑定表单提交事件
5. 测试新增流程

## ✅ DELIVERY 验证（浏览器测试）
- [x] 负债新增表单显示
- [x] 表单验证（必填字段）
- [x] 负债新增成功（1→2）
- [x] 返回列表页

**验证时间**: 2026-04-07 23:19
**验证方式**: Playwright 浏览器自动化测试

## CRITIQUE
