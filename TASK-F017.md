# 功能: DEV-F017 负债年度付息计算

## OBJECTIVE
根据利率和剩余期限计算年度应付利息。

## INPUTS
- `scripts/app.js` - F014 已实现负债表单
- `scripts/data-layer.js` - 负债数据结构有 interestRate, remainingMonths

## CONSTRAINTS
- 参考 F012 资产收益计算的实现模式
- 负债列表显示年度利息信息

## DELIVERY
- [ ] 实现 `calculateLiabilityInterest(liability)` 计算年度利息
- [ ] 在负债列表中显示利息信息
- [ ] 构建成功
- [ ] 浏览器验证通过

## 利息计算逻辑

```
年利息 = 借入金额 × 年利率
```

## CRITIQUE (完成后填写)
