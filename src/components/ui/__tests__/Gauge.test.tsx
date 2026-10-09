import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Gauge from '@/components/ui/Gauge';

describe('Gauge', () => {
  it('expose la progression aux lecteurs d’écran', () => {
    const html = renderToStaticMarkup(<Gauge value={3} max={10} label="Opérations pointées" valueText="3 sur 10" />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="3"');
    expect(html).toContain('aria-valuemax="10"');
    expect(html).toContain('aria-valuetext="3 sur 10"');
    expect(html).toContain('width:30%');
  });

  it('ne plante pas et reste à 0 % quand le maximum est nul', () => {
    const html = renderToStaticMarkup(<Gauge value={2} max={0} label="Vide" />);
    expect(html).toContain('width:0%');
  });

  it('plafonne à 100 % quand la valeur dépasse le maximum', () => {
    expect(renderToStaticMarkup(<Gauge value={25} max={10} label="Trop" />)).toContain('width:100%');
  });
});
