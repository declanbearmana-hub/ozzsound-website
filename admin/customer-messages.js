(() => {
  'use strict';

  let messages = [];

  const esc = value => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  const when = value => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-AU', {
      day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'
    });
  };

  function phoneHref(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const clean = raw.replace(/[^0-9+]/g, '');
    return clean ? `tel:${clean}` : '';
  }

  function render() {
    const host = document.getElementById('customerMessageThread');
    if (!host) return;
    if (!messages.length) {
      host.innerHTML = '<div class="info-banner">No customer messages have been sent from Admin yet.</div>';
      return;
    }
    host.innerHTML = messages.map(row => {
      const outgoing = String(row.direction || 'outbound') === 'outbound';
      return `<div style="max-width:88%;margin:${outgoing?'10px 0 10px auto':'10px auto 10px 0'};padding:13px 15px;border-radius:14px;border:1px solid ${outgoing?'rgba(168,85,247,.32)':'rgba(34,211,238,.32)'};background:${outgoing?'rgba(168,85,247,.08)':'rgba(34,211,238,.07)'}">
        <div style="display:flex;justify-content:space-between;gap:12px;color:#9292a3;font-size:11px;margin-bottom:6px"><strong style="color:${outgoing?'#d9b6ff':'#9aeaff'}">${outgoing?'OzzSound → Customer':'Customer → OzzSound'}</strong><span>${esc(when(row.created_at))}</span></div>
        ${row.subject ? `<div style="font-weight:800;margin-bottom:5px">${esc(row.subject)}</div>` : ''}
        <div style="white-space:pre-wrap;line-height:1.55">${esc(row.body || '')}</div>
        ${row.status ? `<div style="margin-top:7px;color:#9292a3;font-size:10px;text-transform:uppercase">${esc(row.status)}</div>` : ''}
      </div>`;
    }).join('');
  }

  async function load(enquiryId) {
    messages = [];
    const client = window.OZZSOUND_ADMIN_CLIENT;
    if (!client || !enquiryId) return;
    const { data, error } = await client.from('enquiry_messages')
      .select('id,enquiry_id,direction,from_email,to_email,subject,body,status,provider_message_id,in_reply_to,created_at,sent_at,received_at')
      .eq('enquiry_id', enquiryId)
      .order('created_at', { ascending:true });
    if (error) {
      console.error('Communication thread load failed:', error);
      messages = [];
    } else messages = data || [];
  }

  function html(enquiry) {
    const call = phoneHref(enquiry?.phone);
    return `<div class="section-card" id="customerCommunicationCard">
      <div class="section-head"><div><h3>Customer Communication</h3><p>Messages sent from Admin are saved against this exact enquiry. Incoming email replies will be added here once reply matching is enabled.</p></div></div>
      <div id="customerMessageThread" style="margin-bottom:16px"></div>
      <label for="customerMessageSubject">Subject</label>
      <input id="customerMessageSubject" type="text" maxlength="180" value="${esc('OzzSound — ' + (enquiry?.enquiry_ref || 'your enquiry'))}">
      <label for="customerMessageBody">Message to customer</label>
      <textarea id="customerMessageBody" maxlength="8000" placeholder="Write your question or update here..."></textarea>
      <div class="workflow-actions" style="margin-top:12px">
        <button type="button" class="action-button action-send" id="sendCustomerMessageButton">Send Message</button>
        ${call ? `<a class="action-button action-review" href="${esc(call)}" style="text-decoration:none">☎ Call Customer</a>` : ''}
      </div>
      <div id="customerMessageStatus" style="margin-top:9px;color:#9292a3;font-size:12px"></div>
    </div>`;
  }

  async function send(enquiry) {
    const client = window.OZZSOUND_ADMIN_CLIENT;
    const button = document.getElementById('sendCustomerMessageButton');
    const status = document.getElementById('customerMessageStatus');
    const subject = document.getElementById('customerMessageSubject')?.value.trim() || '';
    const body = document.getElementById('customerMessageBody')?.value.trim() || '';
    if (!enquiry?.email) { alert('This enquiry does not have a customer email address.'); return; }
    if (!body) { alert('Write a message first.'); return; }
    if (!confirm(`Send this message to ${enquiry.email}?\n\nIt will be saved in this enquiry's communication thread.`)) return;
    if (button) { button.disabled = true; button.textContent = 'Sending...'; }
    if (status) status.textContent = 'Sending and saving to this enquiry...';
    try {
      const { data, error } = await client.functions.invoke('send-customer-message', { body:{ enquiry_id:enquiry.id, subject, message:body } });
      if (error) throw error;
      if (data?.success !== true) throw new Error(data?.error || 'Message could not be sent.');
      await load(enquiry.id);
      render();
      const field = document.getElementById('customerMessageBody');
      if (field) field.value = '';
      if (status) { status.style.color = '#35e6a5'; status.textContent = 'Message sent and saved to this enquiry ✓'; }
    } catch (error) {
      console.error('Customer message failed:', error);
      if (status) { status.style.color = '#ff9aaa'; status.textContent = error?.message || 'Message could not be sent.'; }
    } finally {
      if (button) { button.disabled = false; button.textContent = 'Send Message'; }
    }
  }

  window.OzzsoundCustomerMessages = {
    load,
    html,
    bind(enquiry) {
      render();
      document.getElementById('sendCustomerMessageButton')?.addEventListener('click', () => send(enquiry));
    }
  };
})();