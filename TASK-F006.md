# 功能: DEV-F006 资产条目新增

## OBJECTIVE
实现资产条目新增功能，用户可通过表单录入新资产，自动保存到 LocalStorage。

## INPUTS
- `scripts/app.js` - 主应用文件，现有 `showAssetForm()` placeholder
- `scripts/data-layer.js` - 数据层，资产数据结构
- `styles/main.css` - 样式文件
- TASK-F005.md - 参考现有的分组显示结构

## CONSTRAINTS
- 不破坏现有功能（F005 分组显示、折叠展开）
- 表单需适配移动端
- 必须验证必填字段
- 保存后自动刷新资产列表
- 新增成功后返回资产列表页

## DELIVERY
- [ ] 实现 `showAssetForm()` 显示新增表单
- [ ] 实现 `saveAsset()` 保存资产到 LocalStorage
- [ ] 表单字段：类型（自用/投资/金融）、城市、名称、买入年份、买入单价、面积/数量
- [ ] 表单验证：必填字段检查
- [ ] 保存成功后自动刷新列表
- [ ] 构建成功（无语法错误）
- [ ] 浏览器验证通过

## 数据结构

```javascript
{
  id: 'A003',              // 自动生成
  type: 'selfUse',         // 自用/投资/金融
  category: 'selfUseRealEstate',  // 详细分类
  city: '深圳',
  name: '资产名称',
  buyYear: 2026,
  buyPricePerSqm: 10,      // 买入单价（万元）
  area: 100,               // 面积
  buyTotalPrice: 1000,     // 自动计算：单价×面积
  initialized: false,       // 新资产默认未初始化
  initData: null
}
```

## 资产类型（type）
- `selfUse` - 自用
- `investment` - 投资
- `financial` - 金融

## 资产分类（category）
- 自用：`selfUseRealEstate`（自用房产）、`selfUseVehicle`（自用车辆）、`selfUseOther`（自用其他）
- 投资：`investmentRealEstate`（投资房产）、`investmentStock`（投资股票）、`investmentFund`（投资基金）
- 金融：`stock`（股票）、`fund`（基金）、`bond`（债券）、`cash`（现金/存款）

## 实现步骤

1. 实现 `showAssetForm()` - 显示表单模态框/页面
2. 实现 `renderAssetForm()` - 渲染表单 HTML
3. 实现 `saveAsset()` - 验证并保存
4. 实现 `generateAssetId()` - 生成唯一 ID
5. 实现 `closeForm()` - 关闭表单
6. 绑定表单提交事件
7. 测试新增流程

## ✅ DELIVERY 验证（浏览器测试）
- [x] 表单显示正常
- [x] 类型选择联动分类下拉框
- [x] 自动计算总价（单价×面积）
- [x] 保存后自动刷新列表
- [x] 资产数量增加（2→3）
- [x] 导航回列表页正常

**验证时间**: 2026-04-07 22:37
**验证方式**: Playwright 浏览器自动化测试

## CRITIQUE
