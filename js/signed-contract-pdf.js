/* Ozzsound signed agreement PDF export. Runs entirely in the customer's browser. */
(function(){
  function clean(value){return String(value==null?'':value).replace(/\\n/g,'\n').replace(/\r\n?/g,'\n');}
  function money(value){return new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(value||0));}
  function date(value){return value?new Date(value).toLocaleString('en-AU',{dateStyle:'medium',timeStyle:'short'}):'Not recorded';}
  function makeFilename(ref,type){return ('Ozzsound-'+(ref||'agreement')+'-'+type+'-signed.pdf').replace(/[^a-zA-Z0-9._-]/g,'-');}
  async function download(agreement,kind){
    if(!agreement?.signed_at||!agreement?.terms_acknowledged)throw new Error('Only signed agreements can be downloaded.');
    if(!window.jspdf?.jsPDF)throw new Error('PDF library is unavailable. Please check your connection and try again.');
    const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'});
    const width=210,left=18,right=18,usable=width-left-right;
    let y=18; const pageBottom=278;
    function pageIfNeeded(height){if(y+height>pageBottom){doc.addPage();y=18;}}
    function line(text,fontSize=10,bold=false,space=5){
      doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(fontSize);
      const parts=doc.splitTextToSize(clean(text),usable);
      const h=fontSize*0.45+1;
      for(const part of parts){pageIfNeeded(h);doc.text(part,left,y);y+=h;}
      y+=space;
    }
    function pair(label,value){line(label+': '+clean(value),10,false,2);}
    doc.setTextColor(32,25,49);line('OZZSOUND MOBILE MUSIC',17,true,4);
    line(kind==='gear_hire'?'SIGNED GEAR HIRE AGREEMENT':'SIGNED WEDDING AGREEMENT',13,true,6);
    doc.setDrawColor(160,80,215);doc.line(left,y,width-right,y);y+=9;
    pair('Reference',agreement.enquiry_ref||agreement.enquiry_id);
    pair('Customer',agreement.hirer_name||agreement.client_name||'');
    pair('Email',agreement.hirer_email||agreement.email||'');
    pair('Event / hire date',agreement.hire_date||agreement.wedding_date||'');
    pair('Venue',agreement.venue||agreement.reception_venue||agreement.ceremony_venue||'');
    pair('Total agreed price',money(agreement.total_price));
    if(kind==='gear_hire')pair('Payable upfront',money(agreement.payment_due??agreement.total_price));
    else{pair('Deposit',money(agreement.deposit_amount));pair('Balance',money(agreement.balance_due));pair('Added extras',money(agreement.added_extras_total));}
    y+=5;line('AGREED CONTRACT TERMS',12,true,4);
    const terms=clean(agreement.contract_snapshot||'');
    if(!terms.trim())throw new Error('The signed agreement has no saved contract terms.');
    for(const paragraph of terms.split('\n')){if(!paragraph.trim()){y+=3;continue;}line(paragraph,9,false,2);}
    pageIfNeeded(38);y+=5;doc.setDrawColor(160,80,215);doc.line(left,y,width-right,y);y+=9;
    line('DIGITAL SIGNATURE',12,true,4);
    pair('Signed by',agreement.signature_name||agreement.signature_text||'Not recorded');
    pair('Signed at',date(agreement.signed_at));
    pair('Terms acknowledged',agreement.terms_acknowledged?'Yes':'No');
    if(agreement.hirer_address||agreement.address)pair('Address',agreement.hirer_address||agreement.address);
    const pages=doc.getNumberOfPages();
    for(let p=1;p<=pages;p++){doc.setPage(p);doc.setFontSize(8);doc.setTextColor(110);doc.text('Ozzsound signed agreement | Page '+p+' of '+pages,left,290);}
    doc.save(makeFilename(agreement.enquiry_ref,kind));
  }
  window.OzzsoundSignedPDF={download};
})();