# 功能: DEV-F013 负债台账列表页

## OBJECTIVE
实现负债台账列表页，按负债类型分组显示，每组显示小计，底部显示总计。

## INPUTS
- `scripts/app.js` - 现有 `renderLiabilities()` 函数
- `scripts/data-layer.js` - 负债数据结构
- `styles/main.css` - 已有样式

## CONSTRAINTS
- 参考 F005 资产列表的实现模式
- 不破坏现有功能
- 支持按负债类型分组

## DELIVERY
- [ ] 按负债类型分组（银行、非银行、私人）
- [ ] 每组显示小计
- [ ] 底部显示负债总计
- [ ] 构建成功
- [ ] 浏览器验证通过

## 负债数据结构

```javascript
{
  id: 'L001',
  type: 'bank',           // bank / nonBank / private
  category: 'bankLiability',
  creditor: '建行',
  buyYear: 2000,
  interestRate: 0.08,
  borrowAmount: 20000,
  remainingMonths: 240,
  initialized: true,
  initData: { ... }
}
```

## 负债类型
- `bank` - 银行负债
- `nonBank` - 非银行负债
- `private` - 私人负债

## 实现步骤

1. 创建 `getGroupedLiabilities()` 方法
2. 创建 `getTypeTotalLiabilities(type)` 方法
3. 修改 `renderLiabilities()` 使用分组视图
4. 添加分组样式
5. 点击条目进入编辑页

## ✅ DELIVERY 验证（浏览器测试）
- [x] 按负债类型分组显示
- [x] 每组显示小计
- [x] 底部显示负债总计
- [x] FAB 添加按钮存在

**验证时间**: 2026-04-07 23:15
**验证方式**: Playwright 浏览器自动化测试

## CRITIQUE
