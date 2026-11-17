/**
 * Frontend Label Extraction Engine (Universal Integration)
 */
import { extractGlobalMachineInfo } from './universalLabelParser';

export function extractLabelData(text) {
  const result = extractGlobalMachineInfo(text);
  return {
    ...result,
    serialNo: result.serialNo,
    model: result.model,
    productCompany: result.productCompany,
    rawText: result.rawText
  };
}

export { extractGlobalMachineInfo };
