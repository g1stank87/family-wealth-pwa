# 功能: DEV-F007 资产条目编辑

## OBJECTIVE
点击资产条目进入编辑页面，修改资产信息并保存。

## INPUTS
- `scripts/app.js` - F006 已实现 `showAssetForm()` 和 `saveAsset()`
- `scripts/data-layer.js` - 数据层
- `styles/main.css` - F006 已添加表单样式

## CONSTRAINTS
- 不破坏现有功能（F005、F006）
- 编辑表单结构与新增表单一致
- 保存后自动刷新列表
- 必须传入 assetId 加载现有数据

## DELIVERY
- [ ] 实现 `showAssetForm(assetId)` - 传入 assetId 时为编辑模式
- [ ] 实现 `loadAssetForEdit(assetId)` - 加载资产数据到表单
- [ ] 编辑表单预填充现有数据
- [ ] 保存后更新列表
- [ ] 构建成功（无语法错误）
- [ ] 浏览器验证通过

## 编辑模式判断
```javascript
// 新增模式
showAssetForm()  // 无参数

// 编辑模式
showAssetForm(assetId)  // 传入 assetId
```

## 实现步骤

1. 修改 `showAssetForm(assetId)` 支持编辑模式
2. 实现 `loadAssetForEdit(assetId)` 加载数据
3. 修改表单标题（新增/编辑）
4. 保存时判断是新增还是更新
5. 实现 `updateAsset()` 更新数据
6. 点击资产条目触发编辑
7. 测试编辑流程

## ✅ DELIVERY 验证（浏览器测试）
- [x] 点击资产条目进入编辑表单
- [x] 编辑表单预填充现有数据
- [x] 删除按钮存在
- [x] 修改后保存成功
- [x] 资产数量不变（编辑而非新增）

**验证时间**: 2026-04-07 22:44
**验证方式**: Playwright 浏览器自动化测试

## CRITIQUE
