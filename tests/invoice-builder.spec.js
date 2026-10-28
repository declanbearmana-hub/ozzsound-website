const { test, expect } = require('@playwright/test');
test('invoice builder requires admin access and calculates correctly for a manual customer', async ({page}) => {
  await page.goto('/index.html');
  await page.evaluate(() => {
    document.body.innerHTML = '<main class="admin-content"></main>';
    const rows=[];
    window.__invoiceRows = rows;
    window.OZZSOUND_ADMIN_CLIENT = {
      auth: { getUser: async()=>({data:{user:{id:'test-admin'}}}) },
      rpc: async()=>({data:true}),
      from: (table)=>({
        select: () => ({
          order: async()=>({data:table==='invoices'?rows:[],error:null}),
          single: async()=>({data:rows[rows.length-1],error:null})
        }),
        insert: (record)=>({select:()=>({single:async()=> {
          const item={...record,id:'invoice-1',invoice_number:'OZZ-000001'};
          rows.push(item);return {data:item,error:null};
        }})})
      })
    };
  });
  await page.addScriptTag({url:'/admin/invoice-module.js'});
  await page.evaluate(()=>window.OzzsoundInvoices.open());
  await expect(page.locator('#ozzInvoiceWorkspace')).toContainText('Create Tax Invoice');
  await page.locator('[data-key="customer_name"]').fill('Test Customer');
  await page.locator('[data-item="0"][data-col="rate"]').fill('100');
  await expect(page.locator('#ivPaper')).toContainText('$100.00');
  await page.locator('[data-key="gst_enabled"]').selectOption('true');
  await expect(page.locator('#ivPaper')).toContainText('$10.00');
  await page.locator('[data-key="deposit"]').fill('20');
  await expect(page.locator('#ivPaper')).toContainText('$90.00');
  await page.locator('#ivSave').click();
  await expect(page.locator('#ivMessage')).toContainText('OZZ-000001');
});
test('non-admin cannot open the invoice workspace', async ({page}) => {
  await page.goto('/index.html');
  await page.evaluate(()=>{
    document.body.innerHTML='<main class="admin-content"></main>';
    window.OZZSOUND_ADMIN_CLIENT={
      auth:{getUser:async()=>({data:{user:{id:'not-admin'}}})},
      rpc:async()=>({data:false})
    };
    window.alert=()=>{};
  });
  await page.addScriptTag({url:'/admin/invoice-module.js'});
  await page.evaluate(()=>window.OzzsoundInvoices.open());
  await expect(page.locator('#ozzInvoiceWorkspace')).toHaveCount(0);
});