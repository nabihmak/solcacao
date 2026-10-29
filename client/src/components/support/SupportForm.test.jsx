import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { LanguageProvider } from '../../i18n/LanguageContext';
import SupportForm from './SupportForm';
let host, root;
beforeEach(() => {globalThis.IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(() => {act(()=>root.unmount());host.remove();sessionStorage.clear();});
function render(type) {act(()=>root.render(<LanguageProvider><SupportForm type={type}/></LanguageProvider>));}
function set(id,value) {
 const input=host.querySelector('#'+id);
 act(()=>{const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:input.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,value);input.dispatchEvent(new Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));});
}
function submit(){act(()=>host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));}
it('renders errors on an empty contact form',()=>{render('contact');submit();expect(host.querySelector('[role=alert]').textContent).toContain('correct');expect(host.querySelector('#contact-email').getAttribute('aria-invalid')).toBe('true');expect(sessionStorage.length).toBe(0);});
it.each(['contact','feedback','sampler'])('validates and resets the %s UI',type=>{
 render(type);set(type+'-name','Ana');set(type+'-email','ana@example.com');set(type+'-category','support');set(type+'-message','A valid inquiry about cacao.');act(()=>host.querySelector('#'+type+'-consent').click());
 if(type==='feedback')set('feedback-rating','5');
 if(type==='sampler') for(const input of [...host.querySelectorAll('fieldset input')].slice(0,3))act(()=>input.click());
 submit();expect(host.querySelector('[role=status]').textContent).toContain('Your request is ready');expect(sessionStorage.getItem('solcacao-support-receipt')).not.toContain('ana@example.com');act(()=>host.querySelector('button[type=button]').click());expect(host.querySelector('#'+type+'-name').value).toBe('');expect(host.querySelector('[role=status]').textContent).toBe('');
});
