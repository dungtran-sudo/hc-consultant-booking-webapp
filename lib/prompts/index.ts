import { FormData } from '../types';
import { buildNhiPrompt } from './nhi';
import { buildDaLieuPrompt } from './da-lieu';
import { buildSinhSanPrompt } from './sinh-san';
import { buildStdStiPrompt } from './std-sti';
import { buildTieuHoaPrompt } from './tieu-hoa';
import { buildTimMachPrompt } from './tim-mach';
import { buildCoXuongKhopPrompt } from './co-xuong-khop';
import { buildTaiMuiHongPrompt } from './tai-mui-hong';
import { buildMatPrompt } from './mat';
import { buildNamKhoaPrompt } from './nam-khoa';
import { buildTiemChungPrompt } from './tiem-chung';
import { buildXetNghiemPrompt } from './xet-nghiem';

export function buildPrompt(specialty: string, formData: FormData): string {
  switch (specialty) {
    case 'nhi': return buildNhiPrompt(formData);
    case 'da-lieu': return buildDaLieuPrompt(formData);
    case 'sinh-san': return buildSinhSanPrompt(formData);
    case 'std-sti': return buildStdStiPrompt(formData);
    case 'tieu-hoa': return buildTieuHoaPrompt(formData);
    case 'tim-mach': return buildTimMachPrompt(formData);
    case 'co-xuong-khop': return buildCoXuongKhopPrompt(formData);
    case 'tai-mui-hong': return buildTaiMuiHongPrompt(formData);
    case 'mat': return buildMatPrompt(formData);
    case 'nam-khoa': return buildNamKhoaPrompt(formData);
    case 'tiem-chung': return buildTiemChungPrompt(formData);
    case 'xet-nghiem': return buildXetNghiemPrompt(formData);
    default: throw new Error(`Unknown specialty: ${specialty}`);
  }
}
