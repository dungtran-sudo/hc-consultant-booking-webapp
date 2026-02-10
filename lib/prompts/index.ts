import { FormData } from '../types';
import { buildNhiPrompt } from './nhi';
import { buildDaLieuPrompt } from './da-lieu';
import { buildSinhSanPrompt } from './sinh-san';
import { buildStdStiPrompt } from './std-sti';
import { buildTieuHoaPrompt } from './tieu-hoa';

export function buildPrompt(specialty: string, formData: FormData): string {
  switch (specialty) {
    case 'nhi': return buildNhiPrompt(formData);
    case 'da-lieu': return buildDaLieuPrompt(formData);
    case 'sinh-san': return buildSinhSanPrompt(formData);
    case 'std-sti': return buildStdStiPrompt(formData);
    case 'tieu-hoa': return buildTieuHoaPrompt(formData);
    default: throw new Error(`Unknown specialty: ${specialty}`);
  }
}
