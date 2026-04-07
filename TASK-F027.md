# TASK-F027: 数据导出 Excel

## 目标
将资产台账、负债台账、配置数据导出为 Excel 文件。

## 技术方案
- SheetJS (xlsx.full.min.js) via CDN
- 三个 Sheet：资产台账、负债台账、配置参数
- 列名与数据结构完全对应，导入时可逆

## 功能需求
- [ ] 导出按钮在资产/负债列表页显示
- [ ] Sheet1 资产台账：type、category、city、name、buyYear、buyTotalPrice、initialized
- [ ] Sheet2 负债台账：type、creditor、buyYear、interestRate、borrowAmount、remainingMonths
- [ ] Sheet3 配置：baseYear、currentYear、targetAllocation
- [ ] 文件名含日期：`家庭资产负债_YYYYMMDD.xlsx`

## 验收标准
- [ ] 点击导出后浏览器下载 xlsx 文件
- [ ] 导出内容与 localStorage 数据完全一致
- [ ] 可用 Excel 正常打开
