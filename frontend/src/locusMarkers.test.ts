import {describe,it,expect} from 'vitest';
import {locusMarkers} from './locusMarkers';
describe('root locus landmarks',()=>{
 it('marks conjugate crossings with their critical gain',()=>{const [crossing]=locusMarkers({crossings:[{omega:Math.sqrt(2),k:6}],breakaways:[]});expect(crossing.x).toEqual([0,0]);expect(crossing.y).toEqual([Math.sqrt(2),-Math.sqrt(2)]);expect(crossing.customdata).toEqual([6,6])});
 it('keeps breakaway coordinates and gain',()=>{const [,rupture]=locusMarkers({crossings:[],breakaways:[{re:-.42265,im:0,k:.3849}]});expect(rupture.x).toEqual([-.42265]);expect(rupture.customdata).toEqual([.3849])});
 it('does not invent points when none exist',()=>{for(const trace of locusMarkers({crossings:[],breakaways:[]})){expect(trace.x).toEqual([]);expect(trace.y).toEqual([])}});
});
