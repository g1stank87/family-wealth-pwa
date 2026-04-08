import os
os.chdir('/home/newmar004/.openclaw/workspace/family-wealth-pwa')

with open('scripts/app.js', 'r') as f:
    content = f.read()

# Find the actual function definition (line 1985), NOT the HTML attribute (line 1922)
# Look for the standalone function definition (preceded by newline, not inside HTML string)
# The pattern is "\n  importFromExcel(event) {"
idx = content.find('\n  importFromExcel(event) {')
if idx < 0:
    print("ERROR: function definition not found!")
    import sys; sys.exit(1)

import_start = idx + 1  # skip the newline, start at 'importFromExcel'
import_end = content.find("// ========== F032:", import_start)

if import_end < 0:
    print("ERROR: end marker not found!")
    import sys; sys.exit(1)

new_import = '''
  importFromExcel(event) {
    event.preventDefault();
    const file = document.getElementById('importFile').files[0];
    if (!file) { alert('请选择文件'); return; }

    const replaceMode = document.getElementById('importModeReplace').checked;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});

        const assetSheetName = workbook.SheetNames.find(n => n.includes('资产')) || '资产台账';
        const liabSheetName = workbook.SheetNames.find(n => n.includes('负债')) || '负债台账';

        const readSheet = (sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) return [];
          const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
          const rows = [];
          for (let r = 0; r <= range.e.r; r++) {
            const row = [];
            for (let c = 0; c <= range.e.c; c++) {
              const cell = sheet[XLSX.utils.encode_cell({r, c})];
              row.push(cell ? (cell.v || '') : '');
            }
            rows.push(row);
          }
          return rows;
        };

        const assetRows = readSheet(assetSheetName);

        // Section types:
        // Type1 (自用房产/投资性x房): E=万元/㎡, F=㎡, G=E*F
        // Type2 (自用车辆/自用其他): E=买入总价(万元), F=0
        // Type3+ (收藏品/股票/REITs/债券/基金): E=元, F=数量, G=E*F/10000

        const newAssets = [];
        let assetCounter = this.data.assets.length;
        let currentMainSection = '';
        let currentSubsection = '';

        for (let r = 3; r < assetRows.length; r++) {
          const row = assetRows[r];
          const aVal = String(row[0] || '').trim();
          const cVal = String(row[2] || '').trim();
          const gVal = parseFloat(row[6]) || 0;

          if (!aVal || aVal === 'nan' || aVal.includes('小计') || aVal.includes('合计') || !cVal || cVal === 'nan' || cVal === 'XXXXXX' || gVal <= 0) continue;

          if (aVal === '实物资产' || aVal === '金融资产') {
            currentMainSection = aVal;
            currentSubsection = String(row[2] || '').trim();
            continue;
          }

          let hasSeparatePriceArea = true;
          if (currentSubsection.includes('自用车辆') || currentSubsection.includes('自用其他')) {
            hasSeparatePriceArea = false;
          }

          let assetType = 'financial', assetCat = 'other';
          if (currentMainSection === '实物资产') {
            if (currentSubsection.includes('自用房产')) { assetType = 'selfUse'; assetCat = 'selfUseRealEstate'; }
            else if (currentSubsection.includes('自用车辆')) { assetType = 'selfUse'; assetCat = 'selfUseVehicle'; }
            else if (currentSubsection.includes('自用其他')) { assetType = 'selfUse'; assetCat = 'selfUseOther'; }
            else { assetType = 'investment'; assetCat = 'investmentRealEstate'; }
          } else if (currentMainSection === '金融资产') {
            if (currentSubsection.includes('股票资产')) { assetType = 'financial'; assetCat = 'stock'; }
            else if (currentSubsection.includes('基金资产')) { assetType = 'financial'; assetCat = 'fund'; }
            else if (currentSubsection.includes('股权资产')) { assetType = 'financial'; assetCat = 'equity'; }
            else if (currentSubsection.includes('衍生金融资产')) { assetType = 'financial'; assetCat = 'other'; }
            else if (currentSubsection.includes('债券资产')) { assetType = 'financial'; assetCat = 'bond'; }
            else if (currentSubsection.includes('现金')) { assetType = 'financial'; assetCat = 'cash'; }
            else { assetType = 'financial'; assetCat = 'other'; }
          }

          assetCounter++;
          const id = 'A' + String(assetCounter).padStart(3, '0');
          const bVal = String(row[1] || '').trim();
          const dVal = parseInt(row[3]) || new Date().getFullYear();
          let eVal = 0, fVal = 0;

          if (hasSeparatePriceArea) {
            eVal = parseFloat(row[4]) || 0;
            fVal = parseFloat(row[5]) || 0;
          }

          const totalPrice = parseFloat(row[6]) || 0;
          const hVal = parseFloat(row[7]) || 0;
          const iVal = parseFloat(row[8]) || 0;
          const jVal = parseFloat(row[9]) || 0;

          let cumulativeHoldReturn = hVal;
          let initTotalPrice = iVal;
          let cumulativeDisposeReturn = jVal;

          // 收藏品: H=持有数量, I=成本单价(元), J=2023末单价(元)
          if (currentSubsection.includes('收藏品')) {
            const qty = parseFloat(row[7]) || 0;
            const costUnit = parseFloat(row[8]) || 0;
            const endUnit = parseFloat(row[9]) || 0;
            cumulativeHoldReturn = (endUnit - costUnit) * qty / 10000;
            initTotalPrice = parseFloat(row[10]) || 0;
          } else if (currentSubsection.includes('自用车辆') || currentSubsection.includes('自用其他')) {
            cumulativeHoldReturn = 0;
            initTotalPrice = 0;
            cumulativeDisposeReturn = 0;
          }

          newAssets.push({
            id,
            type: assetType,
            category: assetCat,
            city: assetType === 'financial' ? bVal : '',
            name: cVal,
            buyYear: dVal,
            buyPricePerSqm: eVal,
            area: fVal,
            buyTotalPrice: totalPrice,
            initialized: cumulativeHoldReturn !== 0 || initTotalPrice !== 0 || cumulativeDisposeReturn !== 0,
            initData: (cumulativeHoldReturn !== 0 || initTotalPrice !== 0 || cumulativeDisposeReturn !== 0) ? {
              cumulativeHoldReturn,
              initTotalPrice,
              cumulativeDisposeReturn
            } : null
          });
        }

        // Liabilities
        const liabRows = readSheet(liabSheetName);
        const newLiabs = [];
        let liabCounter = this.data.liabilities.length;
        for (let r = 3; r < liabRows.length; r++) {
          const row = liabRows[r];
          const aVal = String(row[0] || '').trim();
          const cVal = String(row[2] || '').trim();
          const fVal = parseFloat(row[5]) || 0;
          if (!aVal || aVal === 'nan' || aVal.includes('小计') || aVal.includes('合计') || !cVal || cVal === 'nan' || cVal === 'XXXXXX' || fVal <= 0) continue;
          liabCounter++;
          const id = 'L' + String(liabCounter).padStart(3, '0');
          const bVal = String(row[1] || '').trim();
          const dVal = parseInt(row[3]) || new Date().getFullYear();
          const eVal = parseFloat(row[4]) || 0;
          const hVal = parseFloat(row[7]) || 0;
          const iVal = parseFloat(row[8]) || 0;
          const jVal = parseFloat(row[9]) || 0;
          newLiabs.push({
            id,
            type: bVal || 'bank',
            creditor: cVal,
            buyYear: dVal,
            interestRate: eVal,
            borrowAmount: fVal,
            remainingMonths: 0,
            initialized: hVal !== 0 || iVal !== 0 || jVal !== 0,
            initData: (hVal !== 0 || iVal !== 0 || jVal !== 0) ? {
              initBorrowAmount: hVal,
              cumulativeUnpaidInterest: iVal,
              cumulativePaidInterest: jVal
            } : null
          });
        }

        if (replaceMode) {
          this.data.assets = newAssets;
          this.data.liabilities = newLiabs;
        } else {
          const existingAssetIds = new Set(this.data.assets.map(a => a.id));
          const existingLiabIds = new Set(this.data.liabilities.map(l => l.id));
          newAssets.forEach(a => { if (!existingAssetIds.has(a.id)) this.data.assets.push(a); });
          newLiabs.forEach(l => { if (!existingLiabIds.has(l.id)) this.data.liabilities.push(l); });
        }

        DataLayer.save(this.data);
        alert('导入成功！\\n资产：' + newAssets.length + ' 条\\n负债：' + newLiabs.length + ' 条');
        this.renderAssets();
      } catch(err) {
        alert('导入失败：' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  },'''

print(f"Found function at index {import_start}, ending at {import_end}")
print(f"Old function length: {import_end - import_start}")

content = content[:import_start] + new_import + content[import_end:]
with open('scripts/app.js', 'w') as f:
    f.write(content)
print("Done")
