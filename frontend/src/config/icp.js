export const beianUrl = "https://beian.miit.gov.cn/";

export const defaultIcpRecord = "蜀ICP备2024079726号-1";

export const icpRecordByHostname = {
  "zyhm.fun": "蜀ICP备2024079726号-1",
  "www.zyhm.fun": "蜀ICP备2024079726号-1",
  "huamian.fun": "蜀ICP备2024079726号-2",
  "www.huamian.fun": "蜀ICP备2024079726号-2",
};

export function getIcpRecord(hostname) {
  const normalizedHostname = String(hostname ?? "")
    .trim()
    .toLowerCase();

  return icpRecordByHostname[normalizedHostname] ?? defaultIcpRecord;
}

export function getCurrentIcpRecord() {
  if (typeof window === "undefined") {
    return defaultIcpRecord;
  }

  return getIcpRecord(window.location.hostname);
}
