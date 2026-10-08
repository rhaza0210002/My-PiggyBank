import { describe, expect, it } from 'vitest';
import { urlBase64ToUint8Array } from '@/utils/pushKeys';

describe('clé publique VAPID', () => {
  it('décode le base64url (sans remplissage, avec - et _)', () => {
    // 0xFB 0xFF 0xBE en base64url = "-_--"
    expect(Array.from(urlBase64ToUint8Array('-_--'))).toEqual([0xfb, 0xff, 0xbe]);
  });

  it('ajoute le remplissage manquant', () => {
    expect(Array.from(urlBase64ToUint8Array('YWI'))).toEqual([97, 98]);
  });
});
